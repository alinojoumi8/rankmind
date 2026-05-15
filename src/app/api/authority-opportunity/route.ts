import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/authority-opportunity?siteId=xxx — list opportunities for a site
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  // Verify ownership
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
  if (!site || site.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const opportunities = await prisma.authorityOpportunity.findMany({
    where: { siteId },
    orderBy: [
      // priority order: high first
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Summary counts
  const summary = {
    total: opportunities.length,
    byStatus: {
      identified: opportunities.filter((o) => o.status === "identified").length,
      researching: opportunities.filter((o) => o.status === "researching").length,
      drafting: opportunities.filter((o) => o.status === "drafting").length,
      outreachSent: opportunities.filter((o) => o.status === "outreach-sent").length,
      won: opportunities.filter((o) => o.status === "won").length,
      lost: opportunities.filter((o) => o.status === "lost").length,
      skipped: opportunities.filter((o) => o.status === "skipped").length,
    },
    byPriority: {
      high: opportunities.filter((o) => o.priority === "high").length,
      medium: opportunities.filter((o) => o.priority === "medium").length,
      low: opportunities.filter((o) => o.priority === "low").length,
    },
    withOutreach: opportunities.filter((o) => o.outreachCopy != null).length,
  };

  return NextResponse.json({ opportunities, summary });
}

// POST /api/authority-opportunity — create a manual opportunity
const createSchema = z.object({
  siteId: z.string(),
  type: z.enum(["guest-post", "resource-link", "broken-link", "digital-pr", "podcast", "community", "unlinked-mention"]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  targetUrl: z.string().url().optional(),
  targetDomain: z.string().optional(),
  contactEmail: z.string().email().optional(),
  pitchAngle: z.string().optional(),
  outreachCopy: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { siteId, ...data } = parsed.data;

  // Verify ownership
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
  if (!site || site.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const opportunity = await prisma.authorityOpportunity.create({
    data: { siteId, ...data },
  });

  return NextResponse.json({ opportunity }, { status: 201 });
}
