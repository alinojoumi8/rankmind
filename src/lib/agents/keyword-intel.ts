import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";

export class KeywordIntelAgent extends BaseAgent {
  readonly agentName = "keyword-intel";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, industry, keywords } = ctx;
    const seedKeywords = keywords.length > 0 ? keywords : [industry];

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a keyword research expert for both traditional SEO and AI search engine optimization (GEO).
You understand search intent, keyword clusters, and which queries trigger AI citations.
Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Perform keyword intelligence for a ${industry} business called "${name}".
Seed keywords: ${seedKeywords.join(", ")}

Return a JSON object with:
{
  "clusters": [
    {
      "theme": "cluster theme name",
      "intent": "informational|navigational|transactional|commercial",
      "aiCitationPotential": "high|medium|low",
      "keywords": [
        {
          "keyword": "keyword phrase",
          "estimatedVolume": "high|medium|low",
          "difficulty": "easy|medium|hard",
          "geoOptimized": true/false,
          "suggestedTitle": "H1 title suggestion using this keyword"
        }
      ]
    }
  ],
  "quickWins": ["keyword 1", "keyword 2", "keyword 3"],
  "aiSearchQueries": ["query AI users ask", "another query"],
  "contentGaps": ["topic not yet covered", "another gap"],
  "summary": "brief strategic summary"
}

Generate 4 keyword clusters with 4-5 keywords each. Focus on ${industry} industry.`,
        },
      ],
      { jsonMode: true, temperature: 0.7, maxTokens: 3000 }
    );

    let intel: {
      clusters: Array<{
        theme: string;
        intent: string;
        aiCitationPotential: string;
        keywords: Array<{
          keyword: string;
          estimatedVolume: string;
          difficulty: string;
          geoOptimized: boolean;
          suggestedTitle: string;
        }>;
      }>;
      quickWins: string[];
      aiSearchQueries: string[];
      contentGaps: string[];
      summary: string;
    };

    try {
      intel = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse keyword data", error: "PARSE_ERROR" };
    }

    const totalKeywords = intel.clusters.reduce((sum, c) => sum + c.keywords.length, 0);
    const highPotentialCount = intel.clusters
      .filter((c) => c.aiCitationPotential === "high")
      .reduce((sum, c) => sum + c.keywords.length, 0);

    return {
      success: true,
      summary: `Found ${totalKeywords} keywords across ${intel.clusters.length} clusters. ${highPotentialCount} high AI-citation potential keywords. ${intel.quickWins.length} quick wins identified.`,
      data: intel,
    };
  }
}
