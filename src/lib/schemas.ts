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
