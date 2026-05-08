import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "rm_token";
const SESSION_DAYS = 30;

// ── Session helpers ───────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } }).catch(() => {});
}

// ── Request helpers ───────────────────────────────────────────────────────────

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.replace("Bearer ", "") ?? req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
