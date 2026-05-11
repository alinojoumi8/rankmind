import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/billing";

// Very simple admin guard — check Clerk userId matches ADMIN_USER_ID env var
function isAdmin(userId: string): boolean {
  const adminId = process.env.ADMIN_USER_ID;
  return !!adminId && userId === adminId;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    usersByPlan,
    newUsersThisMonth,
    totalSites,
    totalAgentRuns,
    agentRunsThisMonth,
    recentUsers,
    topAgents,
    churned,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),

    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),

    prisma.site.count(),

    prisma.agentRun.count({ where: { status: "completed" } }),

    prisma.agentRun.count({
      where: { status: "completed", createdAt: { gte: startOfMonth } },
    }),

    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeSubscriptionStatus: true,
        createdAt: true,
        _count: { select: { sites: true } },
      },
    }),

    prisma.agentRun.groupBy({
      by: ["agentName"],
      where: { status: "completed" },
      _count: { agentName: true },
      orderBy: { _count: { agentName: "desc" } },
      take: 7,
    }),

    prisma.user.count({
      where: {
        plan: "free",
        stripeSubscriptionStatus: "canceled",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  // Calculate MRR from plan counts
  const planCounts = Object.fromEntries(
    usersByPlan.map((r) => [r.plan, r._count.plan])
  ) as Record<string, number>;

  const mrr =
    (planCounts["growth"] ?? 0) * PLANS.growth.price +
    (planCounts["agency"] ?? 0) * PLANS.agency.price;

  const arr = mrr * 12;

  return NextResponse.json({
    overview: {
      totalUsers,
      newUsersThisMonth,
      totalSites,
      totalAgentRuns,
      agentRunsThisMonth,
      mrr,
      arr,
      churned30d: churned,
    },
    planBreakdown: {
      free: planCounts["free"] ?? 0,
      growth: planCounts["growth"] ?? 0,
      agency: planCounts["agency"] ?? 0,
    },
    topAgents: topAgents.map((a) => ({
      name: a.agentName,
      runs: a._count.agentName,
    })),
    recentUsers,
  });
}
