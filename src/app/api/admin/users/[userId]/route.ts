import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing";

function isAdmin(userId: string) {
  const adminId = process.env.ADMIN_USER_ID;
  return !!adminId && userId === adminId;
}

// GET /api/admin/users/[userId] — full user detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth();
  if (!adminId || !isAdmin(adminId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true,
      planCurrentPeriodEnd: true,
      createdAt: true,
      _count: { select: { sites: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Fetch live Stripe subscription if exists
  let stripeSubscription = null;
  if (user.stripeSubscriptionId) {
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch { /* ignore */ }
  }

  return NextResponse.json({ user, stripeSubscription });
}

// POST /api/admin/users/[userId] — perform action
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth();
  if (!adminId || !isAdmin(adminId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { action } = body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── extend_trial ──────────────────────────────────────────────────────────
  if (action === "extend_trial") {
    const days: number = body.days ?? 7;

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active Stripe subscription" }, { status: 400 });
    }

    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const currentTrialEnd = sub.trial_end ?? Math.floor(Date.now() / 1000);
    const newTrialEnd = currentTrialEnd + days * 86400;

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      trial_end: newTrialEnd,
    });

    // Update local DB
    await prisma.user.update({
      where: { id: userId },
      data: { planCurrentPeriodEnd: new Date(newTrialEnd * 1000) },
    });

    return NextResponse.json({ ok: true, newTrialEnd: new Date(newTrialEnd * 1000) });
  }

  // ── change_plan ───────────────────────────────────────────────────────────
  if (action === "change_plan") {
    const plan: string = body.plan;
    if (!["free", "growth", "agency"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // When admin sets plan directly (no Stripe), clear stripe IDs so getUserPlan
    // uses the admin-bypass path (plan is honoured without subscription check).
    // If user has an active Stripe subscription, cancel it first.
    if (plan === "free" && user.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId).catch(() => {});
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        // Clear Stripe fields so the admin-granted path in getUserPlan applies
        ...(plan !== "free" ? {
          stripeSubscriptionId: null,
          stripeSubscriptionStatus: null,
          planCurrentPeriodEnd: null,
        } : {
          stripeSubscriptionId: null,
          stripeSubscriptionStatus: "canceled",
          planCurrentPeriodEnd: null,
        }),
      },
    });

    return NextResponse.json({ ok: true, plan });
  }

  // ── grant_free_trial ──────────────────────────────────────────────────────
  // Creates a Stripe subscription with trial (no card needed) for the user
  if (action === "grant_free_trial") {
    const plan: "growth" | "agency" = body.plan ?? "growth";
    const days: number = body.days ?? 14;
    const { PRICES } = await import("@/lib/billing");

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const trialEnd = Math.floor(Date.now() / 1000) + days * 86400;

    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PRICES[plan] }],
      trial_end: trialEnd,
      payment_behavior: "default_incomplete",
      metadata: { userId, plan },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        stripeSubscriptionId: sub.id,
        stripeSubscriptionStatus: sub.status,
        planCurrentPeriodEnd: new Date(trialEnd * 1000),
      },
    });

    return NextResponse.json({ ok: true, subscriptionId: sub.id });
  }

  // ── cancel_subscription ───────────────────────────────────────────────────
  if (action === "cancel_subscription") {
    if (!user.stripeSubscriptionId) {
      // Just downgrade in DB
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free", stripeSubscriptionStatus: "canceled", planCurrentPeriodEnd: null },
      });
      return NextResponse.json({ ok: true });
    }

    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    await prisma.user.update({
      where: { id: userId },
      data: { plan: "free", stripeSubscriptionStatus: "canceled", planCurrentPeriodEnd: null },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
