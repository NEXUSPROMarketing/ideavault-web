import Link from "next/link";
import {
  getAllIdeaCards,
  getAllInsights,
  getAllTrends,
  getIdeaOfTheDay,
} from "@/lib/queries";
import { formatDate, parseGrowth, sortTrends, sparklineClass } from "@/lib/format";
import { DeepDiveFlag, LiveBadge, ScoreBadge, StatusPill, TagChip } from "@/components/pills";
import { ScoreRing } from "@/components/score-ring";
import { QuadrantGrid } from "@/components/quadrant";
import { Sparkline } from "@/components/sparkline";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const [ideas, trends, insights, today] = await Promise.all([
    getAllIdeaCards(),
    getAllTrends(),
    getAllInsights(),
    getIdeaOfTheDay(),
  ]);

  const flagshipCount = ideas.filter((i) => i.is_flagship).length;
  const topIdeas = ideas.slice(0, 6);
  const hotTrends = sortTrends(trends).slice(0, 4);

  const categories = new Map<string, { count: number; totalScore: number }>();
  for (const i of ideas) {
    const c = categories.get(i.category) ?? { count: 0, totalScore: 0 };
    c.count += 1;
    c.totalScore += i.score_overall;
    categories.set(i.category, c);
  }
  const categoryList = [...categories.entries()]
    .map(([name, { count, totalScore }]) => ({
      name,
      count,
      avg: Math.round(totalScore / Math.max(count, 1)),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const stats = [
    { value: ideas.length, label: "Researched ideas" },
    { value: trends.length, label: "Tracked trends" },
    { value: insights.length, label: "Market insights" },
    { value: flagshipCount, label: "Flagship deep dives" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---- hero ---- */}
      <section className="border-b border-line bg-white">
        <div className="shell py-14 sm:py-20">
          <p className="eyebrow">Startup idea intelligence · updated daily</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            From <span className="italic text-ink-soft">“I want to build something”</span> to{" "}
            <span className="italic text-terracotta">“I know exactly what to build.”</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {ideas.length} researched startup ideas scored on demand signals, {trends.length} live
            trends and {insights.length} market insights — sourced, labeled and refreshed every
            day.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ideas" className="btn-primary">
              Browse the database
            </Link>
            <Link href="/today" className="btn-secondary">
              Today’s drop →
            </Link>
          </div>
        </div>

        {/* ---- stats strip ---- */}
        <div className="border-t border-line bg-cream/60">
          <dl className="shell grid grid-cols-2 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-5 ${i > 0 ? "sm:border-l sm:border-line sm:pl-6" : ""} ${i % 2 === 1 ? "border-l border-line pl-6 sm:border-l" : ""}`}
              >
                <dd className="font-display text-3xl font-bold">{s.value}</dd>
                <dt className="mt-0.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- idea of the day ---- */}
      {today && (
        <section className="shell pt-12" aria-labelledby="iotd-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="iotd-heading" className="font-display text-2xl font-bold">
              Idea of the day
            </h2>
            <span className="text-sm text-ink-faint">{formatDate(today.drop.dropped_on)}</span>
          </div>
          <div className="card mt-4 p-6 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow">{today.idea.category}</span>
                  {today.idea.is_flagship && <DeepDiveFlag />}
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                  <Link
                    href={`/ideas/${today.idea.slug}`}
                    className="transition-colors hover:text-terracotta"
                  >
                    {today.idea.title}
                  </Link>
                </h3>
                {today.idea.tagline && (
                  <p className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">
                    {today.idea.tagline}
                  </p>
                )}
                {today.idea.signal_tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {today.idea.signal_tags.map((t) => (
                      <TagChip key={t}>{t}</TagChip>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/ideas/${today.idea.slug}`} className="btn-primary">
                    Read the full report
                  </Link>
                  <Link href="/today" className="btn-secondary">
                    Get this daily →
                  </Link>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6 lg:flex-col lg:items-end">
                <ScoreRing score={today.idea.score_overall} size={124} />
                <div className="w-48">
                  <QuadrantGrid idea={today.idea} compact />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---- top scored ---- */}
      <section className="shell pt-12" aria-labelledby="top-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="top-heading" className="font-display text-2xl font-bold">
            Top scored
          </h2>
          <Link href="/ideas" className="text-sm font-semibold text-terracotta hover:underline">
            All {ideas.length} ideas →
          </Link>
        </div>
        <ol className="card mt-4 divide-y divide-line/70">
          {topIdeas.map((idea, i) => (
            <li key={idea.slug}>
              <Link
                href={`/ideas/${idea.slug}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream/60"
              >
                <span className="w-8 shrink-0 font-display text-lg font-bold text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold transition-colors group-hover:text-terracotta sm:text-lg">
                    {idea.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {idea.category}
                    {idea.revenue_tier && (
                      <>
                        {" · "}
                        <span className="font-bold text-moss">{idea.revenue_tier}</span>
                      </>
                    )}
                  </span>
                </span>
                {idea.is_flagship && (
                  <span className="hidden sm:block">
                    <DeepDiveFlag />
                  </span>
                )}
                <ScoreBadge score={idea.score_overall} />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- categories ---- */}
      <section className="shell pt-12" aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="font-display text-2xl font-bold">
          Browse by category
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categoryList.map((c) => (
            <Link
              key={c.name}
              href={`/ideas?category=${encodeURIComponent(c.name)}`}
              className="card group p-4 transition duration-150 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="font-display text-[15px] font-semibold leading-snug transition-colors group-hover:text-terracotta">
                {c.name}
              </p>
              <p className="mt-1.5 text-xs text-ink-faint">
                {c.count} ideas · avg {c.avg}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- hottest trends ---- */}
      <section className="shell pt-12" aria-labelledby="hot-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="hot-heading" className="font-display text-2xl font-bold">
            Hottest trends
          </h2>
          <Link href="/trends" className="text-sm font-semibold text-terracotta hover:underline">
            All {trends.length} trends →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hotTrends.map((t) => {
            const g = parseGrowth(t.growth);
            return (
              <Link
                key={t.slug}
                href="/trends"
                className="card group flex flex-col p-4 transition duration-150 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <StatusPill status={t.status} />
                <p className="mt-2.5 font-display text-base font-semibold leading-snug transition-colors group-hover:text-terracotta">
                  {t.name}
                </p>
                {g?.pct && (
                  <p className="mt-2 font-display text-xl font-bold text-moss">
                    {g.pct}
                    {g.live && (
                      <>
                        {" "}
                        <LiveBadge />
                      </>
                    )}
                  </p>
                )}
                <div className={`mt-auto pt-2 ${sparklineClass(t.status)}`}>
                  <Sparkline series={t.volume_series} className="h-9 w-full" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- daily drop CTA ---- */}
      <section className="shell pt-14">
        <div className="card flex flex-col items-start gap-5 border-ink bg-ink p-8 text-cream sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold leading-snug">
              One researched idea in your inbox, every morning.
            </p>
            <p className="mt-1 text-sm text-cream/70">
              The full report — problem, demand signals, GTM and scores. Free.
            </p>
          </div>
          <Link
            href="/today"
            className="btn-primary shrink-0"
          >
            Get the daily drop
          </Link>
        </div>
      </section>
    </>
  );
}
