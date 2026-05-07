import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export class ContentArchitectAgent extends BaseAgent {
  readonly agentName = "content-architect";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { siteId, name, industry, keywords } = ctx;
    const targetKeyword = keywords[0] ?? industry;

    // Step 1: MiniMax generates a high-value article topic + outline
    const outlineRaw = await minimaxChat(
      [
        {
          role: "system",
          content: `You are an expert SEO and GEO content strategist. Your job is to plan content that:
1. Ranks well in Google search results
2. Gets cited by AI search engines (ChatGPT, Perplexity, Gemini, Claude)
3. Demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

Always respond with valid JSON.`,
        },
        {
          role: "user",
          content: `Plan one high-impact article for a ${industry} business called "${name}" targeting the keyword "${targetKeyword}".

Return JSON with:
{
  "title": "exact article title (include current year)",
  "targetKeyword": "primary keyword",
  "searchIntent": "informational|navigational|transactional",
  "outline": [
    { "heading": "H2 heading", "points": ["sub-point 1", "sub-point 2"] }
  ],
  "faqQuestions": ["question 1", "question 2", "question 3"],
  "estimatedWordCount": 1500
}`,
        },
      ],
      { jsonMode: true, temperature: 0.8 }
    );

    let outline: {
      title: string;
      targetKeyword: string;
      searchIntent: string;
      outline: { heading: string; points: string[] }[];
      faqQuestions: string[];
      estimatedWordCount: number;
    };

    try {
      outline = JSON.parse(outlineRaw);
    } catch {
      return { success: false, summary: "Failed to parse outline from MiniMax", error: "PARSE_ERROR" };
    }

    // Step 2: MiniMax writes the full article
    const articleBody = await minimaxChat(
      [
        {
          role: "system",
          content: `You are an expert content writer specializing in ${industry}. Write content that:
- Is structured for AI engine extraction (clear H2/H3 headings, bullet lists, definition sections)
- Uses specific data points and statistics
- Has a Q&A / FAQ section at the end
- Is authoritative and cites best practices
- Naturally mentions ${name} where relevant
- Is formatted in Markdown`,
        },
        {
          role: "user",
          content: `Write a comprehensive ${outline.estimatedWordCount}-word article titled:
"${outline.title}"

Use this outline:
${outline.outline.map((s) => `## ${s.heading}\n${s.points.map((p) => `- ${p}`).join("\n")}`).join("\n\n")}

End with an FAQ section answering:
${outline.faqQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Write the full article now in Markdown format.`,
        },
      ],
      { temperature: 0.75, maxTokens: 6000 }
    );

    // Step 3: Score the content for SEO + GEO
    const scoreRaw = await minimaxChat(
      [
        {
          role: "system",
          content: "You are a content quality analyst. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `Rate this article on two dimensions (0-100 each):
1. seoScore: Traditional SEO quality (keyword use, structure, meta readiness)
2. geoScore: GEO quality (AI-citation readiness: structured data, Q&A format, factual density, E-E-A-T signals)

Article excerpt (first 1000 chars):
${articleBody.slice(0, 1000)}

Respond: { "seoScore": number, "geoScore": number, "notes": "brief reason" }`,
        },
      ],
      { jsonMode: true, temperature: 0.3 }
    );

    let scores = { seoScore: 75, geoScore: 70 };
    try {
      scores = JSON.parse(scoreRaw);
    } catch {
      // Use defaults if parsing fails
    }

    const slug = slugify(outline.title);
    const wordCount = countWords(articleBody);

    // Save content to DB as draft (human reviews before publishing)
    const content = await prisma.content.create({
      data: {
        siteId,
        title: outline.title,
        slug,
        body: articleBody,
        wordCount,
        status: "review",
        targetKeyword: outline.targetKeyword,
        seoScore: scores.seoScore,
        geoScore: scores.geoScore,
      },
    });

    return {
      success: true,
      summary: `Generated "${outline.title}" (${wordCount} words). SEO: ${scores.seoScore}/100, GEO: ${scores.geoScore}/100. Ready for review.`,
      data: {
        contentId: content.id,
        title: outline.title,
        slug,
        wordCount,
        seoScore: scores.seoScore,
        geoScore: scores.geoScore,
        status: "review",
      },
    };
  }
}
