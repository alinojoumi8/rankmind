import { Resend } from "resend";

// Lazy-initialise so missing key at build-time doesn't crash module evaluation
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM = "RankMind <reports@rankmind.io>";

// ── Weekly Report Email ───────────────────────────────────────────────────────

export interface WeeklyReportData {
  userName: string;
  userEmail: string;
  sites: Array<{
    domain: string;
    name: string;
    geoScore: number;
    geoScoreChange: number;
    citationsTotal: number;
    citationsCited: number;
    citationRate: number;
    openIssues: number;
    criticalIssues: number;
    newContent: number;
    agentsRun: number;
  }>;
  weekOf: string;
}

export async function sendWeeklyReport(data: WeeklyReportData) {
  const { userName, userEmail, sites, weekOf } = data;

  const siteSections = sites
    .map(
      (site) => `
    <div style="background:#0d1629;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:16px;font-weight:700;color:#fff;">${site.name}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${site.domain}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px;font-weight:700;color:${site.geoScore >= 70 ? "#34d399" : site.geoScore >= 40 ? "#f59e0b" : "#f87171"};">${site.geoScore}</div>
          <div style="font-size:11px;color:#64748b;">GEO Score</div>
          ${site.geoScoreChange !== 0 ? `<div style="font-size:11px;color:${site.geoScoreChange > 0 ? "#34d399" : "#f87171"};margin-top:2px;">${site.geoScoreChange > 0 ? "▲" : "▼"} ${Math.abs(site.geoScoreChange)} pts this week</div>` : ""}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="background:rgba(99,102,241,0.1);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#818cf8;">${site.citationsCited}/${site.citationsTotal}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">AI Citations</div>
          <div style="font-size:10px;color:#6366f1;margin-top:1px;">${site.citationRate}% rate</div>
        </div>
        <div style="background:rgba(239,68,68,0.08);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:${site.criticalIssues > 0 ? "#f87171" : "#34d399"};">${site.openIssues}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">Open Issues</div>
          ${site.criticalIssues > 0 ? `<div style="font-size:10px;color:#f87171;margin-top:1px;">${site.criticalIssues} critical</div>` : `<div style="font-size:10px;color:#34d399;margin-top:1px;">All clear</div>`}
        </div>
        <div style="background:rgba(52,211,153,0.08);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#34d399;">${site.agentsRun}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">Agent Runs</div>
          ${site.newContent > 0 ? `<div style="font-size:10px;color:#34d399;margin-top:1px;">+${site.newContent} articles</div>` : ""}
        </div>
      </div>
    </div>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Weekly RankMind Report</title>
</head>
<body style="margin:0;padding:0;background:#050914;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:7px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:14px;">⚡</span>
        </div>
        <span style="color:#fff;font-size:18px;font-weight:700;">RankMind</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">Your Weekly AI Visibility Report</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">Week of ${weekOf} · Hi ${userName}!</p>
    </div>

    <!-- Site sections -->
    ${siteSections}

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://rankmind-ten.vercel.app/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
        View Full Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;">
      <p style="color:#334155;font-size:11px;margin:0;">
        You're receiving this because you have auto-reports enabled on RankMind.<br>
        <a href="https://rankmind-ten.vercel.app/billing" style="color:#475569;text-decoration:underline;">Manage preferences</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: userEmail,
    subject: `📊 Your RankMind Weekly Report — ${weekOf}`,
    html,
  });
}

// ── Trial Ending Email ────────────────────────────────────────────────────────

export async function sendTrialEndingEmail(
  userEmail: string,
  userName: string,
  daysLeft: number,
  planName: string
) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#050914;font-family:-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:7px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:14px;">⚡</span>
        </div>
        <span style="color:#fff;font-size:18px;font-weight:700;">RankMind</span>
      </div>
      <h2 style="color:#fff;margin:8px 0 4px;">Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}</h2>
      <p style="color:#64748b;font-size:14px;margin:0;">Hi ${userName} — your ${planName} trial is almost up.</p>
    </div>

    <div style="background:#0d1629;border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">When your trial ends your agents will pause. Keep them running by activating your subscription — no changes to your setup, everything continues automatically.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        ${["AI citations tracked", "Content generated", "Technical issues found", "Schema markup live"].map(f =>
          `<div style="background:rgba(99,102,241,0.08);border-radius:8px;padding:12px;font-size:12px;color:#818cf8;">✓ ${f}</div>`
        ).join("")}
      </div>
      <div style="text-align:center;">
        <a href="https://rankmind-ten.vercel.app/billing"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
          Activate ${planName} — Keep Agents Running →
        </a>
      </div>
    </div>

    <p style="color:#334155;font-size:11px;text-align:center;margin:0;">
      You're receiving this as part of your RankMind trial.<br>
      <a href="https://rankmind-ten.vercel.app/billing" style="color:#475569;">Manage subscription</a>
    </p>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: userEmail,
    subject: `⚡ Your RankMind trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    html,
  });
}

// ── Payment Failed Email ──────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  userEmail: string,
  userName: string,
  planName: string
) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#050914;font-family:-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:40px;">⚠️</span>
      <h2 style="color:#fff;margin:12px 0 4px;">Payment failed</h2>
      <p style="color:#64748b;font-size:14px;margin:0;">Hi ${userName} — we couldn't charge your card for your ${planName} subscription.</p>
    </div>

    <div style="background:#0d1629;border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Your agents are still running but will pause if payment isn't resolved within 3 days. Please update your payment method to keep everything going.</p>
      <div style="text-align:center;">
        <a href="https://rankmind-ten.vercel.app/billing"
           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
          Update Payment Method →
        </a>
      </div>
    </div>

    <p style="color:#334155;font-size:11px;text-align:center;margin:0;">
      Need help? Reply to this email or visit <a href="https://rankmind-ten.vercel.app" style="color:#475569;">rankmind-ten.vercel.app</a>
    </p>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: userEmail,
    subject: "⚠️ RankMind payment failed — action required",
    html,
  });
}

// ── Team Invite Email ─────────────────────────────────────────────────────────

export async function sendTeamInviteEmail(
  inviteEmail: string,
  inviterName: string,
  siteName: string,
  role: string,
  acceptUrl: string
) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#050914;font-family:-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:7px;">
          <span style="color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;height:100%;">⚡</span>
        </div>
        <span style="color:#fff;font-size:18px;font-weight:700;">RankMind</span>
      </div>
      <h2 style="color:#fff;margin:8px 0 4px;">You've been invited</h2>
      <p style="color:#64748b;font-size:14px;margin:0;">
        <strong style="color:#94a3b8;">${inviterName}</strong> has invited you to collaborate on <strong style="color:#94a3b8;">${siteName}</strong> as a <strong style="color:#818cf8;">${role}</strong>.
      </p>
    </div>

    <div style="background:#0d1629;border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Click the button below to accept your invitation and access the RankMind dashboard for ${siteName}.</p>
      <a href="${acceptUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
        Accept Invitation →
      </a>
      <p style="color:#475569;font-size:11px;margin:16px 0 0;">This invite expires in 7 days. If you didn't expect this, you can ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: inviteEmail,
    subject: `${inviterName} invited you to ${siteName} on RankMind`,
    html,
  });
}

// ── Upgrade Nudge Email ───────────────────────────────────────────────────────

export async function sendUpgradeNudge(
  userEmail: string,
  userName: string,
  reason: string
) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#050914;font-family:-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:32px;">⚡</span>
      <h2 style="color:#fff;margin:8px 0;">You've hit your plan limit</h2>
      <p style="color:#64748b;font-size:14px;">${reason}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://rankmind-ten.vercel.app/billing"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
        Upgrade to Growth — $49/mo →
      </a>
      <p style="color:#334155;font-size:11px;margin-top:16px;">14-day free trial · Cancel anytime</p>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: userEmail,
    subject: "⚡ Upgrade RankMind to keep your agents running",
    html,
  });
}
