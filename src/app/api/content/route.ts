import { NextRequest, NextResponse } from "next/server";
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

// PATCH /api/content — update content status (approve/publish)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const schema = z.object({
    id: z.string(),
    status: z.enum(["draft", "review", "published"]),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const content = await prisma.content.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? new Date() : null,
    },
  });

  return NextResponse.json({ content });
}
