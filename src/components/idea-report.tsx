import Link from "next/link";
import type { Idea, IdeaCard, Trend } from "@/lib/schemas";
import {
  difficultyBand,
  formatDate,
  formatVolume,
  hostFromUrl,
  parseGrowth,
  sparklineClass,
  splitDeepDive,
  splitSources,
} from "@/lib/format";
import { DeepDiveFlag, LiveBadge, ScoreBadge, StatusPill, TagChip } from "@/components/pills";
import { ScoreRing } from "@/components/score-ring";
import { QuadrantGrid } from "@/components/quadrant";
import { MetricBars } from "@/components/metric-bars";
import { Markdown } from "@/components/markdown";
import { SectionCard } from "@/components/section-card";
import { Sparkline } from "@/components/sparkline";

function FitTile({
  label,
  value,
  hint,
  valueClassName = "",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream/60 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-lg font-semibold leading-tight ${valueClassName}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  live = false,
  valueClassName = "",
}: {
  label: string;
  value: string;
  hint?: string;
  live?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream/60 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={`mt-1 text-[15px] font-semibold leading-snug text-ink ${valueClassName}`}>
        {value}
        {live && (
          <>
            {" "}
            <LiveBadge />
          </>
        )}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

/**
 * The full idea research report — shared by /ideas/[slug] and /today.
 */
export function IdeaReport({
  idea,
  relatedTrends = [],
  moreIdeas = [],
}: {
  idea: Idea;
  relatedTrends?: Trend[];
  moreIdeas?: IdeaCard[];
}) {
  const { body: deepDiveBody, verdict } = splitDeepDive(idea.deep_dive);
  const growth = parseGrowth(idea.keyword_growth);
  const sources = splitSources(idea.sources);
  const released = formatDate(idea.released);
  const signalsUpdated = formatDate(idea.signals_updated);

  const narrative: { title: string; text: string | null }[] = [
    { title: "Problem", text: idea.problem },
    { title: "Solution", text: idea.solution },
    { title: "Target customer", text: idea.target_customer },
    { title: "Why now", text: idea.why_now },
  ];
  const commercial: { title: string; text: string | null }[] = [
    { title: "Market size", text: idea.market_size },
    { title: "Competition", text: idea.competition },
    { title: "Business model", text: idea.business_model },
    { title: "Go-to-market", text: idea.gtm },
    { title: "MVP scope", text: idea.mvp_scope },
    { title: "Revenue potential", text: idea.revenue_potential },
  ];

  return (
    <article>
      {/* ---- header ---- */}
      <header className="card p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/ideas?category=${encodeURIComponent(idea.category)}`}
                className="eyebrow hover:underline"
              >
                {idea.category}
              </Link>
              {idea.is_flagship && <DeepDiveFlag />}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {idea.title}
            </h1>
            {idea.tagline && (
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">{idea.tagline}</p>
            )}
            {idea.signal_tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {idea.signal_tags.map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-ink-faint">
              {released && <>Released {released}</>}
              {released && signalsUpdated && <span aria-hidden> · </span>}
              {signalsUpdated && <>Signals updated {signalsUpdated}</>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 lg:flex-col lg:items-end">
            <ScoreRing score={idea.score_overall} />
            <div className="w-48">
              <QuadrantGrid idea={idea} compact />
            </div>
          </div>
        </div>

        {/* ---- fit tiles ---- */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <FitTile
            label="Revenue potential"
            value={idea.revenue_tier ?? "—"}
            valueClassName="tracking-widest text-moss"
          />
          <FitTile
            label="Difficulty"
            value={idea.execution_difficulty != null ? `${idea.execution_difficulty}/10` : "—"}
            hint={`${difficultyBand(idea.execution_difficulty)} build`}
          />
          <FitTile
            label="GTM score"
            value={idea.gtm_score != null ? `${idea.gtm_score}/10` : "—"}
          />
          <FitTile label="Time to MVP" value={idea.time_to_mvp ?? "—"} />
          <FitTile label="Startup costs" value={idea.startup_costs ?? "—"} />
        </div>

        {/* ---- verdict (flagships) ---- */}
        {verdict && (
          <div className="mt-6 rounded-card border border-moss/25 bg-moss-tint p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-moss">
              The verdict
            </p>
            <div className="mt-1">
              <Markdown>{verdict}</Markdown>
            </div>
          </div>
        )}
      </header>

      {/* ---- body ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {narrative.map(
            ({ title, text }) =>
              text && (
                <SectionCard key={title} title={title}>
                  <p className="whitespace-pre-line">{text}</p>
                </SectionCard>
              ),
          )}

          {/* Demand signals */}
          <SectionCard title="Demand signals" id="demand">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Top keyword" value={idea.keyword ? `“${idea.keyword}”` : "—"} />
              <Stat
                label="Search volume"
                value={
                  idea.keyword_volume != null
                    ? `${formatVolume(idea.keyword_volume, false)}/mo`
                    : "—"
                }
                hint="(est.)"
              />
              <Stat
                label="12-mo growth"
                value={growth?.pct ?? growth?.raw ?? "—"}
                live={growth?.live ?? false}
                hint={growth?.note ? `(${growth.note})` : undefined}
                valueClassName={growth ? (growth.positive ? "!text-moss" : "!text-red-700") : ""}
              />
            </div>
            {idea.demand_signals && <p className="mt-4 whitespace-pre-line">{idea.demand_signals}</p>}
          </SectionCard>

          {commercial.map(
            ({ title, text }) =>
              text && (
                <SectionCard key={title} title={title}>
                  <p className="whitespace-pre-line">{text}</p>
                </SectionCard>
              ),
          )}

          {/* 12-metric breakdown */}
          <SectionCard title="Score breakdown" id="scores">
            <p className="text-[13px] text-ink-faint">
              Twelve metrics, each scored 0–10 by the research engine. Live measurements are
              badged; everything else is an AI estimate.
            </p>
            <div className="mt-5">
              <MetricBars scores={idea.scores} />
            </div>
          </SectionCard>

          {/* Deep dive (flagships) */}
          {idea.is_flagship && deepDiveBody && (
            <section id="deep-dive" aria-labelledby="deep-dive-heading" className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-ink px-6 py-4">
                <h2 id="deep-dive-heading" className="font-display text-lg font-semibold text-cream">
                  Deep dive
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cream/70">
                  Flagship report
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <Markdown>{deepDiveBody}</Markdown>
              </div>
            </section>
          )}
        </div>

        {/* ---- sidebar ---- */}
        <aside className="space-y-5">
          {relatedTrends.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold">Related trends</h2>
              <ul className="mt-3 space-y-5">
                {relatedTrends.map((t) => {
                  const g = parseGrowth(t.growth);
                  return (
                    <li key={t.slug}>
                      <Link href="/trends" className="group block">
                        <div className="flex items-center justify-between gap-2">
                          <StatusPill status={t.status} />
                          {g?.pct && (
                            <span className="text-xs font-bold text-moss">
                              {g.pct}
                              {g.live && (
                                <>
                                  {" "}
                                  <LiveBadge />
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-semibold leading-snug transition-colors group-hover:text-terracotta">
                          {t.name}
                        </p>
                        {t.volume_series.length > 0 && (
                          <div className={`mt-1.5 ${sparklineClass(t.status)}`}>
                            <Sparkline series={t.volume_series} className="h-8 w-full" />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {moreIdeas.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold">More in {idea.category}</h2>
              <ul className="mt-3 divide-y divide-line/70">
                {moreIdeas.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/ideas/${m.slug}`}
                      className="group flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="min-w-0 text-sm font-medium leading-snug transition-colors group-hover:text-terracotta">
                        {m.title}
                      </span>
                      <ScoreBadge score={m.score_overall} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sources.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold">Sources</h2>
              <ul className="mt-3 space-y-2">
                {sources.map((u) => (
                  <li key={u}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-terracotta underline underline-offset-2 hover:text-terracotta-deep"
                    >
                      {hostFromUrl(u)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card border-ink bg-ink p-5 text-cream">
            <p className="font-display text-lg font-semibold leading-snug">
              One researched idea in your inbox, every morning.
            </p>
            <Link
              href="/today"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-terracotta-tint underline underline-offset-4 hover:text-white"
            >
              Get the daily drop →
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
