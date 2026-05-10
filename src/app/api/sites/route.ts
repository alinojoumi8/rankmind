import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSiteSchema = z.object({
  domain: z.string().min(3),
  name: z.string().min(1),
  industry: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  userId: z.string(), // Clerk user ID (user_xxx) or legacy demo ID
  // Optional Clerk profile fields — used to upsert a real User record
  email: z.string().email().optional(),
  displayName: z.string().optional(),
});

// Ensure a User row exists for the given userId (idempotent)
async function ensureUser(userId: string, email?: string, displayName?: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: email ?? `${userId}@clerk.rankmind.ai`,
      name: displayName ?? null,
    },
  });
}

// GET /api/sites?userId=xxx — list sites for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Auto-create user row if this is a Clerk user hitting the API for the first time
  await ensureUser(userId).catch(() => {});

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

// POST /api/sites — create or update a site
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { domain, name, industry, keywords, userId, email, displayName } = parsed.data;

    await ensureUser(userId, email, displayName);

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
