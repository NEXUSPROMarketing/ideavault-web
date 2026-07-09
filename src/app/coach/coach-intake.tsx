"use client";

import { useActionState, useState } from "react";
import type { StickingPoint } from "@/lib/coach-content";
import { createCoachSession, type CoachActionState } from "./actions";

type IdeaOption = { slug: string; title: string; status: string };

export function CoachIntake({
  points,
  ideaOptions,
  hasProfile,
}: {
  points: StickingPoint[];
  ideaOptions: IdeaOption[];
  hasProfile: boolean;
}) {
  const [selected, setSelected] = useState<StickingPoint | null>(null);
  const [state, formAction, pending] = useActionState<CoachActionState, FormData>(
    createCoachSession,
    null,
  );

  return (
    <div>
      {/* Sticking point grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Pick your sticking point">
        {points.map((p) => {
          const active = selected?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(active ? null : p)}
              className={`card p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-lift ${
                active ? "border-terracotta ring-1 ring-terracotta" : ""
              }`}
            >
              <p className="font-display text-[15px] font-semibold leading-snug">{p.name}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{p.symptom}</p>
            </button>
          );
        })}
      </div>

      {/* Intake form appears once a point is chosen */}
      {selected && (
        <form action={formAction} className="card mt-6 p-5 sm:p-6">
          <input type="hidden" name="sticking_point" value={selected.id} />
          <p className="eyebrow">{selected.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The coach will want to know: <em>{selected.questions[0]}</em> And:{" "}
            <em>{selected.questions[1]}</em>
          </p>
          <div className="mt-4">
            <label htmlFor="coach-situation" className="field-label">
              Your situation — be specific, numbers welcome
            </label>
            <textarea
              id="coach-situation"
              name="situation"
              rows={5}
              required
              placeholder="What you're working on, what you've tried, what happened, and where it's stuck…"
              className="input resize-y"
            />
          </div>
          {ideaOptions.length > 0 && (
            <div className="mt-4 max-w-sm">
              <label htmlFor="coach-idea" className="field-label">
                About a specific vault idea? <span className="normal-case text-ink-faint">(optional)</span>
              </label>
              <select id="coach-idea" name="idea_slug" defaultValue="" className="input">
                <option value="">No specific idea</option>
                {ideaOptions.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.title} ({o.status})
                  </option>
                ))}
              </select>
            </div>
          )}
          {!hasProfile && (
            <p className="mt-4 rounded-lg bg-terracotta-tint px-3 py-2 text-[13px] text-terracotta-deep">
              Tip: fill in your <a href="/foryou" className="font-semibold underline">founder profile</a>{" "}
              first and the coach calibrates to your skills, budget and hours.
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              {pending ? "Booking your session…" : "Get coached"}
            </button>
            <p className="text-xs text-ink-faint">The brief takes ~2–3 minutes to write.</p>
          </div>
          {state && !state.ok && (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {state.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
