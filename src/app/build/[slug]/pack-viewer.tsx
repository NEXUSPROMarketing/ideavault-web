"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

const POLL_INTERVAL_MS = 20_000;
const MAX_POLLS = 20;

/**
 * Three states: cached pack (render + download) · not yet requested
 * (Generate now button → dispatches the Pack Foreman) · queued (polls the
 * cache until the Foreman's write lands).
 */
export function PackViewer({
  slug,
  title,
  initialContent,
  initialQueued = false,
}: {
  slug: string;
  title: string;
  initialContent: string | null;
  initialQueued?: boolean;
}) {
  const [content, setContent] = useState<string | null>(
    initialContent && initialContent.length > 0 ? initialContent : null,
  );
  const [queued, setQueued] = useState(initialQueued);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollsRef = useRef(0);

  const check = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/build/${encodeURIComponent(slug)}`);
      const data = (await res.json().catch(() => ({}))) as {
        ready?: boolean;
        queued?: boolean;
        content?: string | null;
        error?: string;
        message?: string;
      };
      if (res.ok && data.ready && data.content) {
        setContent(data.content);
        setQueued(false);
      } else if (res.ok && data.queued) {
        setQueued(true);
      } else if (!res.ok) {
        setError(data.message ?? "Couldn’t check right now — try again shortly.");
      }
    } catch {
      setError("Couldn’t check right now — try again shortly.");
    } finally {
      setBusy(false);
    }
  }, [slug]);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/build/${encodeURIComponent(slug)}`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ready?: boolean;
        queued?: boolean;
        content?: string | null;
        error?: string;
        message?: string;
      };
      if (res.ok && data.ready && data.content) {
        setContent(data.content);
      } else if (res.ok && data.queued) {
        setQueued(true);
        pollsRef.current = 0;
      } else if (data.error === "auth_required") {
        setError("Your session expired — sign in again.");
      } else if (data.error === "pro_required") {
        setError("This pack needs Pro — see /pro.");
      } else {
        setError(data.message ?? "Couldn’t start the generation — try again.");
      }
    } catch {
      setError("Couldn’t start the generation — try again.");
    } finally {
      setBusy(false);
    }
  }, [slug]);

  useEffect(() => {
    if (content || !queued) return;
    const timer = setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current > MAX_POLLS) {
        clearInterval(timer);
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [content, queued, check]);

  function download() {
    if (!content) return;
    const blob = new Blob([`# Build pack — ${title}\n\n${content}`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-build-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (content) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-faint">Cached — instant for every reader.</p>
          <button type="button" onClick={download} className="btn-secondary">
            Download .md
          </button>
        </div>
        <article className="card mt-3 p-6 sm:p-8">
          <Markdown>{content}</Markdown>
        </article>
      </div>
    );
  }

  if (queued) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl font-semibold">The research engine is on it</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Your pack is being drafted — this usually takes two to three minutes. It streams into
          the shared cache, so once it lands it’s instant for everyone. This page checks every
          20 seconds.
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm italic text-ink-faint">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" aria-hidden />
          Drafting…
        </p>
        <button
          type="button"
          onClick={check}
          disabled={busy}
          className="btn-secondary mt-5 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check now"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card p-10 text-center">
      <p className="font-display text-xl font-semibold">This pack hasn’t been drafted yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Be the first: generation takes two to three minutes and the finished pack is cached for
        everyone, instantly.
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="btn-primary mt-6 disabled:opacity-60"
      >
        {busy ? "Requesting…" : "Generate this pack now"}
      </button>
      {error && (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
