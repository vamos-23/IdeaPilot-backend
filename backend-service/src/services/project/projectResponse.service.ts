import crypto from "crypto";
import { ProjectParser } from "./parseProject";
import { AssistantResponseBuilder } from "./buildAssistantMessage";
import { ProjectResponseResult } from "../../types/types";
import { ChatContextService } from "../context/chatContext.service";

export class ProjectResponseService {
  static async processResponse(
    chatId: string,
    assistantMessageId: string,
    currentProjectId: string | null,
    rawResponse: string,
  ): Promise<ProjectResponseResult> {
    const { markdown, project } = ProjectParser.parse(rawResponse);
    if (!project) {
      return {
        finalContent: markdown,
      };
    }

    const projectId =
      currentProjectId ?? `proj_${crypto.randomUUID().replace(/-/g, "")}`;

    await ChatContextService.updateContext(
      chatId,
      projectId,
      assistantMessageId,
    );

    const finalContent = AssistantResponseBuilder.buildAssistantResponse(
      markdown,
      project,
      projectId,
      assistantMessageId,
    );

    return {
      finalContent,
    };
  }
}
