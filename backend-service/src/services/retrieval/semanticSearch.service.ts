import { db } from "../../db";
import { messages } from "../../db/schema";
import { cosineDistance, eq, desc } from "drizzle-orm";

export class SemanticSearchService {
  static async retrieveContext(chatId: string, userEmbedding: number[]) {
    const [semanticContext, recentMessages] = await Promise.all([
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
        .orderBy(desc(messages.id))
        .limit(4), //return the last 4 recent messages for short-term context
    ]);

    return { semanticContext, recentMessages };
  }
}
