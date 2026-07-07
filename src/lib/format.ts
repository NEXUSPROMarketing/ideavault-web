import type { Scores, Trend } from "@/lib/schemas";

/** ---- scores ------------------------------------------------------------ */

export type ScoreStyle = { text: string; bar: string; bg: string };

/**
 * Score color bands (0-100): green 80+, light green 70s, amber 60s,
 * orange 50s, red below 50. `text` variants meet WCAG AA on white.
 */
export function scoreStyle(v: number): ScoreStyle {
  if (v >= 80) return { text: "#1f6b27", bar: "#2e7d32", bg: "rgba(46, 125, 50, 0.10)" };
  if (v >= 70) return { text: "#4d7c1f", bar: "#7cb342", bg: "rgba(124, 179, 66, 0.14)" };
  if (v >= 60) return { text: "#9a6a04", bar: "#e0a80c", bg: "rgba(224, 168, 12, 0.14)" };
  if (v >= 50) return { text: "#b34a0e", bar: "#ea700e", bg: "rgba(234, 112, 14, 0.12)" };
  return { text: "#b3261e", bar: "#d3372c", bg: "rgba(211, 55, 44, 0.10)" };
}

/** Same bands for 0-10 metric values. */
export function metricStyle(s: number): ScoreStyle {
  return scoreStyle(Math.round(s * 10));
}

/** Canonical display order + labels for the 12-metric breakdown. */
export const METRICS: { key: string; label: string }[] = [
  { key: "problem_severity", label: "Problem severity" },
  { key: "community_demand", label: "Community demand" },
  { key: "market_size", label: "Market size" },
  { key: "search_growth", label: "Search growth" },
  { key: "why_now", label: "Why now" },
  { key: "competitive_gap", label: "Competitive gap" },
  { key: "monetization_clarity", label: "Monetization clarity" },
  { key: "revenue_velocity", label: "Revenue velocity" },
  { key: "solution_feasibility", label: "Solution feasibility" },
  { key: "technical_simplicity", label: "Technical simplicity" },
  { key: "capital_efficiency", label: "Capital efficiency" },
  { key: "founder_accessibility", label: "Founder accessibility" },
];

function prettifyKey(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function orderedMetrics(
  scores: Scores,
): { key: string; label: string; s: number; n: string }[] {
  const out: { key: string; label: string; s: number; n: string }[] = [];
  const seen = new Set<string>();
  for (const m of METRICS) {
    const entry = scores[m.key];
    if (entry) {
      out.push({ key: m.key, label: m.label, s: entry.s, n: entry.n });
      seen.add(m.key);
    }
  }
  for (const [key, entry] of Object.entries(scores)) {
    if (!seen.has(key)) out.push({ key, label: prettifyKey(key), s: entry.s, n: entry.n });
  }
  return out;
}

/** ---- live vs estimated labeling ---------------------------------------- */

export function hasLiveMarker(s: string | null | undefined): boolean {
  return !!s && /\[live\]|\(live/i.test(s);
}

/** Remove "[live]" prefixes and the "live " lead inside parentheses. */
export function stripLiveMarker(s: string): string {
  return s
    .replace(/\[live\]\s*/gi, "")
    .replace(/\(live\s+/gi, "(")
    .trim();
}

export type Growth = {
  pct: string | null;
  note: string | null;
  live: boolean;
  positive: boolean;
  raw: string;
};

/** Parse growth strings like "+154% (live Trends index, 12-mo)". */
export function parseGrowth(g: string | null | undefined): Growth | null {
  if (!g || !g.trim()) return null;
  const live = hasLiveMarker(g);
  const raw = stripLiveMarker(g);
  const m = raw.match(/^([+\-−]?\s?\d+(?:[.,]\d+)?\s?%)\s*(?:\((.*?)\))?/);
  return {
    live,
    raw,
    pct: m?.[1]?.replace(/\s/g, "") ?? null,
    note: m?.[2]?.trim() || null,
    positive: !raw.trim().startsWith("-") && !raw.trim().startsWith("−"),
  };
}

export function growthValue(g: string | null | undefined): number {
  const pct = parseGrowth(g)?.pct;
  if (!pct) return Number.NEGATIVE_INFINITY;
  const n = parseFloat(pct.replace(/[+%,−]/g, ""));
  if (!Number.isFinite(n)) return Number.NEGATIVE_INFINITY;
  return pct.startsWith("-") || pct.startsWith("−") ? -n : n;
}

/** ---- formatting ---------------------------------------------------------- */

export function formatVolume(n: number, compact = true): string {
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return n.toLocaleString("en-US");
}

export function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return d;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export function difficultyBand(d: number | null | undefined): string {
  if (d == null) return "—";
  if (d <= 3) return "Easy";
  if (d <= 6) return "Moderate";
  return "Hard";
}

/** ---- pills & badges -------------------------------------------------------- */

const STATUS_PILLS: Record<string, string> = {
  Breakout: "bg-violet-100 text-violet-800",
  Rising: "bg-orange-100 text-orange-800",
  Steady: "bg-slate-200/70 text-slate-700",
};

export function statusPillClass(status: string): string {
  return STATUS_PILLS[status] ?? "bg-slate-200/70 text-slate-700";
}

export function sparklineClass(status: string): string {
  if (status === "Breakout") return "text-terracotta";
  if (status === "Rising") return "text-orange-600";
  return "text-slate-500";
}

const TYPE_CHIPS: Record<string, string> = {
  Stat: "bg-sky-100 text-sky-800",
  Shift: "bg-violet-100 text-violet-800",
  Behavior: "bg-teal-100 text-teal-800",
  Gap: "bg-amber-100 text-amber-800",
};

export function typeChipClass(type: string): string {
  return TYPE_CHIPS[type] ?? "bg-slate-100 text-slate-700";
}

/**
 * Level badges. For pain/gap, higher intensity = hotter color.
 * For revenue (positiveGood), higher = greener.
 */
export function levelBadgeClass(level: string | null, positiveGood = false): string {
  const l = (level ?? "").toLowerCase();
  if (positiveGood) {
    if (l === "excellent") return "bg-moss-tint text-moss";
    if (l === "high") return "bg-emerald-100 text-emerald-800";
    if (l === "moderate") return "bg-slate-100 text-slate-700";
    return "bg-slate-100 text-slate-600";
  }
  if (l === "critical") return "bg-red-100 text-red-800";
  if (l === "severe") return "bg-orange-100 text-orange-800";
  if (l === "high") return "bg-amber-100 text-amber-800";
  if (l === "moderate") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-600";
}

/** ---- trends sorting ---------------------------------------------------------- */

const STATUS_RANK: Record<string, number> = { Breakout: 0, Rising: 1, Steady: 2 };

export function sortTrends(trends: Trend[]): Trend[] {
  return [...trends].sort(
    (a, b) =>
      (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3) ||
      growthValue(b.growth) - growthValue(a.growth) ||
      (b.volume ?? 0) - (a.volume ?? 0),
  );
}

/** ---- deep dives ---------------------------------------------------------------- */

/** Split a flagship deep dive into its verdict section and the remaining body. */
export function splitDeepDive(deep: string | null): {
  body: string | null;
  verdict: string | null;
} {
  if (!deep) return { body: null, verdict: null };
  const lines = deep.split("\n");
  const start = lines.findIndex((l) => /^##\s*(?:the\s+)?verdict\b/i.test(l.trim()));
  if (start === -1) return { body: deep, verdict: null };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const verdict = lines.slice(start + 1, end).join("\n").trim();
  const body = [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
  return { body: body || null, verdict: verdict || null };
}

/** ---- sources -------------------------------------------------------------------- */

export function splitSources(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/\s*;\s*/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

export function hostFromUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}
