import {
  levelBadgeClass,
  scoreStyle,
  statusPillClass,
  typeChipClass,
} from "@/lib/format";

/** Big overall score badge (0-100), colored by band. */
export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const s = scoreStyle(score);
  return (
    <span
      className={
        size === "sm"
          ? "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-display text-sm font-bold"
          : "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-display text-lg font-bold"
      }
      style={{ color: s.text, backgroundColor: s.bg }}
      aria-label={`Overall score ${score} out of 100`}
    >
      {score}
    </span>
  );
}

/** Signal-tag chip (e.g. "Perfect Timing"). */
export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-terracotta-tint px-2 py-0.5 text-[11px] font-medium text-terracotta-deep">
      {children}
    </span>
  );
}

/** Trend status pill: Breakout / Rising / Steady. */
export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusPillClass(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </span>
  );
}

/** Insight type chip: Stat / Shift / Behavior / Gap. */
export function TypeChip({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${typeChipClass(type)}`}
    >
      {type}
    </span>
  );
}

/** Labeled level badge, e.g. Pain: Severe. */
export function LevelBadge({
  label,
  level,
  positiveGood = false,
}: {
  label: string;
  level: string | null;
  positiveGood?: boolean;
}) {
  if (!level) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass(level, positiveGood)}`}
    >
      <span className="opacity-60">{label}</span>
      {level}
    </span>
  );
}

/** Green LIVE badge for live-measured demand data. */
export function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-moss-tint px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-moss"
      title="Live measurement, not an estimate"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" aria-hidden />
      Live
    </span>
  );
}

/** Flag for flagship ideas that include a full deep-dive report. */
export function DeepDiveFlag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream">
      <span aria-hidden>★</span> Deep dive
    </span>
  );
}
