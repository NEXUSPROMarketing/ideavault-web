"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

const POLL_INTERVAL_MS = 20_000;
const MAX_POLLS = 20;

/**
 * Shows the cached pack, or a "being drafted" state that polls until the
 * research engine (the Pack Foreman agent) has written the pack.
 */
export function PackViewer({
  slug,
  title,
  initialContent,
}: {
  slug: string;
  title: string;
  initialContent: string | null;
}) {
  const [content, setContent] = useState<string | null>(initialContent);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollsRef = useRef(0);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/build/${encodeURIComponent(slug)}`);
      const data = (await res.json().catch(() => ({}))) as {
        ready?: boolean;
        content?: string | null;
        error?: string;
        message?: string;
      };
      if (res.ok && data.ready && data.content) {
        setContent(data.content);
      } else if (!res.ok && data.error === "auth_required") {
        setError("Your session expired — sign in again.");
      } else if (!res.ok && data.error === "pro_required") {
        setError("This pack needs Pro — see /pro.");
      } else if (!res.ok) {
        setError(data.message ?? "Couldn’t check right now — try again shortly.");
      }
    } catch {
      setError("Couldn’t check right now — try again shortly.");
    } finally {
      setChecking(false);
    }
  }, [slug]);

  useEffect(() => {
    if (content) return;
    const timer = setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current > MAX_POLLS) {
        clearInterval(timer);
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [content, check]);

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

  if (!content) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl font-semibold">
          This pack is still being drafted
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Build packs are written by the IdeaVault research engine and cached for everyone —
          new ideas get theirs within a day. This page checks automatically every 20 seconds.
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm italic text-ink-faint">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" aria-hidden />
          Watching for the pack…
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
