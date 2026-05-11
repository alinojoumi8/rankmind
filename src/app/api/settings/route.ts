import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  weeklyEmailEnabled: z.boolean().optional(),
});

// GET /api/settings — return user profile + preferences
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      stripeSubscriptionStatus: true,
      planCurrentPeriodEnd: true,
      weeklyEmailEnabled: true,
      createdAt: true,
      _count: { select: { sites: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/settings — update name or preferences
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, weeklyEmailEnabled: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/settings — delete account (cancel Stripe sub + wipe all data)
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true, stripeCustomerId: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cancel Stripe subscription immediately
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch { /* already cancelled or doesn't exist */ }
  }

  // Delete all user data (cascades to sites, runs, content, etc.)
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
