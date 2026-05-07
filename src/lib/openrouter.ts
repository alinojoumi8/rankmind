import OpenAI from "openai";

// OpenRouter is also OpenAI-compatible
export const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    "X-Title": "RankMind",
  },
});

// Perplexity Sonar via OpenRouter — has live web search built in
export const PERPLEXITY_MODEL = "perplexity/sonar";
export const PERPLEXITY_PRO_MODEL = "perplexity/sonar-pro";

export interface CitationQueryResult {
  cited: boolean;
  excerpt: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  position: number | null;
  rawResponse: string;
}

export async function queryCitation(
  brandName: string,
  domain: string,
  query: string,
  model = PERPLEXITY_MODEL
): Promise<CitationQueryResult> {
  const response = await openrouterClient.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  const rawResponse = response.choices[0]?.message?.content ?? "";

  // Check if brand or domain is mentioned
  const lowerResponse = rawResponse.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const lowerDomain = domain.toLowerCase().replace(/^www\./, "");

  const cited =
    lowerResponse.includes(lowerBrand) ||
    lowerResponse.includes(lowerDomain);

  if (!cited) {
    return { cited: false, excerpt: null, sentiment: null, position: null, rawResponse };
  }

  // Find position (rough word index of first mention)
  const words = rawResponse.split(/\s+/);
  const mentionIdx = words.findIndex(
    (w) =>
      w.toLowerCase().includes(lowerBrand) ||
      w.toLowerCase().includes(lowerDomain)
  );

  // Extract a snippet around the mention
  const snippetWords = words.slice(Math.max(0, mentionIdx - 10), mentionIdx + 20);
  const excerpt = snippetWords.join(" ");

  // Simple sentiment from context words
  const positiveSignals = ["best", "top", "leading", "recommend", "excellent", "great", "popular"];
  const negativeSignals = ["avoid", "bad", "poor", "worst", "issue", "problem", "not recommended"];
  const sentimentContext = excerpt.toLowerCase();
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (positiveSignals.some((w) => sentimentContext.includes(w))) sentiment = "positive";
  if (negativeSignals.some((w) => sentimentContext.includes(w))) sentiment = "negative";

  return {
    cited: true,
    excerpt,
    sentiment,
    position: mentionIdx,
    rawResponse,
  };
}
