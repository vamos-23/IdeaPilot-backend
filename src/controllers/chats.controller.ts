import { Request, Response } from "express";
import { EmbeddingService } from "../services/ai/embedding.service";
import { SemanticSearchService } from "../services/retrieval/semanticSearch.service";
import { ChatContextService } from "../services/context/chatContext.service";
import { ChatService } from "../services/chat/chats.chatService";
import { ProjectStateService } from "../services/project/projectState.service";
import { RuntimeContextService } from "../services/context/runtimeContext.service";
import { AIService } from "../services/ai/ai.service";
import { ProjectResponseService } from "../services/project/projectResponse.service";
import { ConversationService } from "../services/chat/conversation.service";
import generateSystemPrompt from "../services/generateSystemPrompt";

export async function streamChat(req: Request, res: Response) {
  const { chatId } = req.params;
  const { userMessageId, assistantMessageId, prompt, techStack } = req.body;
  const uid = req.user.uid;

  if (!uid || !chatId || !prompt || !userMessageId || !assistantMessageId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  try {
    const userEmbeddings = await EmbeddingService.generateEmbeddings(prompt);
    const { semanticContext, recentMessages } =
      await SemanticSearchService.retrieveContext(chatId, userEmbeddings);

    const chatContext = await ChatContextService.getContext(chatId);

    const currentProject = await ProjectStateService.getCurrentProject(
      chatContext.latestPreviewMessageId,
    );
    const runtimeContext =
      RuntimeContextService.buildRuntimeContext(currentProject);

    const preferredTechStack = Array.isArray(techStack) ? techStack : [];
    const systemPrompt = generateSystemPrompt(preferredTechStack);

    const aiResponse = await AIService.generateAIResponse(
      systemPrompt,
      runtimeContext,
      semanticContext.map((msg) => msg.content).join("\n"),
      recentMessages,
      prompt,
    );
    const processedResponse = await ProjectResponseService.processResponse(
      chatId,
      assistantMessageId,
      chatContext.projectId,
      aiResponse,
    );

    await ConversationService.saveConversation(
      chatId,
      uid,
      userMessageId,
      assistantMessageId,
      prompt,
      userEmbeddings,
      processedResponse.finalContent,
    );

    if (processedResponse.finalContent.includes("This goes out my scope.")) {
      res.status(200).json({
        text: "This goes out my scope. Please try a query related to project ideas or tech stacks after sometime.",
      });
      return;
    }
    res.status(200).json({ text: processedResponse.finalContent });
  } catch (error) {
    console.error("Response Generation / DB save error:", error);
    res.status(500).json({ error: "Failed to process or save chat message" });
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
    const [messageList, chatContext] = await Promise.all([
      ChatService.getMessagesForChat(chatId, limit + 1, cursor),
      ChatContextService.getContext(chatId),
    ]);

    const messagesLength = messageList.length;
    const hasNextPage = messagesLength > limit;
    if (hasNextPage) messageList.pop();
    const nextCursor = hasNextPage
      ? messageList[messageList.length - 1].id
      : null;

    res.json({
      messages: messageList,
      nextCursor,
      latestPreviewId: chatContext.latestPreviewMessageId,
    });
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
    await ChatContextService.invalidateContext(chatId);
    res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully!" });
  } catch (error) {
    console.error("Chat deletion error:", error);
    res.status(500).json({ success: false, error: "Failed to delete chat." });
  }
}
