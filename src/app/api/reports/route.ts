import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/billing";
import crypto from "crypto";
import { z } from "zod";

const createSchema = z.object({
  siteId: z.string(),
  title: z.string().optional(),
  expiryDays: z.number().min(1).max(90).optional().default(30),
});

// POST /api/reports — generate a shareable report snapshot
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { siteId, title, expiryDays } = parsed.data;

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Shareable reports require Growth+
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    return NextResponse.json(
      { error: "Shareable reports require a Growth or Agency plan.", upgrade: true },
      { status: 403 }
    );
  }

  // Gather current site data for the snapshot
  const [latestMetric, citations, contents, issues, competitors] = await Promise.all([
    prisma.siteMetric.findFirst({ where: { siteId }, orderBy: { date: "desc" } }),
    prisma.citation.findMany({ where: { siteId }, orderBy: { checkedAt: "desc" }, take: 30 }),
    prisma.content.findMany({ where: { siteId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.siteIssue.findMany({ where: { siteId, resolvedAt: null }, take: 20 }),
    prisma.competitor.findMany({
      where: { siteId },
      include: {
        mentions: { orderBy: { checkedAt: "desc" }, take: 30, select: { mentioned: true } },
      },
    }),
  ]);

  const totalCitations = citations.length;
  const citedCount = citations.filter((c) => c.cited).length;
  const citationRate = totalCitations > 0 ? Math.round((citedCount / totalCitations) * 100) : 0;

  const snapshotData = JSON.stringify({
    generatedAt: new Date().toISOString(),
    site: { domain: site.domain, name: site.name, industry: site.industry },
    metrics: {
      geoScore: latestMetric?.geoScore ?? 0,
      techScore: latestMetric?.techScore ?? 0,
      citationShare: citationRate,
      organicTraffic: latestMetric?.organicTraffic ?? 0,
    },
    citations: {
      total: totalCitations,
      cited: citedCount,
      rate: citationRate,
      recent: citations.slice(0, 10).map((c) => ({
        llm: c.llm,
        query: c.query,
        cited: c.cited,
        sentiment: c.sentiment,
        excerpt: c.excerpt,
      })),
    },
    issues: {
      total: issues.length,
      critical: issues.filter((i) => i.severity === "critical").length,
      list: issues.slice(0, 10).map((i) => ({
        type: i.type,
        severity: i.severity,
        description: i.description,
      })),
    },
    content: {
      total: contents.length,
      list: contents.slice(0, 5).map((c) => ({
        title: c.title,
        status: c.status,
        wordCount: c.wordCount,
        seoScore: c.seoScore,
      })),
    },
    competitors: competitors.map((comp) => {
      const total = comp.mentions.length;
      const mentioned = comp.mentions.filter((m) => m.mentioned).length;
      return {
        domain: comp.domain,
        name: comp.name,
        mentionRate: total > 0 ? Math.round((mentioned / total) * 100) : 0,
        totalChecks: total,
      };
    }),
  });

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const reportTitle = title ?? `${site.name} — AI Visibility Report`;

  const report = await prisma.report.create({
    data: { siteId, token, title: reportTitle, snapshotData, expiresAt },
  });

  const origin = req.headers.get("origin") ?? "https://rankmind-ten.vercel.app";
  return NextResponse.json({
    report: { id: report.id, token: report.token, title: report.title, expiresAt: report.expiresAt },
    url: `${origin}/reports/${token}`,
  }, { status: 201 });
}

// GET /api/reports?siteId=xxx — list reports for a site
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const reports = await prisma.report.findMany({
    where: { siteId },
    select: { id: true, token: true, title: true, viewCount: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ reports });
}
