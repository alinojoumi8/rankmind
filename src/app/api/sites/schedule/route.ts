import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/billing";
import { z } from "zod";

const schema = z.object({
  siteId: z.string(),
  enabled: z.boolean(),
  frequency: z.enum(["weekly", "daily"]).optional().default("weekly"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { siteId, enabled, frequency } = parsed.data;

  // Verify site belongs to user
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Only paid plans can enable scheduling
  if (enabled) {
    const plan = await getUserPlan(userId);
    if (plan === "free") {
      return NextResponse.json(
        { error: "Scheduled runs require a Growth or Agency plan.", upgrade: true },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.site.update({
    where: { id: siteId },
    data: {
      scheduleEnabled: enabled,
      scheduleFrequency: frequency,
    },
    select: {
      id: true,
      scheduleEnabled: true,
      scheduleFrequency: true,
      lastScheduledRunAt: true,
    },
  });

  return NextResponse.json(updated);
}
