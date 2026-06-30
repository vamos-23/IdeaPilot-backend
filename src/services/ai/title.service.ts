import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chats } from "../../db/schema";
import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class TitleGenerationService {
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
      contents: `Summarize this chat into a punchy 3-5 word chat title. Return ONLY text. User: ${userPrompt}\nAI: ${aiResponse}`,
      config: { maxOutputTokens: 10, temperature: 0.5 },
    });

    const newTitle = response.text?.trim() ?? "AI Idea";
    await db.update(chats).set({ title: newTitle }).where(eq(chats.id, chatId));
  }
}
