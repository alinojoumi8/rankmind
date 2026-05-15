import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["identified", "researching", "drafting", "outreach-sent", "won", "lost", "skipped"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  targetUrl: z.string().url().optional().nullable(),
  targetDomain: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  pitchAngle: z.string().optional().nullable(),
  outreachCopy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// PATCH /api/authority-opportunity/[id] — update status or fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership via site
  const opp = await prisma.authorityOpportunity.findUnique({
    where: { id },
    include: { site: { select: { userId: true } } },
  });
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (opp.site.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.authorityOpportunity.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ opportunity: updated });
}

// DELETE /api/authority-opportunity/[id] — remove an opportunity
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const opp = await prisma.authorityOpportunity.findUnique({
    where: { id },
    include: { site: { select: { userId: true } } },
  });
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (opp.site.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.authorityOpportunity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
