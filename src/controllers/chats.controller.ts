import { Request, Response } from "express";
import { ChatService } from "../services/chats.service";

export async function streamChat(req: Request, res: Response) {
  const { chatId } = req.params;
  const { messageId, prompt } = req.query as {
    messageId?: string;
    prompt?: string;
  };
  const uid = req.user.uid;

  if (!uid || !chatId || !messageId || !prompt) {
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

    const userEmbedding = await ChatService.generateEmbeddings(prompt);
    const [semanticSearches, recentMessages] =
      await ChatService.retrieveContext(chatId, userEmbedding);

    //extract the context-aware embedding tokens and attach to AI generation request
    const systemInstruction = `You are an expert AI assistant. Keep the response a bit short yet explanatory. Context:\n${semanticSearches.map((m) => m.content).join("\n")}`;
    const stream = await ChatService.aiResponseStream(
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
    await ChatService.saveConversation(
      chatId,
      messageId,
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

export async function getMessages(req: Request, res: Response): Promise<void> {
  const { chatId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
  const cursor = req.query.cursor as string | undefined;

  try {
    const messageList = await ChatService.getMessagesForChat(
      chatId,
      limit,
      cursor,
    );
    let nextCursor = null;
    const messagesLength = messageList.length;
    if (messagesLength === limit) {
      nextCursor = messageList[messagesLength - 1].createdAt;
    }
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
