import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat, extractJson } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

export class SchemaArchitectAgent extends BaseAgent {
  readonly agentName = "schema-architect";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { siteId, domain, name, industry, keywords } = ctx;

    // Fetch homepage HTML for context
    let homepageSnippet = "";
    try {
      const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(baseUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "RankMind-SchemaArchitect/1.0" },
      });
      clearTimeout(timeout);
      const html = await res.text();
      // Extract visible text-ish content (strip tags, first 2000 chars)
      homepageSnippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 2000);
    } catch { /* fallback to site metadata */ }

    const prompt = `You are a technical SEO expert specializing in structured data for AI search engines.

Generate comprehensive JSON-LD schema markup for this website:
- Name: ${name}
- Domain: ${domain}
- Industry: ${industry}
- Keywords: ${keywords.join(", ")}
${homepageSnippet ? `- Homepage content snippet: "${homepageSnippet.slice(0, 500)}"` : ""}

Generate ALL of the following schema types as a JSON array of schema objects:
1. Organization (with name, url, logo, sameAs social profiles, contactPoint)
2. WebSite (with name, url, potentialAction SearchAction)
3. FAQPage (3-5 relevant FAQs for this business type)
4. BreadcrumbList (homepage breadcrumb)

Return a JSON array: [{ "@context": "...", "@type": "...", ... }, ...]

Make all values realistic and specific to this business. Use ${domain} as the base URL.`;

    const raw = await minimaxChat(
      [
        { role: "system", content: "You are a JSON-LD schema expert. Return only valid JSON arrays. No markdown." },
        { role: "user", content: prompt },
      ],
      { jsonMode: true, temperature: 0.3, maxTokens: 3000 }
    );

    let schemas: unknown[];
    try {
      const parsed = JSON.parse(extractJson(raw));
      schemas = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { success: false, summary: "Failed to parse schema from MiniMax", error: "PARSE_ERROR" };
    }

    // Format as HTML script tags for easy copy-paste
    const scriptTags = schemas
      .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
      .join("\n\n");

    // Store as a special content record
    await prisma.content.upsert({
      where: {
        // Use a deterministic slug
        siteId_slug: { siteId, slug: "__schema-architect__" },
      },
      update: {
        title: `JSON-LD Schema Markup — ${name}`,
        body: scriptTags,
        wordCount: scriptTags.length,
        status: "review",
        seoScore: 95,
        geoScore: 90,
        updatedAt: new Date(),
      },
      create: {
        siteId,
        title: `JSON-LD Schema Markup — ${name}`,
        slug: "__schema-architect__",
        body: scriptTags,
        wordCount: scriptTags.length,
        status: "review",
        targetKeyword: "structured data",
        seoScore: 95,
        geoScore: 90,
      },
    });

    const schemaTypes = schemas.map((s) => (s as { "@type"?: string })["@type"] ?? "Unknown").join(", ");

    return {
      success: true,
      summary: `Generated ${schemas.length} schema types: ${schemaTypes}. Ready to paste into your <head>.`,
      data: {
        schemaCount: schemas.length,
        schemaTypes,
        scriptTags,
        schemas,
      },
    };
  }
}
