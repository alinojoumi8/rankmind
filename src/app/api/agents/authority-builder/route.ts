import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AuthorityBuilderAgent } from "@/lib/agents/authority-builder";
import { checkAgentUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ siteId: z.string() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const { siteId } = parsed.data;
  const { userId: clerkUserId } = await auth();
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const userId = clerkUserId ?? site.userId;

  const usage = await checkAgentUsage(userId, "authority-builder");
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, upgrade: true }, { status: 403 });
  }

  if (!process.env.MINIMAX_API_KEY) {
    return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 503 });
  }

  const agent = new AuthorityBuilderAgent();
  const result = await agent.run(siteId);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
