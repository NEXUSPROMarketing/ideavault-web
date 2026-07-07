import type { Metadata } from "next";
import Link from "next/link";
import {
  getIdeaCardsBySlugs,
  getIdeaOfTheDay,
  getIdeasByCategory,
  getLatestDrops,
  getTrendsForIdea,
} from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { IdeaReport } from "@/components/idea-report";
import { ScoreBadge } from "@/components/pills";
import { EmailCapture } from "./email-capture";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Today’s idea",
  description:
    "One fully-researched startup idea every day — problem, demand signals, GTM and a 12-metric score breakdown. Free.",
  alternates: { canonical: "/today" },
};

export default async function TodayPage() {
  const today = await getIdeaOfTheDay();

  if (!today) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">Idea of the day</p>
          <h1 className="mt-3 font-display text-2xl font-bold">The first drop is loading…</h1>
          <p className="mt-2 text-sm text-ink-soft">
            No drop has been published yet — check back tomorrow morning, or browse the database
            in the meantime.
          </p>
          <Link href="/ideas" className="btn-primary mt-6">
            Browse all ideas
          </Link>
        </div>
      </div>
    );
  }

  const { drop, idea } = today;
  const [relatedTrends, moreIdeas, allDrops] = await Promise.all([
    getTrendsForIdea(idea.slug),
    getIdeasByCategory(idea.category, idea.slug, 3),
    getLatestDrops(10),
  ]);

  const previousDrops = allDrops.filter((d) => d.dropped_on !== drop.dropped_on);
  const prevCards = await getIdeaCardsBySlugs(previousDrops.map((d) => d.idea_slug));
  const prevMap = new Map(prevCards.map((c) => [c.slug, c]));

  return (
    <div className="shell py-10">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Idea of the day</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {formatDate(drop.dropped_on)}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          One fully-researched idea a day — the complete report, free.
        </p>
      </header>

      <div className="mx-auto mt-8 max-w-xl">
        <EmailCapture />
      </div>

      <div className="mt-10">
        <IdeaReport idea={idea} relatedTrends={relatedTrends} moreIdeas={moreIdeas} />
      </div>

      {previousDrops.length > 0 && (
        <section className="mt-12" aria-labelledby="prev-drops-heading">
          <h2 id="prev-drops-heading" className="font-display text-2xl font-bold">
            Previous drops
          </h2>
          <ul className="card mt-4 divide-y divide-line/70">
            {previousDrops.map((d) => {
              const card = prevMap.get(d.idea_slug);
              if (!card) return null;
              return (
                <li key={d.dropped_on}>
                  <Link
                    href={`/ideas/${card.slug}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream/60"
                  >
                    <span className="w-24 shrink-0 text-xs text-ink-faint">
                      {formatDate(d.dropped_on)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-base font-semibold transition-colors group-hover:text-terracotta">
                      {card.title}
                    </span>
                    <ScoreBadge score={card.score_overall} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
