import { prisma } from "@/lib/prisma";
import { notifySlack } from "@/lib/webhook";
import { getUserPlan } from "@/lib/billing";

export interface AgentContext {
  siteId: string;
  domain: string;
  name: string;          // site display name
  industry: string;
  keywords: string[];    // target keywords
}

export interface AgentResult {
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
  error?: string;
}

export abstract class BaseAgent {
  abstract readonly agentName: string;

  // Subclasses implement the actual work here
  protected abstract execute(ctx: AgentContext): Promise<AgentResult>;

  async run(siteId: string): Promise<AgentResult> {
    // Fetch site context
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return { success: false, summary: "Site not found", error: "SITE_NOT_FOUND" };
    }

    // Create agent run record
    const agentRun = await prisma.agentRun.create({
      data: {
        siteId,
        agentName: this.agentName,
        status: "running",
        startedAt: new Date(),
      },
    });

    const ctx: AgentContext = {
      siteId,
      domain: site.domain,
      name: site.name,
      industry: site.industry ?? "general",
      keywords: JSON.parse(site.keywords) as string[],
    };

    let result: AgentResult;
    try {
      result = await this.execute(ctx);

      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: result.success ? "completed" : "failed",
          completedAt: new Date(),
          result: JSON.stringify(result.data ?? {}),
          error: result.error ?? null,
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: errorMsg,
        },
      });

      result = { success: false, summary: "Agent crashed", error: errorMsg };
    }

    // Fire Slack webhook if configured (non-blocking)
    if (site.slackWebhookUrl) {
      try {
        const plan = await getUserPlan(site.userId);
        notifySlack(site.slackWebhookUrl, {
          agentName: this.agentName,
          siteName: site.name,
          siteDomain: site.domain,
          success: result.success,
          summary: result.summary,
          plan,
        }).catch(() => {});
      } catch { /* ignore */ }
    }

    return result;
  }
}
