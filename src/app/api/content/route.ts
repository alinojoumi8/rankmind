import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/content?siteId=xxx — list content
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const contents = await prisma.content.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contents });
}

// PATCH /api/content — update content status (approve/publish/draft)
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    id: z.string(),
    status: z.enum(["draft", "review", "published"]),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify ownership
  const existing = await prisma.content.findFirst({
    where: { id: parsed.data.id },
    include: { site: { select: { userId: true } } },
  });
  if (!existing || existing.site.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = await prisma.content.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? new Date() : existing.publishedAt,
    },
    select: { id: true, status: true, publishedAt: true },
  });

  return NextResponse.json({ content });
}

// DELETE /api/content?id=xxx
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.content.findFirst({
    where: { id },
    include: { site: { select: { userId: true } } },
  });
  if (!existing || existing.site.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.content.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
