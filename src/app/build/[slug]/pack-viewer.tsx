"use client";

import { useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

/**
 * Renders a cached pack instantly, or streams a fresh generation.
 * Markdown re-parse is throttled during streaming to keep typing smooth.
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
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const accRef = useRef("");
  const lastFlushRef = useRef(0);

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

  async function generate() {
    setBusy(true);
    setError(null);
    setStatus("Reading the research report…");
    accRef.current = "";
    lastFlushRef.current = 0;

    try {
      const res = await fetch(`/api/build/${encodeURIComponent(slug)}`, { method: "POST" });

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as {
          cached?: boolean;
          content?: string;
          error?: string;
          message?: string;
        };
        if (res.ok && data.content) {
          setContent(data.content);
        } else if (data.error === "pro_required") {
          setError("This pack needs Pro — see /pro.");
        } else if (data.error === "auth_required") {
          setError("Your session expired — sign in again.");
        } else {
          setError(data.message ?? "Couldn’t start the generation — try again.");
        }
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          let evt: { type: string; text?: string; message?: string };
          try {
            evt = JSON.parse(line.slice(5));
          } catch {
            continue;
          }
          if (evt.type === "delta" && evt.text) {
            accRef.current += evt.text;
            setStatus(null);
            if (accRef.current.length - lastFlushRef.current > 250) {
              lastFlushRef.current = accRef.current.length;
              setContent(accRef.current);
            }
          } else if (evt.type === "status" && evt.text) {
            setStatus(evt.text);
          } else if (evt.type === "error") {
            setError(evt.message ?? "Generation failed — try again.");
          }
        }
      }
      if (accRef.current) setContent(accRef.current);
    } catch {
      setError("Connection dropped during generation — try again; a finished pack is cached.");
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }

  if (!content && !busy) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl font-semibold">
          This pack hasn’t been generated yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          You’ll be the first — it takes a minute or two, streams in live, and is then cached
          for everyone, instantly.
        </p>
        <button type="button" onClick={generate} className="btn-primary mt-6">
          Generate the build pack
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
        <p className="text-sm text-ink-faint" aria-live="polite">
          {busy ? (status ?? "Streaming the pack…") : "Complete — cached for instant access."}
        </p>
        {!busy && content && (
          <button type="button" onClick={download} className="btn-secondary">
            Download .md
          </button>
        )}
      </div>
      <article className="card mt-3 p-6 sm:p-8">
        {content ? <Markdown>{content}</Markdown> : <p className="text-sm italic text-ink-faint">{status ?? "Starting…"}</p>}
        {busy && <p className="mt-4 flex items-center gap-2 text-sm italic text-ink-faint"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" aria-hidden />Writing…</p>}
      </article>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
