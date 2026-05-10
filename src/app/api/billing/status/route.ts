import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan, getMonthlyRunCount, PLANS } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      stripeSubscriptionStatus: true,
      planCurrentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];
  const runsUsed = limits.runsPerMonth !== -1 ? await getMonthlyRunCount(userId) : 0;
  const siteCount = await prisma.site.count({ where: { userId } });

  return NextResponse.json({
    plan,
    planName: limits.name,
    subscriptionStatus: user?.stripeSubscriptionStatus ?? null,
    periodEnd: user?.planCurrentPeriodEnd ?? null,
    hasCustomer: !!user?.stripeCustomerId,
    usage: {
      runsUsed,
      runsLimit: limits.runsPerMonth,
      sitesUsed: siteCount,
      sitesLimit: limits.sites,
    },
  });
}
