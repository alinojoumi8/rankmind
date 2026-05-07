import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSiteSchema = z.object({
  domain: z.string().min(3),
  name: z.string().min(1),
  industry: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  // For demo: userId passed directly. In production use session.
  userId: z.string(),
});

// GET /api/sites — list sites for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      _count: { select: { citations: true, contents: true, siteIssues: true, agentRuns: true } },
      metrics: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sites });
}

// POST /api/sites — create a new site
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { domain, name, industry, keywords, userId } = parsed.data;

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@demo.rankmind.ai`, name: "Demo User" },
    });

    const site = await prisma.site.upsert({
      where: { userId_domain: { userId, domain } },
      update: { name, industry, keywords: JSON.stringify(keywords ?? []) },
      create: {
        userId,
        domain,
        name,
        industry,
        keywords: JSON.stringify(keywords ?? []),
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string; meta?: unknown };
    console.error("[/api/sites POST] error:", err.message, err.code, err.meta);
    return NextResponse.json(
      {
        error: err.message,
        code: err.code,
        meta: err.meta,
        hasTurso: !!process.env.TURSO_DATABASE_URL,
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
      },
      { status: 500 }
    );
  }
}
