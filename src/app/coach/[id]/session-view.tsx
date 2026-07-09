"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

const POLL_INTERVAL_MS = 15_000;
const MAX_POLLS = 24;

/** Shows the coaching brief, or polls while the coach is writing it. */
export function SessionView({
  sessionId,
  initialStatus,
  initialContent,
}: {
  sessionId: string;
  initialStatus: string;
  initialContent: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [content, setContent] = useState<string | null>(initialContent);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollsRef = useRef(0);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/coach/${encodeURIComponent(sessionId)}`);
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        content?: string | null;
        message?: string;
      };
      if (res.ok && data.status) {
        setStatus(data.status);
        if (data.content) setContent(data.content);
      } else if (!res.ok) {
        setError(data.message ?? "Couldn’t check right now.");
      }
    } catch {
      setError("Couldn’t check right now.");
    } finally {
      setChecking(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (content || status !== "queued") return;
    const timer = setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current > MAX_POLLS) {
        clearInterval(timer);
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [content, status, check]);

  if (content) {
    return (
      <article className="card p-6 sm:p-8">
        <Markdown>{content}</Markdown>
      </article>
    );
  }

  if (status === "failed") {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl font-semibold">That session didn’t complete</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Something interrupted the coach — book a fresh session and it’ll pick right up.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-10 text-center" aria-live="polite">
      <p className="font-display text-xl font-semibold">Your coach is writing</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Reading your situation, checking it against the playbook, naming the constraint. Usually
        two to three minutes — this page checks automatically.
      </p>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm italic text-ink-faint">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" aria-hidden />
        Drafting your brief…
      </p>
      <button
        type="button"
        onClick={check}
        disabled={checking}
        className="btn-secondary mt-5 disabled:opacity-60"
      >
        {checking ? "Checking…" : "Check now"}
      </button>
      {error && (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
