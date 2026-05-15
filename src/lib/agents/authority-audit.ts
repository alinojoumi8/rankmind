import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

export class AuthorityAuditAgent extends BaseAgent {
  readonly agentName = "authority-audit";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords, siteId } = ctx;
    const topKeywords = keywords.slice(0, 5).join(", ") || industry;

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are a digital authority and link-building auditor. You analyse websites and identify earned authority opportunities through legitimate means: genuine editorial links, thought leadership, brand mentions, and content-led outreach.

GUARDRAILS — your recommendations must NEVER include:
- Buying or renting links
- Link exchanges or reciprocal schemes
- Automated outreach spam or bulk emailing
- Private blog networks (PBNs)
- Any form of deceptive or manipulative link acquisition

Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Perform an authority audit for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Target keywords: ${topKeywords}

Identify authority gaps and earned-link opportunities. Return a JSON object with exactly this structure:
{
  "authorityProfile": {
    "estimatedDR": number (1-100),
    "estimatedReferringDomains": number,
    "topCompetitors": ["competitor1.com", "competitor2.com", "competitor3.com"],
    "authorityGap": "description of gap vs top 3 competitors",
    "brandMentionOpportunities": number,
    "quickWins": ["specific actionable win 1", "win 2", "win 3"]
  },
  "opportunities": [
    {
      "type": "guest-post|resource-link|broken-link|digital-pr|podcast|community|unlinked-mention",
      "targetDomain": "example type of site (e.g. 'industry blog', 'local news site')",
      "pitchAngle": "specific, compelling angle for this opportunity",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "estimatedDR": "20-40|40-60|60-80|80+",
      "rationale": "why this link would boost authority in AI and search"
    }
  ],
  "contentGaps": [
    {
      "topic": "topic where competitors have strong links but you don't",
      "format": "study|tool|guide|template|calculator|infographic|report|stat-page",
      "linkPotential": "high|medium|low",
      "aiCitationValue": "why this would get cited by AI systems"
    }
  ],
  "summary": "executive summary of authority status and top 3 recommended next steps"
}

Return 8-12 opportunities and 4-6 content gaps. Prioritise opportunities with the best combination of high authority, low effort, and AI-citation value.`,
        },
      ],
      { jsonMode: true, temperature: 0.6, maxTokens: 4000 }
    );

    let audit: {
      authorityProfile: {
        estimatedDR: number;
        estimatedReferringDomains: number;
        topCompetitors: string[];
        authorityGap: string;
        brandMentionOpportunities: number;
        quickWins: string[];
      };
      opportunities: Array<{
        type: string;
        targetDomain: string;
        pitchAngle: string;
        priority: string;
        effort: string;
        estimatedDR: string;
        rationale: string;
      }>;
      contentGaps: Array<{
        topic: string;
        format: string;
        linkPotential: string;
        aiCitationValue: string;
      }>;
      summary: string;
    };

    try {
      audit = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse authority audit", error: "PARSE_ERROR" };
    }

    // Persist high-priority opportunities to AuthorityOpportunity table
    const oppsToSave = audit.opportunities.filter((o) => o.priority === "high" || o.priority === "medium");
    if (oppsToSave.length > 0) {
      await Promise.all(
        oppsToSave.map((opp) =>
          prisma.authorityOpportunity.create({
            data: {
              siteId,
              type: opp.type,
              priority: opp.priority,
              targetDomain: opp.targetDomain,
              pitchAngle: opp.pitchAngle,
              notes: opp.rationale,
              status: "identified",
            },
          }).catch(() => {}) // non-blocking
        )
      );
    }

    const highCount = audit.opportunities.filter((o) => o.priority === "high").length;
    const highLinkContent = audit.contentGaps.filter((g) => g.linkPotential === "high").length;

    return {
      success: true,
      summary: `Authority audit complete. Estimated DR ${audit.authorityProfile.estimatedDR} with ${audit.authorityProfile.estimatedReferringDomains} referring domains. Found ${audit.opportunities.length} link opportunities (${highCount} high-priority) and ${highLinkContent} high-value content gaps.`,
      data: audit,
    };
  }
}
