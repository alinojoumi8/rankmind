import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// Must use raw body for Stripe signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error("[stripe-webhook] signature error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (!userId || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await updateUserSubscription(userId, plan, subscription);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const plan = sub.metadata?.plan;
        if (!userId) break;
        await updateUserSubscription(userId, plan ?? "growth", sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.updateMany({
          where: { id: userId },
          data: {
            plan: "free",
            stripeSubscriptionStatus: "canceled",
            planCurrentPeriodEnd: null,
          },
        });
        break;
      }
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateUserSubscription(
  userId: string,
  plan: string,
  subscription: Stripe.Subscription
) {
  // In Stripe API dahlia, current_period_end moved to the subscription item level
  const periodEndTs = subscription.items?.data?.[0]?.current_period_end
    ?? subscription.trial_end
    ?? null;
  const periodEnd = periodEndTs ? new Date(periodEndTs * 1000) : null;

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      plan: plan as string,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      planCurrentPeriodEnd: periodEnd,
    },
  });
}
