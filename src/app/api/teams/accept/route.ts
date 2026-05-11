import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/teams/accept?token=xxx — accept a team invite
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rankmind-ten.vercel.app";
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${appUrl}/dashboard?team_error=invalid_token`);
  }

  const invite = await prisma.teamMember.findUnique({
    where: { inviteToken: token },
    include: { site: { select: { name: true, domain: true } } },
  });

  if (!invite) {
    return NextResponse.redirect(`${appUrl}/dashboard?team_error=invite_not_found`);
  }

  if (invite.acceptedAt) {
    return NextResponse.redirect(`${appUrl}/dashboard?team_error=already_accepted`);
  }

  // Check if invite is expired (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (invite.invitedAt < sevenDaysAgo) {
    return NextResponse.redirect(`${appUrl}/dashboard?team_error=invite_expired`);
  }

  // If user is already logged in, link them directly
  const { userId } = await auth();
  if (userId) {
    await prisma.teamMember.update({
      where: { id: invite.id },
      data: { userId, acceptedAt: new Date() },
    });
    return NextResponse.redirect(
      `${appUrl}/dashboard?team_joined=${encodeURIComponent(invite.site.name)}`
    );
  }

  // Not logged in — redirect to sign-up with the token so we can link after auth
  return NextResponse.redirect(
    `${appUrl}/signup?invite=${token}&email=${encodeURIComponent(invite.inviteEmail)}`
  );
}
