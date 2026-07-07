export interface ProjectIdea {
  name: string;
  category: string;
  domain: string;
  description: string;
  detailedDescription: string;
  difficulty: string;
  estimatedTime: string;
  techStack: string[];
  whatYouWillLearn: string[];
}

export interface ChatContext {
  projectId: string | null;
  latestPreviewMessageId: string | null;
}

export interface ParseProjectResponse {
  markdown: string;
  project: ProjectIdea | null;
}

export interface ProjectResponseResult {
  finalContent: string;
}

export interface TechStackItem {
  stackName: string;
  id?: string;
  category?: string;
  icon?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}
