"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "./actions";

/** Email capture for the daily drop — writes to the subscribers table. */
export function EmailCapture() {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(subscribe, null);

  if (state?.ok) {
    return (
      <div className="card border-moss/30 bg-moss-tint p-6 text-center" role="status">
        <p className="font-display text-lg font-semibold text-moss">You’re on the list ✓</p>
        <p className="mt-1 text-sm text-ink-soft">
          One fully-researched idea, every morning — and the drop always lives here too.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="card p-6">
      <p className="font-display text-lg font-semibold">One researched idea, every morning</p>
      <p className="mt-1 text-sm text-ink-soft">
        Free · the full report, not a teaser · unsubscribe anytime
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="drop-email" className="sr-only">
            Email address
          </label>
          <input
            id="drop-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={state ? !state.ok : undefined}
            aria-describedby={state && !state.ok ? "drop-email-error" : undefined}
            className="input"
          />
        </div>
        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          {pending ? "Adding you…" : "Get the daily drop"}
        </button>
      </div>
      {state && !state.ok && (
        <p id="drop-email-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
