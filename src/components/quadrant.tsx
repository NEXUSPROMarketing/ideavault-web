import { metricStyle } from "@/lib/format";

type QuadrantScores = {
  score_opportunity: number;
  score_problem: number;
  score_feasibility: number;
  score_why_now: number;
};

const CELLS: { label: string; key: keyof QuadrantScores }[] = [
  { label: "Opportunity", key: "score_opportunity" },
  { label: "Problem", key: "score_problem" },
  { label: "Feasibility", key: "score_feasibility" },
  { label: "Why now", key: "score_why_now" },
];

/** 2×2 quadrant of the four headline sub-scores (each 0-10). */
export function QuadrantGrid({
  idea,
  compact = false,
}: {
  idea: QuadrantScores;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
      {CELLS.map(({ label, key }) => {
        const value = idea[key];
        const style = metricStyle(value);
        return (
          <div key={key} className={compact ? "bg-white px-2.5 py-2" : "bg-white px-3.5 py-3"}>
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              {label}
            </p>
            <p
              className={`font-display font-bold leading-tight ${compact ? "text-base" : "text-xl"}`}
              style={{ color: style.text }}
            >
              {value}
              <span className="font-sans text-[10px] font-normal text-ink-faint">/10</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
