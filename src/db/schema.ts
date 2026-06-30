//Schemas for AI Chat Screen
import {
  pgTable,
  vector,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("roleEnum", ["user", "model"]);

export const chats = pgTable(
  "chats",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    title: text("title").default("AI Idea").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    projectId: varchar("project_id", {length: 255}).unique(),
    latestPreviewMessageId: varchar("latest_preview_message_id", {length: 26}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_chats_user_pinned_updated").on(
      table.userId,
      table.isPinned,
      table.updatedAt,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    chatId: varchar("chat_id", { length: 255 })
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id", { length: 255 }).notNull(),
    role: roleEnum("role").notNull(),
    content: text("message_content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_chat_id_created").on(table.chatId, table.createdAt),
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);