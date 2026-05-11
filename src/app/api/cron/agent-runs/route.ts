import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan, PLANS } from "@/lib/billing";
import { GeoScoutAgent } from "@/lib/agents/geo-scout";
import { SiteDoctorAgent } from "@/lib/agents/site-doctor";
import { ContentArchitectAgent } from "@/lib/agents/content-architect";

export const maxDuration = 300; // 5 min — cron can run longer than normal requests

// Agents to run per plan
const PLAN_AGENTS: Record<string, string[]> = {
  growth: ["geo-scout", "site-doctor"],
  agency: ["geo-scout", "site-doctor", "content-architect"],
};

export async function GET(req: NextRequest) {
  // Verify this is a Vercel cron request or an authorized call
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find all sites with scheduling enabled that are due for a run
  const sites = await prisma.site.findMany({
    where: {
      scheduleEnabled: true,
      OR: [
        { lastScheduledRunAt: null },
        {
          scheduleFrequency: "weekly",
          lastScheduledRunAt: { lte: oneWeekAgo },
        },
        {
          scheduleFrequency: "daily",
          lastScheduledRunAt: { lte: oneDayAgo },
        },
      ],
    },
    select: {
      id: true,
      domain: true,
      userId: true,
      scheduleFrequency: true,
    },
  });

  console.log(`[cron/agent-runs] Found ${sites.length} sites due for scheduled run`);

  const results: Array<{ siteId: string; domain: string; agents: string[]; ok: boolean; error?: string }> = [];

  for (const site of sites) {
    try {
      const plan = await getUserPlan(site.userId);

      // Only run for paid plans
      if (plan === "free") {
        await prisma.site.update({
          where: { id: site.id },
          data: { scheduleEnabled: false },
        });
        continue;
      }

      const agentsToRun = PLAN_AGENTS[plan] ?? PLAN_AGENTS.growth;
      const agentResults: string[] = [];

      for (const agentId of agentsToRun) {
        try {
          if (agentId === "geo-scout" && process.env.OPENROUTER_API_KEY) {
            await new GeoScoutAgent().run(site.id);
            agentResults.push(agentId);
          } else if (agentId === "site-doctor" && process.env.MINIMAX_API_KEY) {
            await new SiteDoctorAgent().run(site.id);
            agentResults.push(agentId);
          } else if (agentId === "content-architect" && process.env.MINIMAX_API_KEY) {
            await new ContentArchitectAgent().run(site.id);
            agentResults.push(agentId);
          }
        } catch (agentErr) {
          console.error(`[cron/agent-runs] Agent ${agentId} failed for ${site.domain}:`, agentErr);
        }
      }

      // Update last run timestamp
      await prisma.site.update({
        where: { id: site.id },
        data: { lastScheduledRunAt: now },
      });

      results.push({ siteId: site.id, domain: site.domain, agents: agentResults, ok: true });
    } catch (err) {
      console.error(`[cron/agent-runs] Site ${site.domain} failed:`, err);
      results.push({ siteId: site.id, domain: site.domain, agents: [], ok: false, error: String(err) });
    }
  }

  return NextResponse.json({
    ran: results.length,
    results,
    timestamp: now.toISOString(),
  });
}
