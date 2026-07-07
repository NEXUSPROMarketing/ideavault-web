import { scoreStyle } from "@/lib/format";

/** Conic-gradient score ring with the overall 0-100 score in the middle. */
export function ScoreRing({
  score,
  size = 116,
  thickness = 10,
  label = "Overall",
}: {
  score: number;
  size?: number;
  thickness?: number;
  label?: string;
}) {
  const s = scoreStyle(score);
  const clamped = Math.max(0, Math.min(100, score));
  const deg = clamped * 3.6;
  return (
    <div
      role="img"
      aria-label={`${label} score ${score} out of 100`}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${s.bar} ${deg}deg, #efe8da ${deg}deg 360deg)`,
      }}
    >
      <div
        className="absolute flex flex-col items-center justify-center rounded-full bg-white"
        style={{ inset: thickness }}
      >
        <span className="font-display text-3xl font-bold leading-none" style={{ color: s.text }}>
          {score}
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
      </div>
    </div>
  );
}
