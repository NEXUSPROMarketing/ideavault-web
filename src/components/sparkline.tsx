/**
 * Inline SVG sparkline. Inherits color from `currentColor`; size it with
 * className (e.g. "h-9 w-full"). Stretches to fill via preserveAspectRatio.
 */
export function Sparkline({
  series,
  className = "h-9 w-full",
}: {
  series: number[];
  className?: string;
}) {
  if (!series.length) return null;
  const W = 120;
  const H = 34;
  const PAD = 3;
  const max = Math.max(...series, 1);
  const stepX = (W - PAD * 2) / Math.max(series.length - 1, 1);
  const pts = series.map((v, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - (Math.max(v, 0) / max) * (H - PAD * 2);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  });
  const line = pts.join(" ");
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <polygon points={area} fill="currentColor" opacity="0.12" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
