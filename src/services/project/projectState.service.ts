import { ProjectIdea } from "../../types/types";
import { ProjectParser } from "./parseProject";
import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";

export class ProjectStateService {
  static async getCurrentProject(
    latestPreviewMessageId: string | null,
  ): Promise<ProjectIdea | null> {
    if (!latestPreviewMessageId) {
      return null;
    }
    const [message] = await db
      .select({
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.id, latestPreviewMessageId))
      .limit(1);

    if (!message) {
      return null;
    }

    const { project } = ProjectParser.parse(message.content);
    return project;
  }
}
