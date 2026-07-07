import type { Scores } from "@/lib/schemas";
import { metricStyle, orderedMetrics } from "@/lib/format";
import { LiveText } from "@/components/live-text";

/** Horizontal bar breakdown of the 12 scoring metrics with rationale notes. */
export function MetricBars({ scores }: { scores: Scores }) {
  const metrics = orderedMetrics(scores);
  if (!metrics.length) {
    return <p className="text-sm text-ink-faint">No metric breakdown available yet.</p>;
  }
  return (
    <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
      {metrics.map(({ key, label, s, n }) => {
        const style = metricStyle(s);
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="font-display text-sm font-bold" style={{ color: style.text }}>
                {s}
                <span className="font-sans text-xs font-normal text-ink-faint">/10</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/70">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(10, s)) * 10}%`, backgroundColor: style.bar }}
              />
            </div>
            {n && (
              <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
                <LiveText text={n} />
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
