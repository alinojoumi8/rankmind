/**
 * Slack (and generic webhook) notification utility.
 * Fires after agent runs to keep teams informed in real-time.
 */

export interface AgentRunSummary {
  agentName: string;
  siteName: string;
  siteDomain: string;
  success: boolean;
  summary: string;
  plan: string;
}

export async function notifySlack(
  webhookUrl: string,
  run: AgentRunSummary
): Promise<void> {
  const agentEmoji: Record<string, string> = {
    "geo-scout": "🔍",
    "site-doctor": "🩺",
    "content-architect": "✍️",
    "schema-architect": "🏗️",
    "keyword-intel": "📊",
    "authority-builder": "🔗",
    "campaign-intel": "📣",
  };

  const emoji = agentEmoji[run.agentName] ?? "🤖";
  const statusEmoji = run.success ? "✅" : "❌";
  const agentLabel = run.agentName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${statusEmoji} *${emoji} ${agentLabel}* finished for *${run.siteName}*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: run.summary,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🌐 ${run.siteDomain} · Plan: ${run.plan} · Powered by <https://rankmind-ten.vercel.app|RankMind>`,
          },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-critical — don't crash the agent run
    console.error("[webhook] Slack notification failed:", err);
  }
}
