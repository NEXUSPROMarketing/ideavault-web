import type { FitIdea, Profile } from "@/lib/schemas";

/**
 * Founder-fit engine (deterministic, no AI at request time).
 *
 * Weights per the export plan:
 *   skills-token overlap        × 0.35
 *   budget vs startup_costs     × 0.20
 *   hours vs difficulty         × 0.20
 *   audience-adjusted GTM score × 0.25
 *
 * The `technical` tier is stored on the profile but intentionally not
 * scored yet — it feeds the Phase C build-pack/custom-idea features.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "been", "being", "but", "by",
  "can", "did", "do", "does", "etc", "for", "from", "get", "has", "have", "how",
  "i", "if", "in", "into", "is", "it", "its", "just", "me", "more", "most", "my",
  "new", "no", "not", "of", "on", "one", "or", "other", "our", "out", "per", "so",
  "some", "than", "that", "the", "their", "them", "then", "they", "this", "to",
  "too", "two", "up", "use", "used", "using", "very", "via", "was", "we", "were",
  "what", "when", "where", "who", "why", "will", "with", "you", "your",
]);

/** Lowercase, split, drop stopwords, light plural stemming, dedupe. */
export function tokenize(s: string | null | undefined): string[] {
  if (!s) return [];
  const out = new Set<string>();
  for (let t of s.toLowerCase().split(/[^a-z0-9+]+/)) {
    if (t.length < 2 || STOPWORDS.has(t)) continue;
    if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
    out.add(t);
  }
  return [...out];
}

export function ideaTokens(idea: FitIdea): Set<string> {
  return new Set(
    tokenize(
      [idea.title, idea.tagline ?? "", idea.category, idea.keyword ?? "", idea.signal_tags.join(" ")].join(" "),
    ),
  );
}

/** Parse cost strings like "$3K-$7K", "$500", "$10K+". Null → mid assumption. */
export function parseCostRange(s: string | null): { min: number; max: number } {
  if (!s || !s.trim()) return { min: 2000, max: 8000 };
  const nums: number[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*([km])?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    let n = parseFloat(m[1].replace(",", ""));
    const unit = m[2]?.toLowerCase();
    if (unit === "k") n *= 1_000;
    else if (unit === "m") n *= 1_000_000;
    if (Number.isFinite(n)) nums.push(n);
  }
  if (!nums.length) return { min: 2000, max: 8000 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

const BUDGET_CEIL: Record<Profile["budget"], number> = {
  "under-1k": 1_000,
  "1k-5k": 5_000,
  "5k-15k": 15_000,
  "15k-plus": 60_000,
};

/** 1 = fully within budget · 0.55 = stretch (covers the low end) · 0.15 = out of reach. */
export function budgetScore(budget: Profile["budget"], startupCosts: string | null): number {
  const ceil = BUDGET_CEIL[budget];
  const { min, max } = parseCostRange(startupCosts);
  if (ceil >= max) return 1;
  if (ceil >= min) return 0.55;
  return 0.15;
}

const HOURS_CAP: Record<Profile["hours"], number> = {
  "under-5": 1,
  "5-10": 2,
  "10-20": 3,
  "20-plus": 4,
};

function difficultyDemand(d: number | null): number {
  if (d == null) return 2;
  if (d <= 3) return 1;
  if (d <= 5) return 2;
  if (d <= 7) return 3;
  return 4;
}

/** 1 = capacity covers the build · 0.6 = one band short · 0.25 = big gap. */
export function hoursScore(hours: Profile["hours"], difficulty: number | null): number {
  const cap = HOURS_CAP[hours];
  const demand = difficultyDemand(difficulty);
  if (cap >= demand) return 1;
  if (cap === demand - 1) return 0.6;
  return 0.25;
}

const AUDIENCE_FACTOR: Record<Profile["audience"], number> = {
  none: 0.9,
  small: 1.0,
  established: 1.1,
};

export function gtmFitScore(audience: Profile["audience"], gtmScore: number | null): number {
  const base = (gtmScore ?? 5) / 10;
  return Math.max(0, Math.min(1, base * AUDIENCE_FACTOR[audience]));
}

export type FitResult = {
  score: number;
  reasons: string[];
  matched: string[];
};

export function computeFit(profile: Profile, idea: FitIdea): FitResult {
  const profileTokens = tokenize(`${profile.skills} ${profile.interests}`);
  const ideaSet = ideaTokens(idea);
  const matched = profileTokens.filter((t) => ideaSet.has(t)).sort();

  const s = Math.min(1, matched.length / 3);
  const b = budgetScore(profile.budget, idea.startup_costs);
  const h = hoursScore(profile.hours, idea.execution_difficulty);
  const g = gtmFitScore(profile.audience, idea.gtm_score);

  const score = Math.round(100 * (0.35 * s + 0.2 * b + 0.2 * h + 0.25 * g));

  const reasons: string[] = [];
  if (matched.length > 0) reasons.push(`Matches: ${matched.slice(0, 3).join(", ")}`);
  if (b === 1) reasons.push("Within your budget");
  else if (b === 0.55) reasons.push("Budget stretch");
  if (h === 1) reasons.push("Fits your weekly hours");
  if (g >= 0.8) reasons.push("Strong go-to-market fit");
  if (profile.audience === "established" && (idea.gtm_score ?? 0) >= 7)
    reasons.push("Leverages your audience");

  return { score, reasons: reasons.slice(0, 3), matched };
}

export type RankedIdea = { idea: FitIdea; fit: FitResult };

export function rankIdeas(profile: Profile, ideas: FitIdea[]): RankedIdea[] {
  return ideas
    .map((idea) => ({ idea, fit: computeFit(profile, idea) }))
    .sort(
      (a, b) =>
        b.fit.score - a.fit.score ||
        b.idea.score_overall - a.idea.score_overall ||
        a.idea.slug.localeCompare(b.idea.slug),
    );
}
