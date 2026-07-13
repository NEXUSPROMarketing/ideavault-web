"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailSchema } from "@/lib/schemas";

type FormState = "idle" | "sending" | "sent" | "error";
type Mode = "magic" | "password";

/**
 * Auth providers occasionally surface an unhelpful error body (an empty `{}`,
 * blank string, or other raw-JSON-looking text) instead of a real message —
 * seen in practice when the configured mail transport fails server-side.
 * Never show that verbatim; fall back to a clear, actionable message instead.
 */
function friendlyAuthMessage(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  const looksLikeRawJson = trimmed === "" || (trimmed.startsWith("{") && trimmed.endsWith("}"));
  return looksLikeRawJson ? fallback : trimmed;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/foryou";
  const linkError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  function redirectUrl(): string {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setState("error");
      setMessage(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setState("sending");
    try {
      const { createSupabaseBrowser } = await import("@/lib/supabase-browser");
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: redirectUrl() },
      });
      if (error) throw error;
      setState("sent");
    } catch (err) {
      setState("error");
      const raw = err instanceof Error ? err.message : "";
      setMessage(
        /rate limit/i.test(raw)
          ? "Email limit reached for now — try again in an hour, or sign in with a password below."
          : friendlyAuthMessage(
              raw,
              "Could not send the link — try again, or sign in with a password below.",
            ),
      );
    }
  }

  async function signInWithPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setState("error");
      setMessage(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    if (!password) {
      setState("error");
      setMessage("Enter your password");
      return;
    }
    setState("sending");
    try {
      const { createSupabaseBrowser } = await import("@/lib/supabase-browser");
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data,
        password,
      });
      if (error) throw error;
      window.location.assign(next);
    } catch (err) {
      setState("error");
      const raw = err instanceof Error ? err.message : "";
      setMessage(
        /invalid login credentials/i.test(raw)
          ? "Email or password doesn’t match."
          : friendlyAuthMessage(raw, "Sign-in failed — try again."),
      );
    }
  }

  async function signInWithGoogle() {
    setMessage("");
    try {
      const { createSupabaseBrowser } = await import("@/lib/supabase-browser");
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl() },
      });
      if (error) throw error;
    } catch (err) {
      setState("error");
      setMessage(
        err instanceof Error && /not enabled/i.test(err.message)
          ? "Google sign-in isn’t enabled yet — use the email link instead."
          : "Google sign-in failed — use the email link instead.",
      );
    }
  }

  if (state === "sent") {
    return (
      <div className="text-center" role="status">
        <p className="font-display text-lg font-semibold text-moss">Check your email ✓</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>. Open
          it on this device to land back here, signed in.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 text-sm font-semibold text-terracotta underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      {linkError && state === "idle" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          That sign-in link didn’t work (it may have expired) — request a fresh one below.
        </p>
      )}
      <form onSubmit={mode === "magic" ? sendMagicLink : signInWithPassword} noValidate>
        <label htmlFor="login-email" className="field-label">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? "login-error" : undefined}
          className="input"
        />
        {mode === "password" && (
          <div className="mt-3">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (state === "error") setState("idle");
              }}
              className="input"
            />
          </div>
        )}
        <button type="submit" disabled={state === "sending"} className="btn-primary mt-3 w-full">
          {state === "sending"
            ? mode === "magic"
              ? "Sending link…"
              : "Signing in…"
            : mode === "magic"
              ? "Email me a sign-in link"
              : "Sign in"}
        </button>
      </form>
      {state === "error" && (
        <p id="login-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "magic" ? "password" : "magic");
          setState("idle");
        }}
        className="mt-3 text-sm font-semibold text-terracotta underline underline-offset-2 hover:text-terracotta-deep"
      >
        {mode === "magic" ? "Have a password? Sign in with it" : "Prefer an email link instead?"}
      </button>
      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        <span className="h-px flex-1 bg-line" aria-hidden />
        or
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
      <button type="button" onClick={signInWithGoogle} className="btn-secondary w-full">
        Continue with Google
      </button>
    </div>
  );
}
