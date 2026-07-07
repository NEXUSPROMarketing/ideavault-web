import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getFitIdeas } from "@/lib/queries";
import { ProfileSchema, hasProfileContent, type Profile } from "@/lib/schemas";
import { rankIdeas } from "@/lib/fit";
import { IdeaCard } from "@/components/idea-card";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "For You",
  description: "Ideas ranked against your skills, budget, hours and audience.",
  robots: { index: false, follow: false },
};

function SignInPrompt() {
  return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      <p className="eyebrow">For You</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
        Ideas ranked for your situation
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Tell IdeaVault your skills, budget, weekly hours and audience — it ranks all 120
        researched ideas by founder fit, with the reasons on every card.
      </p>
      <Link href="/login?next=/foryou" className="btn-primary mt-6">
        Sign in to build your feed
      </Link>
    </div>
  );
}

export default async function ForYouPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="shell py-16">
        <SignInPrompt />
      </div>
    );
  }

  const [{ data: profileRow }, fitIdeas] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    getFitIdeas(),
  ]);

  const profile: Profile | null = profileRow ? ProfileSchema.parse(profileRow) : null;
  const ready = profile !== null && hasProfileContent(profile);

  if (!ready) {
    return (
      <div className="shell py-10">
        <header className="max-w-2xl">
          <p className="eyebrow">For You</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            First, your founder profile
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            Two minutes. The fit engine weighs your skills against each idea’s demand signals,
            your budget against its startup costs, your hours against build difficulty, and your
            audience against its go-to-market.
          </p>
        </header>
        <div className="card mt-8 max-w-3xl p-6">
          <ProfileForm initial={profile} />
        </div>
      </div>
    );
  }

  const ranked = rankIdeas(profile, fitIdeas);
  const strongMatches = ranked.filter((r) => r.fit.score >= 70).length;

  return (
    <div className="shell py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">For You</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ranked for your situation
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            {strongMatches} of {ranked.length} ideas score 70%+ fit against your profile. Fit
            blends skill match (35%), budget (20%), hours (20%) and go-to-market leverage (25%).
          </p>
        </div>
      </header>

      <details className="card group mt-6 max-w-3xl">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5 text-sm font-semibold text-terracotta transition-colors hover:text-terracotta-deep">
          Edit your founder profile
          <span className="text-xs transition-transform duration-150 group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="border-t border-line p-5">
          <ProfileForm initial={profile} />
        </div>
      </details>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map(({ idea, fit }) => (
          <IdeaCard key={idea.slug} idea={idea} fit={fit} />
        ))}
      </div>
    </div>
  );
}
