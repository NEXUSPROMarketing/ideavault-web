"use client";

import { useState } from "react";
import { EmailSchema } from "@/lib/schemas";

/**
 * Email capture for the daily drop. Front-end only in Phase A —
 * Phase B wires this to the Daily Drop email service.
 */
export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setState("error");
      setMessage(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="card border-moss/30 bg-moss-tint p-6 text-center" role="status">
        <p className="font-display text-lg font-semibold text-moss">You’re on the list ✓</p>
        <p className="mt-1 text-sm text-ink-soft">
          The daily email is launching soon — you’ll be first in line. Until then, the drop lands
          here every morning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6">
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            aria-invalid={state === "error"}
            aria-describedby={state === "error" ? "drop-email-error" : undefined}
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          Get the daily drop
        </button>
      </div>
      {state === "error" && (
        <p id="drop-email-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}
    </form>
  );
}
