import { ParseProjectResponse, ProjectIdea } from "../../types/types";

export class ProjectParser {
  private static readonly regex = /```json_idea\s*([\s\S]*?)\s*```/;

  private static isValidProject(value: unknown): value is ProjectIdea {
    if (!value || typeof value !== "object") {
      return false;
    }
    const project = value as ProjectIdea;
    return (
      typeof project.name === "string" &&
      typeof project.domain === "string" &&
      typeof project.description === "string" &&
      typeof project.detailedDescription === "string" &&
      typeof project.category === "string" &&
      typeof project.difficulty === "string" &&
      typeof project.estimatedTime === "string" &&
      Array.isArray(project.techStack) &&
      Array.isArray(project.whatYouWillLearn)
    );
  }

  static parse(rawResponse: string): ParseProjectResponse {
    const match = rawResponse.match(this.regex);
    console.log(match);
    if (!match) {
      return {
        markdown: rawResponse.trim(),
        project: null,
      };
    }

    const markdown = rawResponse.replace(this.regex, "").trim();
    console.log(markdown)
    try {
      const parsed = JSON.parse(match[1].trim());
      if (!this.isValidProject(parsed)) {
        console.warn("[ProjectParser] Invalid json_idea received from LLM.");
        return {
          markdown,
          project: null,
        };
      }
      return {
        markdown,
        project: parsed,
      };
    } catch (error) {
      console.warn("[ProjectParser] Failed to parse json_idea:", error);
      return {
        markdown,
        project: null,
      };
    }
  }
}
