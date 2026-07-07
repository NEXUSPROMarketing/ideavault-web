import { z } from "zod";

/** ---- shared field helpers -------------------------------------------- */

const strArray = z
  .array(z.string())
  .nullish()
  .transform((v) => v ?? []);

const nullableString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim().length > 0 ? v : null));

const nullableNumber = z
  .number()
  .nullish()
  .transform((v) => v ?? null);

const boolWithDefault = z
  .boolean()
  .nullish()
  .transform((v) => v ?? false);

/** ---- ideas ------------------------------------------------------------ */

export const MetricEntrySchema = z.object({
  s: z.number().catch(0),
  n: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

export const ScoresSchema = z
  .record(MetricEntrySchema)
  .nullish()
  .transform((v) => v ?? {});

export type Scores = z.infer<typeof ScoresSchema>;

export const IdeaCardSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  tagline: nullableString,
  category: z.string().min(1),
  signal_tags: strArray,
  keyword: nullableString,
  score_overall: z.number().catch(0),
  score_opportunity: z.number().catch(0),
  score_problem: z.number().catch(0),
  score_feasibility: z.number().catch(0),
  score_why_now: z.number().catch(0),
  revenue_tier: nullableString,
  execution_difficulty: nullableNumber,
  gtm_score: nullableNumber,
  is_flagship: boolWithDefault,
  released: nullableString,
});

export type IdeaCard = z.infer<typeof IdeaCardSchema>;

export const IdeaSchema = IdeaCardSchema.extend({
  problem: nullableString,
  solution: nullableString,
  target_customer: nullableString,
  business_model: nullableString,
  market_size: nullableString,
  competition: nullableString,
  why_now: nullableString,
  demand_signals: nullableString,
  keyword_volume: nullableNumber,
  keyword_growth: nullableString,
  gtm: nullableString,
  mvp_scope: nullableString,
  revenue_potential: nullableString,
  time_to_mvp: nullableString,
  startup_costs: nullableString,
  scores: ScoresSchema,
  deep_dive: nullableString,
  sources: nullableString,
  signals_updated: nullableString,
  dropped_on: nullableString,
});

export type Idea = z.infer<typeof IdeaSchema>;

export const SlugRowSchema = z.object({
  slug: z.string().min(1),
  released: nullableString,
  signals_updated: nullableString,
});

export type SlugRow = z.infer<typeof SlugRowSchema>;

/** ---- trends ------------------------------------------------------------ */

export const TrendSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: nullableString,
  status: z
    .string()
    .nullish()
    .transform((v) => v ?? "Steady"),
  description: nullableString,
  volume: nullableNumber,
  growth: nullableString,
  volume_series: z
    .array(z.number())
    .nullish()
    .transform((v) => v ?? []),
  why_it_matters: nullableString,
  opportunities: nullableString,
  related_ideas: strArray,
  sources: nullableString,
  signals_updated: nullableString,
});

export type Trend = z.infer<typeof TrendSchema>;

/** ---- insights ----------------------------------------------------------- */

export const InsightSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: nullableString,
  insight_type: z
    .string()
    .nullish()
    .transform((v) => v ?? "Stat"),
  summary: nullableString,
  detail: nullableString,
  pain_level: nullableString,
  gap_level: nullableString,
  revenue_level: nullableString,
  founder_implication: nullableString,
  related_ideas: strArray,
  sources: nullableString,
});

export type Insight = z.infer<typeof InsightSchema>;

/** ---- drops -------------------------------------------------------------- */

export const DropSchema = z.object({
  idea_slug: z.string().min(1),
  dropped_on: z.string().min(1),
});

export type Drop = z.infer<typeof DropSchema>;

/** ---- forms -------------------------------------------------------------- */

export const EmailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .email("That doesn’t look like an email address");

/** ---- founder profile (Phase B) ------------------------------------------ */

export const BudgetEnum = z.enum(["under-1k", "1k-5k", "5k-15k", "15k-plus"]);
export const HoursEnum = z.enum(["under-5", "5-10", "10-20", "20-plus"]);
export const TechEnum = z.enum(["non-technical", "low-code", "technical"]);
export const AudienceEnum = z.enum(["none", "small", "established"]);

export const BUDGET_TIERS: { value: z.infer<typeof BudgetEnum>; label: string }[] = [
  { value: "under-1k", label: "Under $1K" },
  { value: "1k-5k", label: "$1K – $5K" },
  { value: "5k-15k", label: "$5K – $15K" },
  { value: "15k-plus", label: "$15K+" },
];
export const HOURS_TIERS: { value: z.infer<typeof HoursEnum>; label: string }[] = [
  { value: "under-5", label: "Under 5 hrs/week" },
  { value: "5-10", label: "5–10 hrs/week" },
  { value: "10-20", label: "10–20 hrs/week" },
  { value: "20-plus", label: "20+ hrs/week" },
];
export const TECH_TIERS: { value: z.infer<typeof TechEnum>; label: string }[] = [
  { value: "non-technical", label: "Non-technical" },
  { value: "low-code", label: "Low-code / AI-assisted" },
  { value: "technical", label: "Technical — I can code" },
];
export const AUDIENCE_TIERS: { value: z.infer<typeof AudienceEnum>; label: string }[] = [
  { value: "none", label: "No audience yet" },
  { value: "small", label: "Small niche audience" },
  { value: "established", label: "Established audience" },
];

/** Tolerant parser for profile rows (nulls → sensible defaults). */
export const ProfileSchema = z.object({
  skills: z.string().trim().max(600).catch(""),
  interests: z.string().trim().max(600).catch(""),
  budget: BudgetEnum.catch("1k-5k"),
  hours: HoursEnum.catch("5-10"),
  technical: TechEnum.catch("low-code"),
  audience: AudienceEnum.catch("none"),
  goal: z.string().trim().max(300).catch(""),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function hasProfileContent(p: Profile): boolean {
  return p.skills.trim().length > 0 || p.interests.trim().length > 0;
}

/** Idea columns needed by the fit engine (card fields + startup costs). */
export const FitIdeaSchema = IdeaCardSchema.extend({
  startup_costs: nullableString,
});

export type FitIdea = z.infer<typeof FitIdeaSchema>;

/** ---- idea status (Phase B) ------------------------------------------------ */

export const StatusEnum = z.enum(["saved", "interested", "building", "passed"]);
export type IdeaStatus = z.infer<typeof StatusEnum>;

export const StatusRowSchema = z.object({
  idea_slug: z.string().min(1),
  status: StatusEnum,
});

export type StatusRow = z.infer<typeof StatusRowSchema>;

/** ---- helpers -------------------------------------------------------------- */

/** Parse an array of unknown rows, silently dropping any that fail validation. */
export function parseRows<S extends z.ZodTypeAny>(
  schema: S,
  rows: unknown,
): z.infer<S>[] {
  if (!Array.isArray(rows)) return [];
  const out: z.infer<S>[] = [];
  for (const row of rows) {
    const parsed = schema.safeParse(row);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
