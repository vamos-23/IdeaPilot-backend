import { eq } from "drizzle-orm";
import { db } from "../../db";
import { chats } from "../../db/schema";
import { redis } from "../../redis/redis";
import { ChatContext } from "../../types/types";

export class ChatContextService {
  private static readonly REDIS_CHAT_PREFIX = "chat:";
  private static readonly PROJECT_TTL_SECONDS = 86400;
  private static readonly CHAT_TTL_SECONDS = 3600;

  private static getRedisKey(chatId: string): string {
    return `${this.REDIS_CHAT_PREFIX}${chatId}`;
  }

  private static getTTL(context: ChatContext): number {
    return context.projectId ? this.PROJECT_TTL_SECONDS : this.CHAT_TTL_SECONDS;
  }

  static async getContext(chatId: string): Promise<ChatContext> {
    const key = this.getRedisKey(chatId);
    //Serve from Redis cache
    try {
      const cached = await redis.get(key);
      if (cached) {
        const parsed: ChatContext = JSON.parse(cached);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "projectId" in parsed &&
          "latestPreviewMessageId" in parsed
        ) {
          redis.expire(key, this.getTTL(parsed)).catch((error) => {
            console.warn(
              `[ChatContextService] Failed to refresh TTL for ${key}:`,
              error,
            );
          });
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`[ChatContextService] Redis GET failed for ${key}:`, error);
    }

    //Fallback to DB
    const [chat] = await db
      .select({
        projectId: chats.projectId,
        latestPreviewMessageId: chats.latestPreviewMessageId,
      })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      return {
        projectId: null,
        latestPreviewMessageId: null,
      };
    }

    const context: ChatContext = {
      projectId: chat.projectId,
      latestPreviewMessageId: chat.latestPreviewMessageId,
    };

    try {
      await redis.set(key, JSON.stringify(context), "EX", this.getTTL(context));
    } catch (error) {
      console.warn(`[ChatContextService] Redis SET failed for ${key}:`, error);
    }
    return context;
  }

  static async updateContext(
    chatId: string,
    projectId: string,
    latestPreviewMessageId: string,
  ): Promise<void> {
    const key = this.getRedisKey(chatId);

    const [updatedChat] = await db
      .update(chats)
      .set({
        projectId: projectId,
        latestPreviewMessageId: latestPreviewMessageId,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning({
        projectId: chats.projectId,
        latestPreviewMessageId: chats.latestPreviewMessageId,
      });
    if (!updatedChat) {
      throw new Error(
        `Failed to update context for chat '${chatId}'. Chat does not exist.`,
      );
    }

    try {
      await redis.set(
        key,
        JSON.stringify(updatedChat),
        "EX",
        this.getTTL(updatedChat),
      );
    } catch (error) {
      console.warn(
        `[ChatContextService] Redis synchronization failed for ${key}:`,
        error,
      );
    }
  }

  //Invalidate the context when a chat is deleted -> effectively the message in it is also deleted
  static async invalidateContext(chatId: string): Promise<void> {
    const key = this.getRedisKey(chatId);
    try {
      await redis.del(key);
    } catch (error) {
      console.warn(`[ChatContextService] Redis DEL failed for ${key}`, error);
    }
  }
}
