import { BaseAgent, AgentContext, AgentResult } from "./base";
import { minimaxChat } from "@/lib/minimax";
import { prisma } from "@/lib/prisma";

interface PageCheckResult {
  url: string;
  status: number | null;
  title: string | null;
  description: string | null;
  h1Count: number;
  hasCanonical: boolean;
  issues: { type: string; severity: "critical" | "warning" | "info"; description: string }[];
}

async function checkPage(url: string): Promise<PageCheckResult> {
  const issues: PageCheckResult["issues"] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RankMind-SiteDoctor/1.0" },
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Extract basic meta
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? null;
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch?.[1]?.trim() ?? null;
    const h1Matches = html.match(/<h1[^>]*>/gi) ?? [];
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);

    if (!title) {
      issues.push({ type: "missing-title", severity: "critical", description: "Page is missing a <title> tag" });
    } else if (title.length < 30) {
      issues.push({ type: "short-title", severity: "warning", description: `Title is too short (${title.length} chars, min 30)` });
    } else if (title.length > 60) {
      issues.push({ type: "long-title", severity: "warning", description: `Title is too long (${title.length} chars, max 60)` });
    }

    if (!description) {
      issues.push({ type: "missing-meta-description", severity: "warning", description: "Missing meta description" });
    } else if (description.length < 70) {
      issues.push({ type: "short-description", severity: "info", description: `Meta description short (${description.length} chars)` });
    } else if (description.length > 160) {
      issues.push({ type: "long-description", severity: "info", description: `Meta description too long (${description.length} chars)` });
    }

    if (h1Matches.length === 0) {
      issues.push({ type: "missing-h1", severity: "critical", description: "Page has no H1 heading" });
    } else if (h1Matches.length > 1) {
      issues.push({ type: "multiple-h1", severity: "warning", description: `Page has ${h1Matches.length} H1s (should have exactly 1)` });
    }

    if (!canonicalMatch) {
      issues.push({ type: "missing-canonical", severity: "info", description: "No canonical link tag found" });
    }

    // Check for schema markup
    if (!html.includes("application/ld+json")) {
      issues.push({ type: "missing-schema", severity: "warning", description: "No JSON-LD structured data found" });
    }

    // Check HTTPS
    if (!url.startsWith("https://")) {
      issues.push({ type: "no-https", severity: "critical", description: "Page not served over HTTPS" });
    }

    if (res.status >= 400) {
      issues.push({ type: "http-error", severity: "critical", description: `Page returned HTTP ${res.status}` });
    }

    return {
      url,
      status: res.status,
      title,
      description,
      h1Count: h1Matches.length,
      hasCanonical: !!canonicalMatch,
      issues,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      url,
      status: null,
      title: null,
      description: null,
      h1Count: 0,
      hasCanonical: false,
      issues: [{ type: "fetch-error", severity: "critical", description: `Could not fetch page: ${msg}` }],
    };
  }
}

export class SiteDoctorAgent extends BaseAgent {
  readonly agentName = "site-doctor";

  protected async execute(ctx: AgentContext): Promise<AgentResult> {
    const { siteId, domain } = ctx;

    // Ensure domain has protocol
    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    // Check homepage + common pages
    const pagesToCheck = [
      baseUrl,
      `${baseUrl}/about`,
      `${baseUrl}/contact`,
      `${baseUrl}/blog`,
    ];

    const pageResults: PageCheckResult[] = [];
    let totalIssues = 0;
    let criticalCount = 0;
    let autoFixed = 0;

    for (const pageUrl of pagesToCheck) {
      const result = await checkPage(pageUrl);
      pageResults.push(result);

      // Persist each issue
      for (const issue of result.issues) {
        await prisma.siteIssue.create({
          data: {
            siteId,
            type: issue.type,
            severity: issue.severity,
            url: pageUrl,
            description: issue.description,
            autoFixed: false,
          },
        });
        totalIssues++;
        if (issue.severity === "critical") criticalCount++;
      }
    }

    // Use MiniMax to generate a prioritized fix plan
    const issuesSummary = pageResults
      .flatMap((p) => p.issues.map((i) => `[${i.severity.toUpperCase()}] ${p.url} — ${i.description}`))
      .join("\n");

    let fixPlan = "";
    if (issuesSummary) {
      fixPlan = await minimaxChat(
        [
          {
            role: "system",
            content: "You are a technical SEO expert. Be concise and actionable.",
          },
          {
            role: "user",
            content: `Here are SEO issues found on ${domain}:

${issuesSummary}

Give a prioritized fix plan (top 5 most impactful actions). Format as a numbered list. One sentence each.`,
          },
        ],
        { temperature: 0.5, maxTokens: 512 }
      );
    }

    // Compute health score (100 - weighted issue penalties)
    const criticalPenalty = criticalCount * 15;
    const warningPenalty = pageResults
      .flatMap((p) => p.issues)
      .filter((i) => i.severity === "warning").length * 5;
    const techScore = Math.max(0, 100 - criticalPenalty - warningPenalty);

    // Update site metric
    await prisma.siteMetric.create({
      data: {
        siteId,
        techScore,
      },
    });

    return {
      success: true,
      summary: `Checked ${pagesToCheck.length} pages. Found ${totalIssues} issues (${criticalCount} critical). Health score: ${techScore}/100.`,
      data: {
        pagesChecked: pagesToCheck.length,
        totalIssues,
        criticalCount,
        autoFixed,
        techScore,
        fixPlan,
        pageResults: pageResults.map((p) => ({
          url: p.url,
          status: p.status,
          issueCount: p.issues.length,
        })),
      },
    };
  }
}
