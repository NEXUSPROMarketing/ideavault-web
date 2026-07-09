import Link from "next/link";
import type { IdeaCard, Trend } from "@/lib/schemas";
import {
  formatDate,
  formatVolume,
  hostFromUrl,
  parseGrowth,
  sparklineClass,
  splitSources,
} from "@/lib/format";
import { LiveBadge, ScoreBadge, StatusPill } from "@/components/pills";
import { Sparkline } from "@/components/sparkline";

/** Trend card with status, volume, growth, sparkline and expandable detail. */
export function TrendCard({
  trend,
  linkedIdeas,
}: {
  trend: Trend;
  linkedIdeas: IdeaCard[];
}) {
  const growth = parseGrowth(trend.growth);
  const sources = splitSources(trend.sources);
  const updated = formatDate(trend.signals_updated);

  return (
    <article className="card flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={trend.status} />
        {updated && <span className="text-[11px] text-ink-faint">Signals {updated}</span>}
      </div>

      <h2 className="mt-3 font-display text-xl font-semibold leading-snug">{trend.name}</h2>
      {trend.category && (
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
          {trend.category}
        </p>
      )}
      {trend.description && (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{trend.description}</p>
      )}

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Search volume
          </p>
          <p className="font-display text-2xl font-bold leading-tight">
            {trend.volume != null ? formatVolume(trend.volume) : "—"}
            <span className="font-sans text-xs font-normal text-ink-faint">/mo (est.)</span>
          </p>
        </div>
        {growth && (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              12-mo growth
            </p>
            <p
              className={`font-display text-xl font-bold leading-tight ${growth.positive ? "text-moss" : "text-red-700"}`}
            >
              {growth.pct ?? growth.raw}
              {growth.live && (
                <>
                  {" "}
                  <LiveBadge />
                </>
              )}
            </p>
            {growth.note && <p className="text-[11px] text-ink-faint">({growth.note})</p>}
          </div>
        )}
      </div>

      {trend.volume_series.length > 0 && (
        <div className={`mt-3 ${sparklineClass(trend.status)}`}>
          <Sparkline series={trend.volume_series} className="h-10 w-full" />
        </div>
      )}

      {/* Linked ideas — always visible, the card's main action */}
      {linkedIdeas.length > 0 && (
        <div className="mt-4 border-t border-line/70 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Ideas riding this trend
          </p>
          <ul className="mt-1.5">
            {linkedIdeas.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/ideas/${i.slug}`}
                  className="group/link -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-cream"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-ink transition-colors group-hover/link:text-terracotta">
                    {i.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <ScoreBadge score={i.score_overall} size="sm" />
                    <span
                      className="text-ink-faint transition-transform group-hover/link:translate-x-0.5 group-hover/link:text-terracotta"
                      aria-hidden
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group mt-3 border-t border-line/70 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-terracotta transition-colors hover:text-terracotta-deep">
          Why it matters & founder angles
          <span
            className="text-xs transition-transform duration-150 group-open:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </summary>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink-soft">
          {trend.why_it_matters && (
            <div>
              <p className="eyebrow mb-1">Why it matters</p>
              <p>{trend.why_it_matters}</p>
            </div>
          )}
          {trend.opportunities && (
            <div>
              <p className="eyebrow mb-1">Founder angles</p>
              <p>{trend.opportunities}</p>
            </div>
          )}
          {sources.length > 0 && (
            <p className="text-xs text-ink-faint">
              Sources:{" "}
              {sources.map((u, i) => (
                <span key={u}>
                  {i > 0 && " · "}
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-terracotta"
                  >
                    {hostFromUrl(u)}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      </details>
    </article>
  );
}
