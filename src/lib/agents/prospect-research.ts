import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

export class ProspectResearchAgent extends BaseAgent {
  readonly agentName = "prospect-research";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords, siteId } = ctx;
    const topKeywords = keywords.slice(0, 6).join(", ") || industry;

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a link prospect researcher who finds high-quality, editorial link opportunities for businesses through legitimate means.

GUARDRAILS — only suggest:
- Sites that would naturally want to link to this business's content
- Genuine relationship-based outreach opportunities
- Unlinked brand/product mentions that deserve a citation link
- Broken link replacement on genuinely relevant resources

NEVER suggest:
- Paid link placements or sponsored posts disguised as editorial
- Link exchange partners
- Bulk directory submissions
- Low-quality aggregator sites

Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Research link prospects for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Target keywords: ${topKeywords}

Return a JSON object with exactly this structure:
{
  "prospects": [
    {
      "type": "guest-post|resource-link|broken-link|unlinked-mention|podcast|community|digital-pr",
      "targetDomain": "realistic target domain type (e.g. 'techcrunch.com style tech publication')",
      "targetPageType": "what kind of page to target (e.g. 'resource roundup', 'industry news article')",
      "contactRole": "Editor|Blogger|Podcast Host|Community Manager|Journalist",
      "pitchAngle": "specific compelling angle tailored to this prospect type",
      "whyTheyWouldLink": "concrete reason this site would want to link to you",
      "priority": "high|medium|low",
      "estimatedDR": "20-40|40-60|60-80|80+",
      "effort": "low|medium|high",
      "searchQuery": "Google/Bing query to actually find these prospects (e.g. 'site:medium.com ${industry} resource guide')"
    }
  ],
  "unlinkedMentions": {
    "searchStrategies": [
      "specific search query to find brand mentions without links (e.g. '\"${name}\" -site:${domain}')"
    ],
    "estimatedCount": number,
    "topPlatforms": ["platform1", "platform2", "platform3"]
  },
  "competitorBacklinkAngles": [
    {
      "angle": "tactic to earn links that competitors have but you don't",
      "targetType": "type of site",
      "difficulty": "low|medium|high"
    }
  ],
  "summary": "overview of prospect landscape and recommended prioritisation"
}

Return 10-15 prospects covering a diverse mix of types. Skew towards high-DR opportunities with realistic pitch angles.`,
        },
      ],
      { jsonMode: true, temperature: 0.65, maxTokens: 4500 }
    );

    let research: {
      prospects: Array<{
        type: string;
        targetDomain: string;
        targetPageType: string;
        contactRole: string;
        pitchAngle: string;
        whyTheyWouldLink: string;
        priority: string;
        estimatedDR: string;
        effort: string;
        searchQuery: string;
      }>;
      unlinkedMentions: {
        searchStrategies: string[];
        estimatedCount: number;
        topPlatforms: string[];
      };
      competitorBacklinkAngles: Array<{
        angle: string;
        targetType: string;
        difficulty: string;
      }>;
      summary: string;
    };

    try {
      research = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse prospect research", error: "PARSE_ERROR" };
    }

    // Persist high-priority prospects as opportunities
    const highPriority = research.prospects.filter((p) => p.priority === "high");
    if (highPriority.length > 0) {
      await Promise.all(
        highPriority.map((p) =>
          prisma.authorityOpportunity.create({
            data: {
              siteId,
              type: p.type,
              priority: p.priority,
              targetDomain: p.targetDomain,
              pitchAngle: p.pitchAngle,
              notes: `${p.whyTheyWouldLink}\n\nSearch: ${p.searchQuery}`,
              status: "researching",
            },
          }).catch(() => {})
        )
      );
    }

    const highCount = research.prospects.filter((p) => p.priority === "high").length;
    const highDR = research.prospects.filter((p) => p.estimatedDR === "60-80" || p.estimatedDR === "80+").length;

    return {
      success: true,
      summary: `Identified ${research.prospects.length} link prospects (${highCount} high-priority, ${highDR} DR 60+ sites). Found ${research.unlinkedMentions.estimatedCount} estimated unlinked brand mentions across ${research.unlinkedMentions.topPlatforms.join(", ")}.`,
      data: research,
    };
  }
}
