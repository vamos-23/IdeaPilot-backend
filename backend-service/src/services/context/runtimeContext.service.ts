import { ProjectIdea } from "../../types/types";

export class RuntimeContextService {
  static buildRuntimeContext(project: ProjectIdea | null): string {
    if (!project) {
      return `
=====================================
RUNTIME CONTEXT
=====================================

Project Status: NEW

Rules

• No project exists in this chat.
• Help the user refine the project before finalizing it.
• Gather missing requirements instead of making assumptions.
• Until the user explicitly confirms, return only Markdown.
• After confirmation, return a finalized project followed immediately by exactly ONE \`json_idea\` block.

Project Data Format

\`\`\`json_idea
{
  "name": "...",
  "category": "...",
  "domain": "...",
  "description": "...",
  "detailedDescription": "...",
  "difficulty": "Beginner | Intermediate | Advanced",
  "estimatedTime": "...",
  "techStack": ["..."],
  "whatYouWillLearn": ["..."]
}
\`\`\`

Rules for the project data:

• The json_idea block must be the final content in the response.
• Never include "id" or "projectId".
• Generate exactly one complete project.
`.trim();
    }

    return `
=====================================
RUNTIME CONTEXT
=====================================

Project Status: EXISTING

Current Project

\`\`\`json_idea
${JSON.stringify(project, null, 2)}
\`\`\`

Rules

• The project above is the canonical state of this conversation.
• This conversation permanently represents exactly ONE software project.
• Apply all requested changes to the project above.
• Never create, replace or switch to another project.
• If the user requests a different software project, reply that a new chat is required and do not generate the new project.
• Distinguish between discussion requests and modification requests.
• If the user asks questions, requests explanations, comparisons, implementation guidance, architecture discussions, debugging help or other technical discussion about the current project, respond using Markdown only.
• Do NOT regenerate the project or append a json_idea block unless the project's data actually changes.
• Only regenerate the complete project and append exactly ONE updated json_idea block when the user explicitly requests a modification to the project's stored information.
• Preserve existing information unless the user explicitly changes it.
• If any stored field changes, regenerate all dependent fields to keep the project internally consistent.
• When regenerating the project, return the complete updated project followed immediately by the updated json_idea block.
• Use the exact same json_idea structure shown above.
• The updated json_idea block must be the final content in the response.
`.trim();
  }
}
