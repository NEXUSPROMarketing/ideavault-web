"use client";

import { useActionState } from "react";
import {
  AUDIENCE_TIERS,
  BUDGET_TIERS,
  HOURS_TIERS,
  TECH_TIERS,
  type Profile,
} from "@/lib/schemas";
import { upsertProfile, type ProfileActionState } from "./actions";

function SelectField({
  id,
  label,
  name,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    upsertProfile,
    null,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <label htmlFor="pf-skills" className="field-label">
          Your skills
        </label>
        <textarea
          id="pf-skills"
          name="skills"
          rows={2}
          defaultValue={initial?.skills ?? ""}
          placeholder="e.g. systems design, research, marketing audits, training design, AI tooling"
          className="input resize-y"
        />
      </div>
      <div>
        <label htmlFor="pf-interests" className="field-label">
          Interests & domains you know
        </label>
        <textarea
          id="pf-interests"
          name="interests"
          rows={2}
          defaultValue={initial?.interests ?? ""}
          placeholder="e.g. B2B SaaS, education, health, local services"
          className="input resize-y"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SelectField
          id="pf-budget"
          label="Startup budget"
          name="budget"
          options={BUDGET_TIERS}
          defaultValue={initial?.budget ?? "1k-5k"}
        />
        <SelectField
          id="pf-hours"
          label="Hours per week"
          name="hours"
          options={HOURS_TIERS}
          defaultValue={initial?.hours ?? "5-10"}
        />
        <SelectField
          id="pf-technical"
          label="Technical level"
          name="technical"
          options={TECH_TIERS}
          defaultValue={initial?.technical ?? "low-code"}
        />
        <SelectField
          id="pf-audience"
          label="Audience"
          name="audience"
          options={AUDIENCE_TIERS}
          defaultValue={initial?.audience ?? "none"}
        />
      </div>
      <div>
        <label htmlFor="pf-goal" className="field-label">
          What are you aiming for? <span className="normal-case text-ink-faint">(optional)</span>
        </label>
        <input
          id="pf-goal"
          name="goal"
          type="text"
          defaultValue={initial?.goal ?? ""}
          placeholder="e.g. $5K/mo side income within a year"
          className="input"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Ranking ideas…" : initial ? "Update profile & re-rank" : "Save profile & rank ideas"}
        </button>
        {state && (
          <p
            role="status"
            className={`text-sm font-medium ${state.ok ? "text-moss" : "text-red-700"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
