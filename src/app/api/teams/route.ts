import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/email";
import { getUserPlan } from "@/lib/billing";
import { z } from "zod";
import { randomBytes } from "crypto";

// GET /api/teams?siteId=xxx — list team members for a site
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteId = new URL(req.url).searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  // Verify ownership
  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const members = await prisma.teamMember.findMany({
    where: { siteId },
    select: {
      id: true,
      inviteEmail: true,
      role: true,
      invitedAt: true,
      acceptedAt: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { invitedAt: "asc" },
  });

  return NextResponse.json({ members });
}

const inviteSchema = z.object({
  siteId: z.string(),
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

// POST /api/teams — invite a team member
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { siteId, email, role } = parsed.data;

  // Verify ownership
  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Plan gate: Growth+ required for team
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    return NextResponse.json(
      { error: "Team collaboration requires a Growth or Agency plan.", upgrade: true },
      { status: 403 }
    );
  }

  // Agency: unlimited, Growth: max 3 members
  const currentCount = await prisma.teamMember.count({ where: { siteId } });
  if (plan === "growth" && currentCount >= 3) {
    return NextResponse.json(
      { error: "Growth plan allows up to 3 team members per site. Upgrade to Agency for unlimited.", upgrade: true },
      { status: 403 }
    );
  }

  // Check for existing pending invite
  const existing = await prisma.teamMember.findFirst({
    where: { siteId, inviteEmail: email },
  });
  if (existing) {
    return NextResponse.json({ error: "This email already has a pending invite." }, { status: 409 });
  }

  const inviteToken = randomBytes(32).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rankmind-ten.vercel.app";
  const acceptUrl = `${appUrl}/api/teams/accept?token=${inviteToken}`;

  // Get inviter name
  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const inviterName = inviter?.name ?? inviter?.email?.split("@")[0] ?? "A teammate";

  await prisma.teamMember.create({
    data: {
      siteId,
      invitedByUserId: userId,
      inviteEmail: email,
      role,
      inviteToken,
    },
  });

  // Send invite email (non-blocking)
  sendTeamInviteEmail(email, inviterName, site.name, role, acceptUrl).catch(() => {});

  return NextResponse.json({ ok: true, message: `Invite sent to ${email}` });
}

// DELETE /api/teams?id=xxx — remove a team member
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = new URL(req.url).searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify the site belongs to the requesting user
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { site: { select: { userId: true } } },
  });
  if (!member || member.site.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
