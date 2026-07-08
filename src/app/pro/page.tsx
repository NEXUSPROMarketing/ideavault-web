import type { Metadata } from "next";
import Link from "next/link";
import { PricingCta } from "./pricing-cta";

export const metadata: Metadata = {
  title: "Pro — from reading ideas to shipping one",
  description:
    "IdeaVault Pro unlocks build packs for all 120 researched ideas and the research chat. $19/mo or $149/yr founding price.",
  alternates: { canonical: "/pro" },
};

const FREE_FEATURES = [
  "All 120 researched idea reports",
  "Trends & market insights",
  "For You feed + personal library",
  "The daily drop + email",
  "Today’s build pack, free every day",
];

const PRO_FEATURES = [
  "Build packs for all 120 ideas — PRD, blueprint, 30-60-90, Claude Code prompts",
  "Research chat over the whole vault (50 messages/day)",
  "New packs the moment ideas drop",
  "Founding-member price, locked in",
];

export default function ProPage() {
  return (
    <div className="shell py-12 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">IdeaVault Pro</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          From reading ideas to <span className="italic text-terracotta">shipping one.</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
          The research is free. Pro is the execution layer: every idea turned into a buildable
          plan, and an analyst on call over the entire vault.
        </p>
      </header>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
        <section className="card p-6" aria-labelledby="free-heading">
          <h2 id="free-heading" className="font-display text-xl font-semibold">
            Free
          </h2>
          <p className="mt-1 font-display text-3xl font-bold">
            $0<span className="font-sans text-sm font-normal text-ink-faint"> forever</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-moss" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/login" className="btn-secondary mt-6 w-full">
            Start free
          </Link>
        </section>

        <section
          className="card relative border-terracotta/40 p-6 shadow-lift"
          aria-labelledby="pro-heading"
        >
          <span className="absolute -top-3 left-6 rounded-full bg-terracotta px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            Founding price
          </span>
          <h2 id="pro-heading" className="font-display text-xl font-semibold">
            Pro
          </h2>
          <PricingCta />
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-moss" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mx-auto mt-12 max-w-2xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-2xl font-bold">
          Questions
        </h2>
        <dl className="mt-4 space-y-4 text-sm leading-relaxed">
          <div className="card p-5">
            <dt className="font-semibold text-ink">What’s in a build pack?</dt>
            <dd className="mt-1.5 text-ink-soft">
              A complete execution document generated from the idea’s full research report: a PRD
              with scope discipline, a technical blueprint, a week-by-week 30-60-90 plan,
              sequenced Claude Code prompts you paste into an AI coding agent, and a
              first-customers playbook using the report’s GTM channels.
            </dd>
          </div>
          <div className="card p-5">
            <dt className="font-semibold text-ink">Can I cancel anytime?</dt>
            <dd className="mt-1.5 text-ink-soft">
              Yes — billing runs on Stripe and the billing portal is one click from your account
              menu. Cancel and you keep Pro until the period ends.
            </dd>
          </div>
          <div className="card p-5">
            <dt className="font-semibold text-ink">Is the data real?</dt>
            <dd className="mt-1.5 text-ink-soft">
              Demand data blends live measurements and AI estimates — always labeled, in reports
              and in chat answers alike. Signals refresh nightly.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
