import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";

export class LinkableAssetAgent extends BaseAgent {
  readonly agentName = "linkable-asset";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords } = ctx;
    const topKeywords = keywords.slice(0, 6).join(", ") || industry;

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a content strategist who specialises in creating "linkable assets" — content specifically designed to attract high-quality editorial links and AI citations organically.

Linkable assets work because:
1. They contain unique data, research, or tools that other sites WANT to reference
2. They answer questions authoritative sources cite in their articles
3. They are genuinely useful to their target audience (not just SEO-bait)
4. They are the kind of resources AI systems like ChatGPT, Perplexity, and Gemini cite when answering queries

GUARDRAILS:
- Only suggest content that provides genuine standalone value
- Never suggest content designed purely to manipulate rankings
- Content must be factually grounded and avoid misleading claims
- Avoid "bait and switch" tactics (e.g., clickbait titles with thin content)

Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Identify linkable asset opportunities for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Target keywords: ${topKeywords}

Return a JSON object with exactly this structure:
{
  "assets": [
    {
      "title": "specific, compelling content title",
      "format": "original-research|industry-survey|free-tool|ultimate-guide|stat-roundup|template-pack|calculator|comparison-database|glossary|case-study-collection",
      "hook": "what makes this uniquely linkable (the data angle, unique insight, or utility)",
      "targetLinkersDescription": "who would naturally link to this and why",
      "estimatedLinks": number (realistic 3-month projection),
      "aiCitationPotential": "high|medium|low",
      "aiCitationReason": "why AI systems would cite this content",
      "productionEffort": "low|medium|high",
      "productionNotes": "specific tips on how to actually create this (data sources, tools, approach)",
      "seoKeywords": ["primary keyword", "secondary 1", "secondary 2"],
      "promotionChannels": ["channel 1", "channel 2", "channel 3"],
      "priority": "high|medium|low"
    }
  ],
  "competitorGapAssets": [
    {
      "observation": "type of asset competitors rank for that you're missing",
      "recommendation": "how to create a superior version"
    }
  ],
  "quickWinAssets": [
    {
      "title": "fast-to-produce asset title",
      "format": "format type",
      "timeToCreate": "1-2 days|3-5 days|1 week",
      "expectedLinks": number
    }
  ],
  "distributionStrategy": {
    "proactiveOutreach": ["outreach channel 1", "channel 2"],
    "communitySharing": ["community 1", "community 2"],
    "prDistribution": ["PR angle 1", "angle 2"]
  },
  "summary": "overview of linkable asset strategy with top 3 recommendations"
}

Return 6-10 main assets (mix of high-effort/high-return and quick wins), 3-5 competitor gap observations, and 3 quick-win assets.`,
        },
      ],
      { jsonMode: true, temperature: 0.7, maxTokens: 5000 }
    );

    let strategy: {
      assets: Array<{
        title: string;
        format: string;
        hook: string;
        targetLinkersDescription: string;
        estimatedLinks: number;
        aiCitationPotential: string;
        aiCitationReason: string;
        productionEffort: string;
        productionNotes: string;
        seoKeywords: string[];
        promotionChannels: string[];
        priority: string;
      }>;
      competitorGapAssets: Array<{
        observation: string;
        recommendation: string;
      }>;
      quickWinAssets: Array<{
        title: string;
        format: string;
        timeToCreate: string;
        expectedLinks: number;
      }>;
      distributionStrategy: {
        proactiveOutreach: string[];
        communitySharing: string[];
        prDistribution: string[];
      };
      summary: string;
    };

    try {
      strategy = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse linkable asset strategy", error: "PARSE_ERROR" };
    }

    const highPriority = strategy.assets.filter((a) => a.priority === "high").length;
    const highAI = strategy.assets.filter((a) => a.aiCitationPotential === "high").length;
    const totalEstimatedLinks = strategy.assets.reduce((sum, a) => sum + (a.estimatedLinks ?? 0), 0);

    return {
      success: true,
      summary: `Identified ${strategy.assets.length} linkable asset ideas (${highPriority} high-priority, ${highAI} with high AI-citation potential). Quick wins: ${strategy.quickWinAssets.length} assets. Projected ${totalEstimatedLinks} editorial links across all assets.`,
      data: strategy,
    };
  }
}
