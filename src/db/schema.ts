//Schemas for AI Chat Screen
import {
  pgTable,
  vector,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("roleEnum", ["user", "model"]);

export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: text("title").default("AI Idea").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    chatId: varchar("chat_id", { length: 255 })
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id", { length: 255 }).notNull(),
    role: roleEnum("role").notNull(),
    content: text("message_content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
