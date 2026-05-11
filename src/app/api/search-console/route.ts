import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";

// Refresh the access token using the stored refresh token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

// GET /api/search-console?siteId=xxx
// Returns: { siteUrl, queries[], pages[], connected, siteList[] }
export async function GET(req: NextRequest) {
  const { userId: rawUserId } = await auth();
  if (!rawUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId: string = rawUserId;

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");

  // Get user with Google tokens
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
    },
  });

  if (!user?.googleAccessToken) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }

  // Narrow type so TypeScript knows user is non-null from here
  const confirmedUser = user;
  let accessToken = confirmedUser.googleAccessToken as string;

  // Helper: authenticated GSC fetch with automatic token refresh
  async function gscFetch(url: string, options?: RequestInit): Promise<Response> {
    let res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });

    // Token expired — refresh and retry once
    if (res.status === 401 && confirmedUser.googleRefreshToken) {
      const newToken = await refreshAccessToken(confirmedUser.googleRefreshToken);
      if (newToken) {
        accessToken = newToken;
        // Persist refreshed token
        await prisma.user.update({
          where: { id: userId },
          data: { googleAccessToken: newToken },
        });
        res = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
          },
        });
      }
    }
    return res;
  }

  // Fetch list of verified sites from Search Console
  const sitesRes = await gscFetch(`${GSC_API}/sites`);
  if (!sitesRes.ok) {
    return NextResponse.json({ connected: false, error: "Failed to list sites" }, { status: 200 });
  }
  const sitesData = await sitesRes.json() as { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
  const siteList = (sitesData.siteEntry ?? []).map((s) => s.siteUrl);

  if (!siteId) {
    // Just return the list of available sites
    return NextResponse.json({ connected: true, siteList });
  }

  // Look up the site's domain to find the matching GSC property
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
    select: { domain: true, googleSearchConsoleSite: true },
  });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Use the stored GSC site URL or try to match from the list
  let gscSiteUrl = site.googleSearchConsoleSite;
  if (!gscSiteUrl) {
    // Auto-match: find a GSC property that contains the domain
    const domain = site.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    gscSiteUrl =
      siteList.find((s) => s.includes(domain)) ??
      siteList.find((s) => s.replace(/^sc-domain:/, "") === domain) ??
      null;
  }

  if (!gscSiteUrl) {
    return NextResponse.json({
      connected: true,
      siteList,
      siteUrl: null,
      error: "No matching Search Console property found for this domain",
    });
  }

  // Date range: last 28 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const baseBody = {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    rowLimit: 25,
  };

  const encodedSite = encodeURIComponent(gscSiteUrl);

  // Fetch top queries and top pages in parallel
  const [queriesRes, pagesRes] = await Promise.all([
    gscFetch(`${GSC_API}/sites/${encodedSite}/searchAnalytics/query`, {
      method: "POST",
      body: JSON.stringify({ ...baseBody, dimensions: ["query"], dimensionFilterGroups: [] }),
    }),
    gscFetch(`${GSC_API}/sites/${encodedSite}/searchAnalytics/query`, {
      method: "POST",
      body: JSON.stringify({ ...baseBody, dimensions: ["page"], dimensionFilterGroups: [] }),
    }),
  ]);

  type GSCRow = {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };

  const queriesData = queriesRes.ok
    ? ((await queriesRes.json()) as { rows?: GSCRow[] })
    : { rows: [] };
  const pagesData = pagesRes.ok
    ? ((await pagesRes.json()) as { rows?: GSCRow[] })
    : { rows: [] };

  const queries = (queriesData.rows ?? []).map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10, // percentage with 1dp
    position: Math.round(r.position * 10) / 10,
  }));

  const pages = (pagesData.rows ?? []).map((r) => ({
    page: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));

  return NextResponse.json({
    connected: true,
    siteUrl: gscSiteUrl,
    siteList,
    dateRange: { start: fmt(startDate), end: fmt(endDate) },
    queries,
    pages,
  });
}

// PATCH /api/search-console — set which GSC property is linked to a site
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, gscSiteUrl } = await req.json() as { siteId: string; gscSiteUrl: string };
  if (!siteId || !gscSiteUrl) {
    return NextResponse.json({ error: "siteId and gscSiteUrl required" }, { status: 400 });
  }

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  await prisma.site.update({
    where: { id: siteId },
    data: { googleSearchConsoleSite: gscSiteUrl },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/search-console — disconnect Google account
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { googleAccessToken: null, googleRefreshToken: null },
  });

  return NextResponse.json({ ok: true });
}
