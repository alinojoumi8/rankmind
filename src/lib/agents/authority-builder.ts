import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";

export class AuthorityBuilderAgent extends BaseAgent {
  readonly agentName = "authority-builder";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords } = ctx;
    const topKeywords = keywords.slice(0, 5).join(", ") || industry;

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a link building and digital PR expert who specialises in building domain authority for ${industry} businesses.
You understand both traditional SEO link building and AI-era brand authority signals.
Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Analyse and build a link-building + authority strategy for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Target keywords: ${topKeywords}

Return a JSON object with exactly this structure:
{
  "domainAuthorityInsights": {
    "estimatedDR": number (1-100, your estimate),
    "linkGap": "brief description of gap vs top competitors",
    "quickWins": ["actionable quick win 1", "quick win 2", "quick win 3"]
  },
  "linkOpportunities": [
    {
      "type": "guest-post|resource-page|broken-link|digital-pr|directory|podcast|community",
      "target": "type of site or specific site category to target",
      "angle": "specific pitch angle or content hook",
      "estimatedDR": "20-40|40-60|60-80|80+",
      "effort": "low|medium|high",
      "priority": "high|medium|low",
      "aiAuthorityBoost": true/false
    }
  ],
  "contentAssets": [
    {
      "title": "link-worthy content asset title",
      "format": "study|tool|guide|template|calculator|infographic|report",
      "targetSites": ["type of site that would link to this"],
      "estimatedLinks": number,
      "geoValue": "how this helps AI citation"
    }
  ],
  "digitalPrAngles": [
    {
      "angle": "PR story angle",
      "targetPublications": ["publication type 1", "publication type 2"],
      "hook": "why journalists/bloggers would cover this",
      "seasonality": "evergreen|Q1|Q2|Q3|Q4"
    }
  ],
  "outreachTemplates": [
    {
      "type": "guest-post|resource|broken-link",
      "subject": "email subject line",
      "opening": "personalised opening line template",
      "pitch": "2-3 sentence pitch body"
    }
  ],
  "monthlyPlan": [
    {
      "month": 1,
      "focus": "focus area",
      "actions": ["action 1", "action 2", "action 3"],
      "expectedLinks": number
    },
    {
      "month": 2,
      "focus": "focus area",
      "actions": ["action 1", "action 2", "action 3"],
      "expectedLinks": number
    },
    {
      "month": 3,
      "focus": "focus area",
      "actions": ["action 1", "action 2", "action 3"],
      "expectedLinks": number
    }
  ],
  "summary": "strategic overview paragraph"
}

Provide 6-8 link opportunities, 3 content assets, 3 PR angles, 2 outreach templates, and a 3-month plan.`,
        },
      ],
      { jsonMode: true, temperature: 0.7, maxTokens: 4000 }
    );

    let strategy: {
      domainAuthorityInsights: {
        estimatedDR: number;
        linkGap: string;
        quickWins: string[];
      };
      linkOpportunities: Array<{
        type: string;
        target: string;
        angle: string;
        estimatedDR: string;
        effort: string;
        priority: string;
        aiAuthorityBoost: boolean;
      }>;
      contentAssets: Array<{
        title: string;
        format: string;
        targetSites: string[];
        estimatedLinks: number;
        geoValue: string;
      }>;
      digitalPrAngles: Array<{
        angle: string;
        targetPublications: string[];
        hook: string;
        seasonality: string;
      }>;
      outreachTemplates: Array<{
        type: string;
        subject: string;
        opening: string;
        pitch: string;
      }>;
      monthlyPlan: Array<{
        month: number;
        focus: string;
        actions: string[];
        expectedLinks: number;
      }>;
      summary: string;
    };

    try {
      strategy = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse authority strategy", error: "PARSE_ERROR" };
    }

    const highPriority = strategy.linkOpportunities.filter((o) => o.priority === "high").length;
    const totalExpectedLinks = strategy.monthlyPlan.reduce((sum, m) => sum + (m.expectedLinks ?? 0), 0);
    const aiBoostOpportunities = strategy.linkOpportunities.filter((o) => o.aiAuthorityBoost).length;

    return {
      success: true,
      summary: `Generated authority strategy with ${strategy.linkOpportunities.length} link opportunities (${highPriority} high-priority), ${strategy.contentAssets.length} linkable content assets, and ${aiBoostOpportunities} AI-authority boosts. Projected ${totalExpectedLinks} links over 3 months.`,
      data: strategy,
    };
  }
}
