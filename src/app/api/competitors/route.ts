import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/billing";
import { z } from "zod";

const addSchema = z.object({
  siteId: z.string(),
  domain: z.string().min(3),
  name: z.string().min(1),
});

// GET /api/competitors?siteId=xxx
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  // Verify ownership
  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const competitors = await prisma.competitor.findMany({
    where: { siteId },
    include: {
      mentions: {
        orderBy: { checkedAt: "desc" },
        take: 50,
        select: { mentioned: true, checkedAt: true, query: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate mention rate per competitor
  const result = competitors.map((c) => {
    const total = c.mentions.length;
    const mentioned = c.mentions.filter((m) => m.mentioned).length;
    return {
      id: c.id,
      domain: c.domain,
      name: c.name,
      createdAt: c.createdAt,
      mentionRate: total > 0 ? Math.round((mentioned / total) * 100) : 0,
      totalChecks: total,
      mentionCount: mentioned,
      recentMentions: c.mentions.slice(0, 5),
    };
  });

  return NextResponse.json({ competitors: result });
}

// POST /api/competitors — add a competitor
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { siteId, domain, name } = parsed.data;

  // Verify ownership
  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Competitor tracking requires Growth+
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    return NextResponse.json(
      { error: "Competitor tracking requires a Growth or Agency plan.", upgrade: true },
      { status: 403 }
    );
  }

  // Max 5 competitors on Growth, unlimited on Agency
  if (plan === "growth") {
    const count = await prisma.competitor.count({ where: { siteId } });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Growth plan supports up to 5 competitors. Upgrade to Agency for unlimited." },
        { status: 403 }
      );
    }
  }

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

  const competitor = await prisma.competitor.upsert({
    where: { siteId_domain: { siteId, domain: cleanDomain } },
    update: { name },
    create: { siteId, domain: cleanDomain, name },
  });

  return NextResponse.json({ competitor }, { status: 201 });
}

// DELETE /api/competitors?id=xxx
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership via site relation
  const competitor = await prisma.competitor.findFirst({
    where: { id },
    include: { site: { select: { userId: true } } },
  });

  if (!competitor || competitor.site.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.competitor.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
