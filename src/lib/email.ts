import type { Idea } from "@/lib/schemas";
import { formatDate, formatVolume, parseGrowth } from "@/lib/format";
import { HONESTY_LINE, siteUrl } from "@/lib/site";

/** Daily-drop email renderer — inline-styled, table-based HTML for email clients. */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(s: string): string {
  return esc(s).replace(/\n+/g, "<br/>");
}

const SECTION_LABEL =
  'font:700 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#c2571b;padding:18px 0 4px;';
const SECTION_BODY = 'font:400 14px/1.65 Arial,sans-serif;color:#57524a;';

export function renderDailyDropEmail(idea: Idea, unsubToken?: string | null): string {
  const base = siteUrl();
  const reportUrl = `${base}/ideas/${idea.slug}`;
  const growth = parseGrowth(idea.keyword_growth);

  const sections: [string, string | null][] = [
    ["Problem", idea.problem],
    ["Solution", idea.solution],
    ["Why now", idea.why_now],
    ["Market size", idea.market_size],
    ["Business model", idea.business_model],
    ["Go-to-market", idea.gtm],
    ["MVP scope", idea.mvp_scope],
    ["Revenue potential", idea.revenue_potential],
  ];

  const demandBits: string[] = [];
  if (idea.keyword) demandBits.push(`Keyword: &ldquo;${esc(idea.keyword)}&rdquo;`);
  if (idea.keyword_volume != null)
    demandBits.push(`${formatVolume(idea.keyword_volume, false)}/mo (est.)`);
  if (growth?.pct)
    demandBits.push(
      `${esc(growth.pct)} 12-mo${growth.live ? ' <span style="color:#3d5a3d;font-weight:700;">&#9679; LIVE</span>' : ""}`,
    );

  const fitBits = [
    idea.revenue_tier ? `Revenue ${esc(idea.revenue_tier)}` : null,
    idea.execution_difficulty != null ? `Difficulty ${idea.execution_difficulty}/10` : null,
    idea.time_to_mvp ? `MVP in ${esc(idea.time_to_mvp)}` : null,
    idea.startup_costs ? `Costs ${esc(idea.startup_costs)}` : null,
  ].filter(Boolean);

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#faf7f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:0 4px 14px;">
    <span style="font:800 20px/1 Georgia,serif;color:#1c1a16;">Idea<span style="color:#c2571b;">Vault</span></span>
    <span style="font:400 12px/1 Arial,sans-serif;color:#8a8375;">&nbsp;&nbsp;Idea of the day · ${esc(formatDate(idea.dropped_on) ?? "")}</span>
  </td></tr>
  <tr><td style="background:#ffffff;border:1px solid #e8e1d5;border-radius:14px;padding:28px;">
    <div style="font:700 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#8a8375;">${esc(idea.category)}${idea.is_flagship ? ' &nbsp;·&nbsp; <span style="color:#c2571b;">&#9733; Deep dive</span>' : ""}</div>
    <h1 style="margin:10px 0 0;font:700 26px/1.25 Georgia,serif;color:#1c1a16;">${esc(idea.title)}</h1>
    ${idea.tagline ? `<p style="margin:10px 0 0;${SECTION_BODY}font-size:15px;">${esc(idea.tagline)}</p>` : ""}
    <p style="margin:16px 0 0;font:700 15px/1.4 Arial,sans-serif;color:#1f6b27;">
      Overall ${idea.score_overall}/100
      <span style="font-weight:400;color:#8a8375;">&nbsp;·&nbsp; Opportunity ${idea.score_opportunity} · Problem ${idea.score_problem} · Feasibility ${idea.score_feasibility} · Why now ${idea.score_why_now}</span>
    </p>
    ${fitBits.length ? `<p style="margin:6px 0 0;font:400 13px/1.5 Arial,sans-serif;color:#57524a;">${fitBits.join(" &nbsp;·&nbsp; ")}</p>` : ""}
    ${demandBits.length ? `<div style="${SECTION_LABEL}">Demand signals</div><p style="margin:0;${SECTION_BODY}">${demandBits.join(" &nbsp;·&nbsp; ")}</p>${idea.demand_signals ? `<p style="margin:6px 0 0;${SECTION_BODY}">${para(idea.demand_signals)}</p>` : ""}` : ""}
    ${sections
      .filter(([, text]) => !!text)
      .map(([label, text]) => `<div style="${SECTION_LABEL}">${esc(label)}</div><p style="margin:0;${SECTION_BODY}">${para(text as string)}</p>`)
      .join("")}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>
      <td style="background:#c2571b;border-radius:999px;">
        <a href="${reportUrl}" style="display:inline-block;padding:11px 22px;font:700 14px/1 Arial,sans-serif;color:#ffffff;text-decoration:none;">Read the full report →</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:16px 8px;font:400 11px/1.6 Arial,sans-serif;color:#8a8375;" align="center">
    ${esc(HONESTY_LINE)}<br/>
    <a href="${base}/today" style="color:#8a8375;">View on the web</a>${unsubToken ? ` &nbsp;·&nbsp; <a href="${base}/unsubscribe?token=${encodeURIComponent(unsubToken)}" style="color:#8a8375;">Unsubscribe</a>` : ""}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function renderDailyDropText(idea: Idea): string {
  const base = siteUrl();
  const lines: string[] = [
    `IDEAVAULT — IDEA OF THE DAY`,
    ``,
    `${idea.title}`,
    idea.tagline ?? "",
    ``,
    `Overall ${idea.score_overall}/100 · Opportunity ${idea.score_opportunity} · Problem ${idea.score_problem} · Feasibility ${idea.score_feasibility} · Why now ${idea.score_why_now}`,
    ``,
  ];
  const push = (label: string, text: string | null) => {
    if (text) lines.push(`${label.toUpperCase()}`, text, ``);
  };
  push("Problem", idea.problem);
  push("Solution", idea.solution);
  push("Why now", idea.why_now);
  push("Business model", idea.business_model);
  lines.push(`Full report: ${base}/ideas/${idea.slug}`, ``, HONESTY_LINE);
  return lines.join("\n");
}
