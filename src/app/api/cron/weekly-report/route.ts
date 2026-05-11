import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/billing";
import { sendWeeklyReport } from "@/lib/email";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All paid users with at least one site
  const users = await prisma.user.findMany({
    where: {
      plan: { not: "free" },
      sites: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      sites: {
        select: {
          id: true,
          domain: true,
          name: true,
          citations: {
            where: {
              checkedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { cited: true },
          },
          siteIssues: {
            where: { resolvedAt: null },
            select: { severity: true },
          },
          contents: {
            where: {
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { id: true },
          },
          agentRuns: {
            where: {
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              status: "completed",
            },
            select: { id: true },
          },
          metrics: {
            orderBy: { date: "desc" },
            take: 2,
            select: { geoScore: true, date: true },
          },
        },
      },
    },
  });

  const weekOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sent: string[] = [];
  const failed: string[] = [];

  for (const user of users) {
    // Double-check active subscription
    const plan = await getUserPlan(user.id);
    if (plan === "free") continue;

    const siteSummaries = user.sites.map((site) => {
      const totalCitations = site.citations.length;
      const citedCount = site.citations.filter((c) => c.cited).length;
      const citationRate =
        totalCitations > 0 ? Math.round((citedCount / totalCitations) * 100) : 0;

      const openIssues = site.siteIssues.length;
      const criticalIssues = site.siteIssues.filter((i) => i.severity === "critical").length;

      const latestMetric = site.metrics[0];
      const previousMetric = site.metrics[1];
      const geoScore = latestMetric?.geoScore ?? 0;
      const geoScoreChange = latestMetric && previousMetric
        ? geoScore - previousMetric.geoScore
        : 0;

      return {
        domain: site.domain,
        name: site.name,
        geoScore,
        geoScoreChange,
        citationsTotal: totalCitations,
        citationsCited: citedCount,
        citationRate,
        openIssues,
        criticalIssues,
        newContent: site.contents.length,
        agentsRun: site.agentRuns.length,
      };
    });

    try {
      await sendWeeklyReport({
        userName: user.name ?? user.email.split("@")[0],
        userEmail: user.email,
        sites: siteSummaries,
        weekOf,
      });
      sent.push(user.email);
    } catch (err) {
      console.error(`[cron/weekly-report] Failed to send to ${user.email}:`, err);
      failed.push(user.email);
    }
  }

  return NextResponse.json({
    sent: sent.length,
    failed: failed.length,
    recipients: sent,
    timestamp: new Date().toISOString(),
  });
}
