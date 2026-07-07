import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllIdeaCards } from "@/lib/queries";
import { IdeasExplorer } from "./ideas-explorer";
import { CardGridSkeleton } from "@/components/skeleton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Idea database",
  description:
    "Search and filter the full database of researched startup ideas — scored on opportunity, problem, feasibility and timing.",
  alternates: { canonical: "/ideas" },
};

export default async function IdeasPage() {
  const ideas = await getAllIdeaCards();
  const categories = [...new Set(ideas.map((i) => i.category))].sort();

  return (
    <div className="shell py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Idea database</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {ideas.length} researched ideas, ready to filter
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Every idea is scored on twelve demand and feasibility metrics. Filter by category,
          score or build difficulty — flagship ideas include a full deep-dive report.
        </p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<CardGridSkeleton count={6} />}>
          <IdeasExplorer ideas={ideas} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
