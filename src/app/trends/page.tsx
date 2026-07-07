import type { Metadata } from "next";
import { getAllIdeaCards, getAllTrends } from "@/lib/queries";
import { sortTrends } from "@/lib/format";
import { TrendCard } from "@/components/trend-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Trends",
  description:
    "The market trends behind the ideas — status, search volume, growth trajectories and the founder angles they open up.",
  alternates: { canonical: "/trends" },
};

export default async function TrendsPage() {
  const [trends, ideas] = await Promise.all([getAllTrends(), getAllIdeaCards()]);
  const ideaMap = new Map(ideas.map((i) => [i.slug, i]));
  const sorted = sortTrends(trends);

  const statusCounts = new Map<string, number>();
  for (const t of sorted) statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
  const countLine = ["Breakout", "Rising", "Steady"]
    .filter((s) => statusCounts.has(s))
    .map((s) => `${statusCounts.get(s)} ${s.toLowerCase()}`)
    .join(" · ");

  return (
    <div className="shell py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Trend tracker</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {trends.length} trends moving the market
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {countLine}. Volume trajectories come from search indexes — live measurements carry a
          green badge, everything else is an estimate.
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {sorted.map((t) => (
          <TrendCard
            key={t.slug}
            trend={t}
            linkedIdeas={t.related_ideas
              .map((slug) => ideaMap.get(slug))
              .filter((i): i is NonNullable<typeof i> => Boolean(i))
              .slice(0, 3)}
          />
        ))}
      </div>
    </div>
  );
}
