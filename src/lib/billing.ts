import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// ── Stripe client ─────────────────────────────────────────────────────────────
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// ── Price IDs ─────────────────────────────────────────────────────────────────
export const PRICES = {
  growth: process.env.STRIPE_GROWTH_PRICE_ID!,  // $49/mo
  agency: process.env.STRIPE_AGENCY_PRICE_ID!,  // $199/mo
} as const;

// ── Plan definitions ──────────────────────────────────────────────────────────
export type Plan = "free" | "growth" | "agency";

export const PLANS: Record<Plan, {
  name: string;
  price: number;
  sites: number;          // -1 = unlimited
  runsPerMonth: number;   // -1 = unlimited
  agents: string[];
  features: string[];
}> = {
  free: {
    name: "Free",
    price: 0,
    sites: 1,
    runsPerMonth: 5,
    agents: ["geo-scout", "site-doctor"],
    features: [
      "1 website",
      "5 agent runs / month",
      "GEO Scout + Site Doctor",
      "Basic dashboard",
    ],
  },
  growth: {
    name: "Growth",
    price: 49,
    sites: 3,
    runsPerMonth: -1,
    agents: ["geo-scout", "site-doctor", "content-architect", "keyword-intel"],
    features: [
      "3 websites",
      "Unlimited agent runs",
      "All 3 core agents",
      "Weekly email reports",
      "Historical charts",
      "Competitor tracking",
    ],
  },
  agency: {
    name: "Agency",
    price: 199,
    sites: -1,
    runsPerMonth: -1,
    agents: [
      "geo-scout", "site-doctor", "content-architect",
      "schema-architect", "keyword-intel", "authority-builder", "campaign-intel",
    ],
    features: [
      "Unlimited websites",
      "Unlimited agent runs",
      "All 7 AI agents",
      "Shareable client reports",
      "Webhook integrations",
      "Priority support",
      "White-label exports",
    ],
  },
};

// ── Usage checking ────────────────────────────────────────────────────────────

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeSubscriptionStatus: true, planCurrentPeriodEnd: true },
  });
  if (!user) return "free";

  // Downgrade if subscription lapsed
  if (user.plan !== "free") {
    const isActive = user.stripeSubscriptionStatus === "active" ||
                     user.stripeSubscriptionStatus === "trialing";
    if (!isActive) return "free";
  }

  return (user.plan as Plan) ?? "free";
}

export async function getMonthlyRunCount(userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const siteIds = sites.map((s) => s.id);
  if (siteIds.length === 0) return 0;

  return prisma.agentRun.count({
    where: {
      siteId: { in: siteIds },
      createdAt: { gte: start },
      status: { in: ["completed", "running"] },
    },
  });
}

export interface UsageCheck {
  allowed: boolean;
  reason?: string;
  plan: Plan;
  runsUsed: number;
  runsLimit: number;
}

export async function checkAgentUsage(
  userId: string,
  agentId: string
): Promise<UsageCheck> {
  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];

  // Check if agent is available on this plan
  if (!limits.agents.includes(agentId)) {
    return {
      allowed: false,
      reason: `${agentId} is not available on the ${limits.name} plan. Upgrade to access this agent.`,
      plan,
      runsUsed: 0,
      runsLimit: limits.runsPerMonth,
    };
  }

  // Check monthly run limit
  if (limits.runsPerMonth !== -1) {
    const runsUsed = await getMonthlyRunCount(userId);
    if (runsUsed >= limits.runsPerMonth) {
      return {
        allowed: false,
        reason: `You've used all ${limits.runsPerMonth} agent runs this month. Upgrade to Growth for unlimited runs.`,
        plan,
        runsUsed,
        runsLimit: limits.runsPerMonth,
      };
    }
    return { allowed: true, plan, runsUsed, runsLimit: limits.runsPerMonth };
  }

  return { allowed: true, plan, runsUsed: -1, runsLimit: -1 };
}

export async function checkSiteLimit(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];
  if (limits.sites === -1) return true;

  const count = await prisma.site.count({ where: { userId } });
  return count < limits.sites;
}
