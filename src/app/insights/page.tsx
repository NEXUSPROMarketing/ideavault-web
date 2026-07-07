import type { Metadata } from "next";
import Link from "next/link";
import { getAllIdeaCards, getAllInsights } from "@/lib/queries";
import { hostFromUrl, splitSources } from "@/lib/format";
import { LevelBadge, ScoreBadge, TypeChip } from "@/components/pills";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Market insights",
  description:
    "Stats, shifts, behaviors and gaps from the research engine — each with pain, gap and revenue levels plus the founder implication.",
  alternates: { canonical: "/insights" },
};

export default async function InsightsPage() {
  const [insights, ideas] = await Promise.all([getAllInsights(), getAllIdeaCards()]);
  const ideaMap = new Map(ideas.map((i) => [i.slug, i]));

  const typeCounts = new Map<string, number>();
  for (const i of insights) typeCounts.set(i.insight_type, (typeCounts.get(i.insight_type) ?? 0) + 1);
  const countLine = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${n} ${t.toLowerCase()}s`)
    .join(" · ");

  return (
    <div className="shell py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Market insights</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {insights.length} signals worth building on
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {countLine}. Each insight is rated for founder pain, market gap and revenue potential —
          and ends with what it means for what you build.
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {insights.map((insight) => {
          const related = insight.related_ideas
            .map((slug) => ideaMap.get(slug))
            .filter((i): i is NonNullable<typeof i> => Boolean(i))
            .slice(0, 3);
          const sources = splitSources(insight.sources);
          return (
            <article key={insight.slug} className="card flex flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <TypeChip type={insight.insight_type} />
                <LevelBadge label="Pain" level={insight.pain_level} />
                <LevelBadge label="Gap" level={insight.gap_level} />
                <LevelBadge label="Revenue" level={insight.revenue_level} positiveGood />
              </div>

              <h2 className="mt-3 font-display text-xl font-semibold leading-snug">
                {insight.title}
              </h2>
              {insight.category && (
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {insight.category}
                </p>
              )}
              {insight.summary && (
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{insight.summary}</p>
              )}

              <details className="group mt-4 border-t border-line pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-terracotta transition-colors hover:text-terracotta-deep">
                  Full insight & founder implication
                  <span
                    className="text-xs transition-transform duration-150 group-open:rotate-180"
                    aria-hidden
                  >
                    ▾
                  </span>
                </summary>
                <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink-soft">
                  {insight.detail && <p>{insight.detail}</p>}
                  {insight.founder_implication && (
                    <div className="rounded-xl border border-moss/25 bg-moss-tint p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-moss">
                        For founders
                      </p>
                      <p className="mt-1 text-ink">{insight.founder_implication}</p>
                    </div>
                  )}
                  {related.length > 0 && (
                    <div>
                      <p className="eyebrow mb-1">Related ideas</p>
                      <ul className="divide-y divide-line/70">
                        {related.map((i) => (
                          <li key={i.slug}>
                            <Link
                              href={`/ideas/${i.slug}`}
                              className="group/link flex items-center justify-between gap-3 py-2"
                            >
                              <span className="min-w-0 font-medium text-ink transition-colors group-hover/link:text-terracotta">
                                {i.title}
                              </span>
                              <ScoreBadge score={i.score_overall} size="sm" />
                            </Link>
                          </li>
                        ))}
                      </ul>
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
        })}
      </div>
    </div>
  );
}
