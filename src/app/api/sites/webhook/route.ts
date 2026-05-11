import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/billing";
import { z } from "zod";

const schema = z.object({
  siteId: z.string(),
  slackWebhookUrl: z.string().url().nullable(),
});

// PATCH /api/sites/webhook — save/clear Slack webhook URL
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { siteId, slackWebhookUrl } = parsed.data;

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Webhooks require Agency plan
  if (slackWebhookUrl) {
    const plan = await getUserPlan(userId);
    if (plan !== "agency") {
      return NextResponse.json(
        { error: "Slack webhooks require the Agency plan.", upgrade: true },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.site.update({
    where: { id: siteId },
    data: { slackWebhookUrl },
    select: { id: true, slackWebhookUrl: true },
  });

  return NextResponse.json(updated);
}
