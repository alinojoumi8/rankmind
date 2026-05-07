import OpenAI from "openai";

// MiniMax M2.7 is OpenAI-compatible — just swap the base URL and key
export const minimaxClient = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY!,
  baseURL: "https://api.minimax.io/v1",
});

export const MINIMAX_MODEL = "MiniMax-M2.7";

export interface MinimaxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function minimaxChat(
  messages: MinimaxMessage[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 4096, jsonMode = false } = options;

  const response = await minimaxClient.chat.completions.create({
    model: MINIMAX_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode && { response_format: { type: "json_object" } }),
  });

  return response.choices[0]?.message?.content ?? "";
}

// Streaming version for long content generation
export async function minimaxStream(
  messages: MinimaxMessage[],
  onChunk: (text: string) => void,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 8192 } = options;

  const stream = await minimaxClient.chat.completions.create({
    model: MINIMAX_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let full = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    full += text;
    if (text) onChunk(text);
  }
  return full;
}
