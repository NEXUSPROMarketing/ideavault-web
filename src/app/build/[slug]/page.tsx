import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getIdeaBySlug, getLatestDrops } from "@/lib/queries";
import { getTierForUser } from "@/lib/gates";
import { packRequiresPro } from "@/lib/billing";
import { difficultyBand } from "@/lib/format";
import { DeepDiveFlag, ScoreBadge } from "@/components/pills";
import { PackViewer } from "./pack-viewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  return {
    title: idea ? `Build pack: ${idea.title}` : "Build pack",
    robots: { index: false, follow: false },
  };
}

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  if (!idea) notFound();

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tier, drops] = await Promise.all([
    user ? getTierForUser(supabase, user.id) : Promise.resolve("free" as const),
    getLatestDrops(1),
  ]);
  const dailySlug = drops[0]?.idea_slug ?? null;
  const isDailyFree = !packRequiresPro(slug, dailySlug);
  const allowed = !!user && (tier === "pro" || isDailyFree);

  let cachedContent: string | null = null;
  if (allowed) {
    try {
      const { data } = await getSupabaseAdmin()
        .from("build_packs")
        .select("content")
        .eq("idea_slug", slug)
        .maybeSingle();
      cachedContent = data?.content ?? null;
    } catch {
      cachedContent = null;
    }
  }

  return (
    <div className="shell py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-faint">
        <Link href={`/ideas/${idea.slug}`} className="transition-colors hover:text-terracotta">
          ← Back to the report
        </Link>
      </nav>

      <header className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Build pack</span>
              {idea.is_flagship && <DeepDiveFlag />}
              {isDailyFree && (
                <span className="inline-flex items-center rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-moss">
                  Today’s free pack
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {idea.title}
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              {idea.category}
              {idea.execution_difficulty != null && (
                <> · {difficultyBand(idea.execution_difficulty)} build</>
              )}
              {idea.time_to_mvp && <> · MVP in {idea.time_to_mvp}</>}
              {idea.startup_costs && <> · {idea.startup_costs}</>}
            </p>
          </div>
          <ScoreBadge score={idea.score_overall} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
          PRD, technical blueprint, a 30-60-90 build plan, sequenced Claude Code prompts, and a
          first-customers playbook — drafted from this idea’s full research report by the
          IdeaVault research engine, then cached for instant access.
        </p>
      </header>

      <div className="mt-6">
        {!user ? (
          <div className="card mx-auto max-w-xl p-10 text-center">
            <p className="font-display text-xl font-semibold">Sign in to open build packs</p>
            <p className="mt-2 text-sm text-ink-soft">
              Free accounts get today’s daily-drop pack; Pro unlocks all 120.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/build/${idea.slug}`)}`}
              className="btn-primary mt-6"
            >
              Sign in
            </Link>
          </div>
        ) : !allowed ? (
          <div className="card mx-auto max-w-xl p-10 text-center">
            <p className="eyebrow">Pro feature</p>
            <p className="mt-3 font-display text-xl font-semibold">
              Build packs for every idea are part of Pro
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Each pack turns a researched idea into a shippable plan: PRD, blueprint, milestones
              and copy-paste Claude Code prompts.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/pro" className="btn-primary">
                Unlock all packs — $19/mo
              </Link>
              {dailySlug && (
                <Link href={`/build/${dailySlug}`} className="btn-secondary">
                  Try today’s free pack
                </Link>
              )}
            </div>
          </div>
        ) : (
          <PackViewer slug={idea.slug} title={idea.title} initialContent={cachedContent} />
        )}
      </div>
    </div>
  );
}
