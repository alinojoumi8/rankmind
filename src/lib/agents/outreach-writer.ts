import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

export class OutreachWriterAgent extends BaseAgent {
  readonly agentName = "outreach-writer";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { name, domain, industry, keywords, siteId } = ctx;
    const topKeywords = keywords.slice(0, 4).join(", ") || industry;

    // Load any existing opportunities that need outreach copy
    const pendingOpps = await prisma.authorityOpportunity.findMany({
      where: {
        siteId,
        status: { in: ["identified", "researching"] },
        outreachCopy: null,
      },
      take: 10,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    const oppContext = pendingOpps.length > 0
      ? pendingOpps
          .map((o, i) => `${i + 1}. Type: ${o.type}, Target: ${o.targetDomain ?? "unknown"}, Angle: ${o.pitchAngle ?? "general"}`)
          .join("\n")
      : "No existing opportunities loaded — generate templates for common types";

    const raw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are an expert outreach copywriter who crafts personalised, genuine outreach emails for digital PR and link building.

Your emails are:
- Short (under 120 words per body)
- Specific and personalised to the recipient's content/site
- Value-first (lead with what you offer, not what you want)
- Honest about who you are and why you're reaching out

STRICT GUARDRAILS:
- NEVER offer money, products, or favours in exchange for links
- NEVER use bulk templates or spray-and-pray language
- NEVER claim links will help the recipient's SEO
- NEVER misrepresent affiliation or expertise
- Emails must feel like they were written for ONE person

Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Write personalised outreach templates for:
- Business: "${name}"
- Domain: ${domain}
- Industry: ${industry}
- Keywords: ${topKeywords}

Pending opportunities to write for:
${oppContext}

Return a JSON object with exactly this structure:
{
  "templates": [
    {
      "opportunityType": "guest-post|resource-link|broken-link|unlinked-mention|podcast|digital-pr",
      "targetAudience": "who receives this (e.g. 'Blog editor at industry publication')",
      "subject": "compelling, specific email subject line (under 60 chars)",
      "preheader": "preview text that complements subject (under 80 chars)",
      "body": "full email body — personalised, value-first, under 120 words. Use {{THEIR_NAME}}, {{THEIR_SITE}}, {{SPECIFIC_ARTICLE}} as placeholders.",
      "followUp": "short 40-word follow-up email for 7 days later",
      "notes": "personalisation tips — what to research before sending this email"
    }
  ],
  "personalisationChecklist": [
    "item to personalise before sending 1",
    "item 2",
    "item 3"
  ],
  "bestSendTimes": "optimal day/time recommendation with reasoning",
  "summary": "brief overview of outreach strategy"
}

Write templates for: guest-post, resource-link, broken-link, unlinked-mention, and podcast (minimum). Add any opportunity-specific templates from the pending list above.`,
        },
      ],
      { jsonMode: true, temperature: 0.72, maxTokens: 5000 }
    );

    let outreach: {
      templates: Array<{
        opportunityType: string;
        targetAudience: string;
        subject: string;
        preheader: string;
        body: string;
        followUp: string;
        notes: string;
      }>;
      personalisationChecklist: string[];
      bestSendTimes: string;
      summary: string;
    };

    try {
      outreach = JSON.parse(extractJson(raw));
    } catch {
      return { success: false, summary: "Failed to parse outreach templates", error: "PARSE_ERROR" };
    }

    // Update pending opportunities with matching outreach copy
    if (pendingOpps.length > 0) {
      await Promise.all(
        pendingOpps.map(async (opp) => {
          const matching = outreach.templates.find(
            (t) => t.opportunityType === opp.type
          );
          if (matching) {
            await prisma.authorityOpportunity.update({
              where: { id: opp.id },
              data: {
                outreachCopy: `Subject: ${matching.subject}\n\n${matching.body}`,
                status: "drafting",
              },
            }).catch(() => {});
          }
        })
      );
    }

    return {
      success: true,
      summary: `Generated ${outreach.templates.length} personalised outreach templates covering ${[...new Set(outreach.templates.map((t) => t.opportunityType))].join(", ")}. Updated ${pendingOpps.length} existing opportunities with outreach copy.`,
      data: outreach,
    };
  }
}
