import { supabase } from "@/lib/supabase";
import {
  DropSchema,
  FitIdeaSchema,
  IdeaCardSchema,
  IdeaSchema,
  InsightSchema,
  SlugRowSchema,
  TrendSchema,
  parseRows,
  type Drop,
  type FitIdea,
  type Idea,
  type IdeaCard,
  type Insight,
  type SlugRow,
  type Trend,
} from "@/lib/schemas";

const IDEA_CARD_COLUMNS =
  "slug,title,tagline,category,signal_tags,keyword,score_overall,score_opportunity,score_problem,score_feasibility,score_why_now,revenue_tier,execution_difficulty,gtm_score,is_flagship,released";

function fail(scope: string, message: string): never {
  throw new Error(`[supabase:${scope}] ${message}`);
}

/** ---- ideas ------------------------------------------------------------ */

export async function getAllIdeaCards(): Promise<IdeaCard[]> {
  const { data, error } = await supabase
    .from("ideas")
    .select(IDEA_CARD_COLUMNS)
    .order("score_overall", { ascending: false })
    .order("slug", { ascending: true });
  if (error) fail("ideas", error.message);
  return parseRows(IdeaCardSchema, data);
}

export async function getIdeaBySlug(slug: string): Promise<Idea | null> {
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail(`idea:${slug}`, error.message);
  if (!data) return null;
  const parsed = IdeaSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function getAllIdeaSlugs(): Promise<SlugRow[]> {
  const { data, error } = await supabase
    .from("ideas")
    .select("slug,released,signals_updated")
    .order("slug", { ascending: true });
  if (error) fail("idea-slugs", error.message);
  return parseRows(SlugRowSchema, data);
}

export async function getIdeasByCategory(
  category: string,
  excludeSlug?: string,
  limit = 3,
): Promise<IdeaCard[]> {
  let query = supabase
    .from("ideas")
    .select(IDEA_CARD_COLUMNS)
    .eq("category", category)
    .order("score_overall", { ascending: false })
    .limit(limit + 1);
  if (excludeSlug) query = query.neq("slug", excludeSlug);
  const { data, error } = await query;
  if (error) fail(`ideas:${category}`, error.message);
  return parseRows(IdeaCardSchema, data).slice(0, limit);
}

export async function getFitIdeas(): Promise<FitIdea[]> {
  const { data, error } = await supabase
    .from("ideas")
    .select(`${IDEA_CARD_COLUMNS},startup_costs`)
    .order("score_overall", { ascending: false })
    .order("slug", { ascending: true });
  if (error) fail("fit-ideas", error.message);
  return parseRows(FitIdeaSchema, data);
}

export async function getIdeaCardsBySlugs(slugs: string[]): Promise<IdeaCard[]> {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from("ideas")
    .select(IDEA_CARD_COLUMNS)
    .in("slug", slugs);
  if (error) fail("ideas-by-slugs", error.message);
  return parseRows(IdeaCardSchema, data);
}

/** ---- drops ------------------------------------------------------------ */

export async function getLatestDrops(limit = 8): Promise<Drop[]> {
  const { data, error } = await supabase
    .from("drops")
    .select("idea_slug,dropped_on")
    .order("dropped_on", { ascending: false })
    .limit(limit);
  if (error) fail("drops", error.message);
  return parseRows(DropSchema, data);
}

export async function getIdeaOfTheDay(): Promise<{ drop: Drop; idea: Idea } | null> {
  const drops = await getLatestDrops(1);
  const drop = drops[0];
  if (!drop) return null;
  const idea = await getIdeaBySlug(drop.idea_slug);
  return idea ? { drop, idea } : null;
}

/** ---- trends ------------------------------------------------------------ */

export async function getAllTrends(): Promise<Trend[]> {
  const { data, error } = await supabase
    .from("trends")
    .select(
      "slug,name,category,status,description,volume,growth,volume_series,why_it_matters,opportunities,related_ideas,sources,signals_updated",
    )
    .order("volume", { ascending: false });
  if (error) fail("trends", error.message);
  return parseRows(TrendSchema, data);
}

export async function getTrendsForIdea(slug: string, limit = 4): Promise<Trend[]> {
  const { data, error } = await supabase
    .from("trends")
    .select(
      "slug,name,category,status,description,volume,growth,volume_series,why_it_matters,opportunities,related_ideas,sources,signals_updated",
    )
    .contains("related_ideas", [slug])
    .limit(limit);
  if (error) fail(`trends-for:${slug}`, error.message);
  return parseRows(TrendSchema, data);
}

/** ---- insights ------------------------------------------------------------ */

export async function getAllInsights(): Promise<Insight[]> {
  const { data, error } = await supabase
    .from("insights")
    .select(
      "slug,title,category,insight_type,summary,detail,pain_level,gap_level,revenue_level,founder_implication,related_ideas,sources",
    )
    .order("slug", { ascending: true });
  if (error) fail("insights", error.message);
  return parseRows(InsightSchema, data);
}
