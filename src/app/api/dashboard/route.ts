import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard?siteId=xxx
// Returns all data needed to power the dashboard UI
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Run all DB queries in parallel
  const [latestMetric, citations, contents, issues, recentRuns] = await Promise.all([
    prisma.siteMetric.findFirst({
      where: { siteId },
      orderBy: { date: "desc" },
    }),
    prisma.citation.findMany({
      where: { siteId },
      orderBy: { checkedAt: "desc" },
      take: 50,
    }),
    prisma.content.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.siteIssue.findMany({
      where: { siteId, resolvedAt: null },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.agentRun.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Compute citation share per LLM
  const citationsByLlm = citations.reduce<Record<string, { total: number; cited: number }>>(
    (acc, c) => {
      if (!acc[c.llm]) acc[c.llm] = { total: 0, cited: 0 };
      acc[c.llm].total++;
      if (c.cited) acc[c.llm].cited++;
      return acc;
    },
    {}
  );

  const llmCitationShare = Object.entries(citationsByLlm).map(([llm, v]) => ({
    llm,
    citationRate: v.total > 0 ? Math.round((v.cited / v.total) * 100) : 0,
    total: v.total,
    cited: v.cited,
  }));

  // Overall citation share (% of all queries where brand was cited)
  const totalQueries = citations.length;
  const totalCited = citations.filter((c) => c.cited).length;
  const overallCitationShare =
    totalQueries > 0 ? Math.round((totalCited / totalQueries) * 100) : 0;

  // Agent statuses
  const agentNames = [
    "geo-scout",
    "content-architect",
    "site-doctor",
    "authority-builder",
    "keyword-intel",
    "schema-architect",
    "campaign-intel",
  ];

  const agentStatuses = agentNames.map((name) => {
    const lastRun = recentRuns.find((r) => r.agentName === name);
    return {
      name,
      status: lastRun?.status ?? "never_run",
      lastRun: lastRun?.completedAt ?? null,
      lastSummary: lastRun?.result ? JSON.parse(lastRun.result) : null,
    };
  });

  return NextResponse.json({
    site: { id: site.id, domain: site.domain, name: site.name },
    metrics: {
      citationShare: overallCitationShare,
      organicTraffic: latestMetric?.organicTraffic ?? 0,
      geoScore: latestMetric?.geoScore ?? 0,
      domainRating: latestMetric?.domainRating ?? 0,
      techScore: latestMetric?.techScore ?? 0,
      monthlyLeads: latestMetric?.monthlyLeads ?? 0,
    },
    llmCitationShare,
    agentStatuses,
    recentCitations: citations.slice(0, 10).map((c) => ({
      id: c.id,
      llm: c.llm,
      query: c.query,
      cited: c.cited,
      sentiment: c.sentiment,
      excerpt: c.excerpt,
      checkedAt: c.checkedAt,
    })),
    contents: contents.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      wordCount: c.wordCount,
      seoScore: c.seoScore,
      geoScore: c.geoScore,
      createdAt: c.createdAt,
    })),
    issues: issues.map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      url: i.url,
      description: i.description,
    })),
  });
}
