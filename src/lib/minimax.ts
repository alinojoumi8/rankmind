import OpenAI from "openai";

export const minimaxClient = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY!,
  baseURL: "https://api.minimax.io/v1",
});

export const MINIMAX_MODEL = "MiniMax-M2.7";

export interface MinimaxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Strip <think>...</think> reasoning blocks that M2.7 prepends to answers
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Extract first JSON object/array from text (handles markdown code fences too)
export function extractJson(text: string): string {
  const stripped = stripThinking(text);
  // Remove ```json ... ``` markdown fences
  const fenceMatch = stripped.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Find first { or [ and match to its closing counterpart
  const start = stripped.search(/[{\[]/);
  if (start === -1) return stripped;
  // Walk forward to find matching close
  const opener = stripped[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === opener) depth++;
    else if (stripped[i] === closer) {
      depth--;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  return stripped.slice(start);
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

  const content = response.choices[0]?.message?.content ?? "";
  return jsonMode ? extractJson(content) : stripThinking(content);
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
  return stripThinking(full);
}
