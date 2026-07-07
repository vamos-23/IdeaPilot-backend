import { db } from "../../db";
import { chats, messages } from "../../db/schema";
import { desc, eq, and, lt } from "drizzle-orm";

export class ChatService {
  static async getChatsForUser(uid: string) {
    return await db
      .select({
        id: chats.id,
        title: chats.title,
        isPinned: chats.isPinned,
      })
      .from(chats)
      .where(eq(chats.userId, uid))
      .orderBy(desc(chats.isPinned), desc(chats.updatedAt));
  }

  static async deleteChatForUser(chatId: string, uid: string) {
    const deletedId = await db
      .delete(chats)
      .where(and(eq(chats.userId, uid), eq(chats.id, chatId)))
      .returning({ deletedId: chats.id });
    return deletedId;
  }

  static async toggleChatPinStatus(
    chatId: string,
    uid: string,
    isPinned: boolean,
  ) {
    return await db
      .update(chats)
      .set({ isPinned: isPinned, updatedAt: new Date() })
      .where(and(eq(chats.id, chatId), eq(chats.userId, uid)))
      .returning();
  }

  static async renameChat(chatId: string, uid: string, newTitle: string) {
    return await db
      .update(chats)
      .set({ title: newTitle, updatedAt: new Date() })
      .where(and(eq(chats.id, chatId), eq(chats.userId, uid)))
      .returning();
  }

  static async getMessagesForChat(
    chatId: string,
    limit: number,
    cursor?: string,
  ) {
    const condition = [eq(messages.chatId, chatId)];
    if (cursor) condition.push(lt(messages.id, cursor));
    const query = db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(and(...condition))
      .orderBy(desc(messages.id))
      .limit(limit);

    const results = await query;
    return results;
  }
}
