import { BaseAgent, AgentContext, AgentResult } from "./base";
import { queryCitation, PERPLEXITY_MODEL } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

function checkMentioned(rawResponse: string, domain: string, name: string): boolean {
  const lower = rawResponse.toLowerCase();
  return lower.includes(domain.toLowerCase().replace(/^www\./, "")) ||
         lower.includes(name.toLowerCase());
}

// Query templates — question-form queries LLMs answer with source citations
function buildQueries(ctx: AgentContext): string[] {
  const { name, industry, keywords } = ctx;
  const kw = keywords.length > 0 ? keywords[0] : industry;

  return [
    `What are the best ${kw} tools or services available right now?`,
    `Which ${industry} companies or platforms do experts recommend?`,
    `What is ${name} and is it a good option for ${kw}?`,
    `Compare the top ${kw} solutions in ${new Date().getFullYear()}`,
    `Best ${industry} software for small businesses`,
  ];
}

export class GeoScoutAgent extends BaseAgent {
  readonly agentName = "geo-scout";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const queries = buildQueries(ctx);
    const results: {
      query: string;
      cited: boolean;
      sentiment: string | null;
      excerpt: string | null;
    }[] = [];

    let totalCited = 0;

    // Load competitors for this site
    const competitors = await prisma.competitor.findMany({
      where: { siteId: ctx.siteId },
      select: { id: true, domain: true, name: true },
    });

    for (const query of queries) {
      try {
        const result = await queryCitation(
          ctx.name,
          ctx.domain,
          query,
          PERPLEXITY_MODEL
        );

        // Store own citation
        await prisma.citation.create({
          data: {
            siteId: ctx.siteId,
            llm: "perplexity",
            query,
            cited: result.cited,
            sentiment: result.sentiment,
            excerpt: result.excerpt,
            position: result.position,
          },
        });

        // Track competitor mentions in the same response (no extra API calls)
        if (competitors.length > 0) {
          await Promise.all(
            competitors.map((comp) =>
              prisma.competitorMention.create({
                data: {
                  competitorId: comp.id,
                  siteId: ctx.siteId,
                  query,
                  mentioned: checkMentioned(result.rawResponse, comp.domain, comp.name),
                },
              })
            )
          );
        }

        if (result.cited) totalCited++;

        results.push({
          query,
          cited: result.cited,
          sentiment: result.sentiment,
          excerpt: result.excerpt,
        });
      } catch (err) {
        console.error(`GeoScout query failed: ${query}`, err);
        results.push({ query, cited: false, sentiment: null, excerpt: null });
      }
    }

    const citationRate = Math.round((totalCited / queries.length) * 100);

    // Update site metrics
    await prisma.siteMetric.create({
      data: {
        siteId: ctx.siteId,
        citationShare: citationRate,
      },
    });

    return {
      success: true,
      summary: `Checked ${queries.length} queries on Perplexity. Cited in ${totalCited}/${queries.length} (${citationRate}%).`,
      data: {
        queriesChecked: queries.length,
        citedCount: totalCited,
        citationRate,
        results,
      },
    };
  }
}
