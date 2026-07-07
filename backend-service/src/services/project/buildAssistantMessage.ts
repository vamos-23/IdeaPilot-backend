import { ProjectIdea } from "../../types/types";

export class AssistantResponseBuilder {
  static buildAssistantResponse(
    markdown: string,
    project: ProjectIdea | null,
    projectId: string | null,
    assistantMessageId: string | null,
  ): string {
    if (!project || !projectId) {
      return markdown;
    }

    const finalizedProject = {
      ...project,
      id: projectId,
      projectPreviewId: assistantMessageId,
    };

    return `${markdown}
    
    
    \`\`\`json_idea
    ${JSON.stringify(finalizedProject, null, 2)}
    \`\`\`
    `;
  }
}
