import Groq from "groq-sdk";
import { ChatMessage } from "../../types/types";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class AIService {
  static async generateAIResponse(
    systemPrompt: string,
    runtimeContext: string,
    semanticContext: string,
    recentMessages: ChatMessage[],
    userPrompt: string,
  ) {
    const systemInstruction = `
      ${systemPrompt}

      ${runtimeContext}

      =====================================
      SEMANTIC CONTEXT
      =====================================

      ${semanticContext}
      `;

    const promptMessages = [
      { role: "system", content: systemInstruction },
      ...recentMessages.map((msg) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: promptMessages as any,
      temperature: 0.4,
    });

    return response?.choices[0]?.message?.content || "";
  }
}
