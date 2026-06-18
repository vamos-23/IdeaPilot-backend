import { Request, Response } from "express";
import { ChatService } from "../services/chats.chatService";
import { ChatProcess } from "../services/chats.processing";

export async function streamChat(req: Request, res: Response) {
  const { chatId } = req.params;
  const { userMessageId, assistantMessageId, prompt } = req.query as {
    userMessageId: string;
    assistantMessageId: string;
    prompt: string;
  };
  const uid = req.user.uid;

  if (!uid || !chatId || !userMessageId || !assistantMessageId || !prompt) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }
  let connectionAliveInterval: NodeJS.Timeout | null = null;

  req.on("close", () => {
    if (connectionAliveInterval) clearInterval(connectionAliveInterval);
    res.end();
  });
  // SSE connection
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      Pragma: "no-cache",
      Expires: 0,
    });

    connectionAliveInterval = setInterval(() => {
      res.write(":\n\n");
    }, 20000);

    const userEmbedding = await ChatProcess.generateEmbeddings(prompt);
    const [semanticSearches, recentMessages] =
      await ChatProcess.retrieveContext(chatId, userEmbedding);

    //extract the context-aware embedding tokens and attach to AI generation request
    const systemInstruction = `You are an expert AI assistant. Keep the response a bit short yet explanatory. Context:\n${semanticSearches.map((m) => m.content).join("\n")}`;
    const stream = await ChatProcess.aiResponseStream(
      systemInstruction,
      recentMessages,
      prompt,
    );

    let fullAiResponse = " ";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (!content) continue;
      fullAiResponse += content;
      res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
    }
    if (connectionAliveInterval) {
      clearInterval(connectionAliveInterval);
    }
    await ChatProcess.saveConversation(
      chatId,
      userMessageId,
      assistantMessageId,
      uid,
      prompt,
      userEmbedding,
      fullAiResponse,
    );
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error("Streaming error:", error);
    if (connectionAliveInterval) clearInterval(connectionAliveInterval);
    res.write(
      `data: ${JSON.stringify({ error: "Failed to stream response" })}\n\n`,
    );
    res.end();
  }
}

export async function getChats(req: Request, res: Response): Promise<void> {
  try {
    const chats = await ChatService.getChatsForUser(req.user.uid);
    res.json(chats);
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
}

export async function togglePin(req: Request, res: Response): Promise<void> {
  const { chatId } = req.params;
  const { isPinned } = req.body;
  const uid = req.user.uid;

  if (typeof isPinned !== "boolean") {
    res
      .status(400)
      .json({ error: "Invalid payload: isPinned must be a boolean" });
    return;
  }

  try {
    const result = await ChatService.toggleChatPinStatus(chatId, uid, isPinned);
    if (result.length === 0) {
      res.status(404).json({
        error: "Chat not found or unauthorized pin operation attempted",
      });
      return;
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Chat pinning failure:", error);
    res
      .status(500)
      .json({ error: `Failed to ${isPinned ? "pin" : "unpin"} chat` });
  }
}

export async function rename(req: Request, res: Response): Promise<void> {
  const { chatId } = req.params;
  const { title } = req.body;
  const uid = req.user.uid;

  if (!title.trim()) {
    res.status(400).json({ error: "Invalid payload: title cannot be empty" });
    return;
  }
  if (typeof title !== "string") {
    res.status(400).json({ error: "Invalid payload: title must be a string" });
    return;
  }

  try {
    const result = await ChatService.renameChat(chatId, uid, title);
    if (result.length === 0) {
      res.status(404).json({
        error: "Chat not found or unauthorized rename operation attempted",
      });
      return;
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Chat rename failure:", error);
    res.status(500).json({ error: "Failed to rename chat" });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const { chatId } = req.params;
  const limit = 15;
  const cursor = req.query.cursor as string | undefined;

  try {
    const messageList = await ChatService.getMessagesForChat(
      chatId,
      limit,
      cursor,
    );

    const messagesLength = messageList.length;
    const hasNextPage = messagesLength > limit;
    if (hasNextPage) messageList.pop();
    const nextCursor = hasNextPage
      ? messageList[messagesLength - 1].createdAt
      : null;

    const sanitizedList = messageList.map((msg) => {
      const { createdAt, ...messageList } = msg;
      return messageList;
    });
    res.json({ messages: sanitizedList, nextCursor });
  } catch (error) {
    console.error(`Failed to fetch chat messages for chat-${chatId}:`, error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
}

export async function deleteChat(req: Request, res: Response) {
  const { chatId } = req.params;
  const uid = req.user.uid;
  try {
    const result = await ChatService.deleteChatForUser(chatId, uid);
    if (result.length === 0) {
      res
        .status(404)
        .json({ error: "Chat not found or unauthorized deletion attempted" });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully!" });
  } catch (error) {
    console.error("Chat deletion error:", error);
    res.status(500).json({ success: false, error: "Failed to delete chat." });
  }
}
