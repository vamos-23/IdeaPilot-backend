import { pipeline, env, mean_pooling } from "@huggingface/transformers";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { Stream } from "groq-sdk/core/streaming.js";
import { cosineDistance, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { chats, messages } from "../db/schema";

env.cacheDir = process.env.TRANSFORMER_CACHE || "./.models-cache";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
let embedder: any = null;

export class ChatProcess {
  static async init() {
    embedder = await pipeline(
      "feature-extraction",
      "nomic-ai/nomic-embed-text-v1.5",
      { dtype: "q8" },
    );
  }

  static async generateEmbeddings(text: string) {
    /* 
        -> mean_pooling: Generates a single vector representing all individual vectors for all tokens across different dimensions. It ensures all separate vectors contribute to the final meaning for vector operations.
        -> normalize: This ensures the vector is normalized by mapping it onto a unit sphere for blazing fast cosine similarity math operations and semantic searches across the DB. This prevents sentences / words with longer lengths having dominant absolute vector magnitudes to unfairly skew the similarity scores.
    */
    const output = await embedder(text, { pooling: "mean", normalize: true });
    const rawData = output.data || output[0].data || output.toList()[0];
    return Array.from(rawData) as number[];
  }

  static async retrieveContext(chatId: string, userEmbedding: number[]) {
    return await Promise.all([
      db
        .select({
          content: messages.content,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(cosineDistance(messages.embedding, userEmbedding)) //cosine similarity search using hnsw indexing
        .limit(3), //return top 3 most meaningful messages for long-term context
      db
        .select({
          role: messages.role,
          content: messages.content,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.createdAt))
        .limit(4), //return the last 4 recent messages for short-term context
    ]);
  }

  static async aiResponseStream(
    systemInstruction: string,
    recentMessages: any[],
    userPrompt: string,
  ): Promise<Stream<Groq.Chat.Completions.ChatCompletionChunk>> {
    const promptMessages = [
      { role: "system", content: systemInstruction },
      ...recentMessages.map((msg) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ];

    return await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: promptMessages as any,
      temperature: 0.4,
      stream: true,
    });
  }

  static async saveConversation(
    chatId: string,
    userMessageId: string,
    assistantMessageId: string,
    uid: string,
    userPrompt: string,
    userEmbedding: number[],
    aiResponse: string,
  ): Promise<void> {
    const aiEmbedding = await this.generateEmbeddings(aiResponse);
    /*upsert operation - prevents foreign key violation on chats table (before saving messages, the corresponding chat with its unique chatId must exist in chats table first!)*/
    await db.transaction(async (tx) => {
      await tx
        .insert(chats)
        .values({
          id: chatId,
          userId: uid,
        })
        /*updates the existing chat's "updatedAt" field for proper access when calling getChatsForUser() -> orders by desc(chats.updatedAt) (most recently updated chat is returned at the top in the drawer bar on chat screen)*/
        .onConflictDoUpdate({
          target: chats.id,
          set: {
            updatedAt: new Date(),
          },
        });

      await tx.insert(messages).values([
        {
          id: userMessageId,
          chatId,
          senderId: uid,
          role: "user",
          content: userPrompt,
          embedding: userEmbedding,
        },
        {
          id: assistantMessageId,
          chatId,
          senderId: "ideapilot-ai",
          role: "model",
          content: aiResponse,
          embedding: aiEmbedding,
        },
      ]);

      this.generateChatTitle(chatId, userPrompt, aiResponse).catch(
        console.error,
      );
    });
  }

  static async generateChatTitle(
    chatId: string,
    userPrompt: string,
    aiResponse: string,
  ): Promise<void> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat || chat.title !== "AI Idea") {
      return;
    }

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Summarize this chat into a punchy 3-5 word title and generate a chat title. Return ONLY text. User: ${userPrompt}\nAI: ${aiResponse}`,
      config: { maxOutputTokens: 10, temperature: 0.3 },
    });

    const newTitle = response.text?.trim() ?? "AI Idea";
    await db.update(chats).set({ title: newTitle }).where(eq(chats.id, chatId));
  }
}
