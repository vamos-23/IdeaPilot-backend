import { EmbeddingService } from "../ai/embedding.service";
import { db } from "../../db";
import { chats, messages } from "../../db/schema";
import { TitleGenerationService } from "../ai/title.service";

export class ConversationService {
  static async saveConversation(
    chatId: string,
    uid: string,
    userMessageId: string,
    assistantMessageId: string,
    userPrompt: string,
    userEmbedding: number[],
    finalAssistantResponse: string,
  ): Promise<void> {
    const assistantEmbedding = await EmbeddingService.generateEmbeddings(
      finalAssistantResponse,
    );

    await db.transaction(async (tx) => {
      await tx
        .insert(chats)
        .values({
          id: chatId,
          userId: uid,
        })
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
          content: finalAssistantResponse,
          embedding: assistantEmbedding,
        },
      ]);
    });

    TitleGenerationService.generateChatTitle(
      chatId,
      userPrompt,
      finalAssistantResponse,
    ).catch(console.error);
  }
}
