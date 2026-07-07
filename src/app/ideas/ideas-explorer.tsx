"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { IdeaCard as IdeaCardData } from "@/lib/schemas";
import { IdeaCard } from "@/components/idea-card";

type SortKey = "score" | "newest" | "easiest";
type DiffBand = "any" | "easy" | "moderate" | "hard";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Top score" },
  { value: "newest", label: "Newest" },
  { value: "easiest", label: "Easiest to build" },
];

const MIN_SCORE_OPTIONS = [0, 50, 60, 70, 80];

const DIFF_OPTIONS: { value: DiffBand; label: string }[] = [
  { value: "any", label: "Any difficulty" },
  { value: "easy", label: "Easy (1–3)" },
  { value: "moderate", label: "Moderate (4–6)" },
  { value: "hard", label: "Hard (7–10)" },
];

function inDiffBand(d: number | null, band: DiffBand): boolean {
  if (band === "any") return true;
  if (d == null) return false;
  if (band === "easy") return d <= 3;
  if (band === "moderate") return d >= 4 && d <= 6;
  return d >= 7;
}

export function IdeasExplorer({
  ideas,
  categories,
}: {
  ideas: IdeaCardData[];
  categories: string[];
}) {
  const searchParams = useSearchParams();

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState(() => {
    const c = searchParams.get("category");
    return c && categories.includes(c) ? c : "all";
  });
  const [minScore, setMinScore] = useState(() => {
    const m = Number(searchParams.get("min"));
    return MIN_SCORE_OPTIONS.includes(m) ? m : 0;
  });
  const [diff, setDiff] = useState<DiffBand>(() => {
    const d = searchParams.get("difficulty");
    return d === "easy" || d === "moderate" || d === "hard" ? d : "any";
  });
  const [sort, setSort] = useState<SortKey>(() => {
    const s = searchParams.get("sort");
    return s === "newest" || s === "easiest" ? s : "score";
  });

  // Keep the URL shareable without triggering server round-trips.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (category !== "all") p.set("category", category);
    if (minScore) p.set("min", String(minScore));
    if (diff !== "any") p.set("difficulty", diff);
    if (sort !== "score") p.set("sort", sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/ideas?${qs}` : "/ideas");
  }, [q, category, minScore, diff, sort]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = ideas.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (minScore && i.score_overall < minScore) return false;
      if (!inDiffBand(i.execution_difficulty, diff)) return false;
      if (needle) {
        const hay = [i.title, i.tagline ?? "", i.category, i.keyword ?? "", ...i.signal_tags]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      if (sort === "newest") {
        return (b.released ?? "").localeCompare(a.released ?? "") || b.score_overall - a.score_overall;
      }
      if (sort === "easiest") {
        return (
          (a.execution_difficulty ?? 99) - (b.execution_difficulty ?? 99) ||
          b.score_overall - a.score_overall
        );
      }
      return b.score_overall - a.score_overall;
    });
    return out;
  }, [ideas, q, category, minScore, diff, sort]);

  const hasFilters = q.trim() !== "" || category !== "all" || minScore !== 0 || diff !== "any";

  function reset() {
    setQ("");
    setCategory("all");
    setMinScore(0);
    setDiff("any");
  }

  return (
    <div>
      {/* ---- toolbar ---- */}
      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_170px_170px]">
          <div>
            <label htmlFor="idea-search" className="field-label">
              Search
            </label>
            <input
              id="idea-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles, keywords, tags…"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="idea-category" className="field-label">
              Category
            </label>
            <select
              id="idea-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="idea-min" className="field-label">
              Min score
            </label>
            <select
              id="idea-min"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="input"
            >
              {MIN_SCORE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "Any score" : `${m}+`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="idea-diff" className="field-label">
              Difficulty
            </label>
            <select
              id="idea-diff"
              value={diff}
              onChange={(e) => setDiff(e.target.value as DiffBand)}
              className="input"
            >
              {DIFF_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="idea-sort" className="field-label">
              Sort
            </label>
            <select
              id="idea-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <p className="text-ink-faint" aria-live="polite">
            Showing <span className="font-semibold text-ink">{filtered.length}</span> of{" "}
            {ideas.length} ideas
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="font-semibold text-terracotta underline underline-offset-2 hover:text-terracotta-deep"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ---- results ---- */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="card mt-6 p-12 text-center">
          <p className="font-display text-xl font-semibold">Nothing matches those filters.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Try widening the score range or clearing the search.
          </p>
          <button type="button" onClick={reset} className="btn-primary mt-5">
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
