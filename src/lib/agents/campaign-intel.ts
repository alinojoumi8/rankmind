import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";

export class CampaignIntelAgent extends BaseAgent {
  readonly agentName = "campaign-intel";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords } = ctx;
    const topKeywords = keywords.slice(0, 5).join(", ") || industry;

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a digital marketing strategist and competitive intelligence analyst specialising in ${industry}.
You craft data-driven campaign strategies that dominate both traditional search AND AI-powered search engines.
Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Generate a comprehensive campaign intelligence report for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Keywords: ${topKeywords}

Return a JSON object with exactly this structure:
{
  "competitiveLandscape": {
    "marketPosition": "leader|challenger|niche|new-entrant",
    "shareOfVoice": number (0-100, estimated % of AI citations in industry),
    "keyThreats": ["threat 1", "threat 2", "threat 3"],
    "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"]
  },
  "campaignIdeas": [
    {
      "name": "campaign name",
      "type": "content|social|email|paid|seo|pr|partnership",
      "objective": "awareness|consideration|conversion|retention",
      "description": "2-3 sentence campaign description",
      "channels": ["channel 1", "channel 2"],
      "aiVisibilityImpact": "high|medium|low",
      "estimatedReach": "1k-10k|10k-100k|100k+",
      "timeframe": "1-2 weeks|1 month|1 quarter",
      "budget": "low|medium|high"
    }
  ],
  "contentCalendar": [
    {
      "week": number (1-4),
      "theme": "weekly content theme",
      "posts": [
        {
          "channel": "blog|linkedin|twitter|youtube|email",
          "title": "content title",
          "format": "article|video|infographic|thread|newsletter",
          "aiKeyword": "AI search query this targets"
        }
      ]
    }
  ],
  "brandMentionStrategy": {
    "targetPlatforms": ["platform 1", "platform 2"],
    "monitoringKeywords": ["brand mention keyword 1", "keyword 2"],
    "responsePlaybook": [
      {
        "scenario": "mention scenario",
        "response": "recommended response approach"
      }
    ]
  },
  "aiSearchStrategy": {
    "topicClusters": ["cluster topic 1", "cluster topic 2", "cluster topic 3"],
    "entityBuilding": ["entity/fact to establish 1", "entity 2", "entity 3"],
    "citationTriggers": ["query that should trigger your citation 1", "query 2", "query 3", "query 4"],
    "contentFormats": ["content format that gets AI citations for this industry"]
  },
  "kpis": [
    {
      "metric": "KPI name",
      "target": "specific target",
      "timeframe": "30 days|90 days|6 months",
      "howToMeasure": "measurement method"
    }
  ],
  "summary": "executive summary paragraph"
}

Provide 5-6 campaign ideas, a 4-week content calendar, and 5 KPIs.`,
        },
      ],
      { jsonMode: true, temperature: 0.75, maxTokens: 4500 }
    );

    let intel: {
      competitiveLandscape: {
        marketPosition: string;
        shareOfVoice: number;
        keyThreats: string[];
        opportunities: string[];
      };
      campaignIdeas: Array<{
        name: string;
        type: string;
        objective: string;
        description: string;
        channels: string[];
        aiVisibilityImpact: string;
        estimatedReach: string;
        timeframe: string;
        budget: string;
      }>;
      contentCalendar: Array<{
        week: number;
        theme: string;
        posts: Array<{
          channel: string;
          title: string;
          format: string;
          aiKeyword: string;
        }>;
      }>;
      brandMentionStrategy: {
        targetPlatforms: string[];
        monitoringKeywords: string[];
        responsePlaybook: Array<{
          scenario: string;
          response: string;
        }>;
      };
      aiSearchStrategy: {
        topicClusters: string[];
        entityBuilding: string[];
        citationTriggers: string[];
        contentFormats: string[];
      };
      kpis: Array<{
        metric: string;
        target: string;
        timeframe: string;
        howToMeasure: string;
      }>;
      summary: string;
    };

    try {
      intel = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse campaign intelligence", error: "PARSE_ERROR" };
    }

    const highImpactCampaigns = intel.campaignIdeas.filter(
      (c) => c.aiVisibilityImpact === "high"
    ).length;
    const totalContentPieces = intel.contentCalendar.reduce(
      (sum, w) => sum + w.posts.length,
      0
    );

    return {
      success: true,
      summary: `Generated ${intel.campaignIdeas.length} campaign ideas (${highImpactCampaigns} high AI-visibility impact), ${totalContentPieces} content pieces across 4 weeks, and ${intel.aiSearchStrategy.citationTriggers.length} AI citation triggers for "${name}".`,
      data: intel,
    };
  }
}
