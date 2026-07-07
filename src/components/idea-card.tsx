import Link from "next/link";
import type { IdeaCard as IdeaCardData } from "@/lib/schemas";
import { DeepDiveFlag, ScoreBadge, TagChip } from "@/components/pills";
import { QuadrantGrid } from "@/components/quadrant";
import { difficultyBand } from "@/lib/format";

export type CardFit = { score: number; reasons: string[] };

/** Database card: title, tagline, tags, quadrant scores and fit footer. */
export function IdeaCard({ idea, fit }: { idea: IdeaCardData; fit?: CardFit }) {
  return (
    <Link
      href={`/ideas/${idea.slug}`}
      className="card group flex h-full flex-col p-5 transition duration-150 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            {idea.category}
          </span>
          {idea.is_flagship && <DeepDiveFlag />}
        </div>
        <ScoreBadge score={idea.score_overall} />
      </div>

      <h3 className="mt-2 font-display text-xl font-semibold leading-snug transition-colors group-hover:text-terracotta">
        {idea.title}
      </h3>
      {idea.tagline && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{idea.tagline}</p>
      )}

      {idea.signal_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {idea.signal_tags.slice(0, 3).map((t) => (
            <TagChip key={t}>{t}</TagChip>
          ))}
          {idea.signal_tags.length > 3 && (
            <span className="text-[11px] text-ink-faint">+{idea.signal_tags.length - 3}</span>
          )}
        </div>
      )}

      {fit && (
        <div className="mt-3 rounded-lg border border-moss/20 bg-moss-tint px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-moss">
            Fit {fit.score}%
          </p>
          {fit.reasons.length > 0 && (
            <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
              {fit.reasons.join(" · ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <QuadrantGrid idea={idea} compact />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line/70 pt-3 text-xs text-ink-faint">
        {idea.revenue_tier && (
          <>
            <span className="font-bold tracking-wider text-moss">{idea.revenue_tier}</span>
            <span aria-hidden>·</span>
          </>
        )}
        <span>{difficultyBand(idea.execution_difficulty)} build</span>
        <span aria-hidden>·</span>
        <span>GTM {idea.gtm_score ?? "—"}/10</span>
      </div>
    </Link>
  );
}
