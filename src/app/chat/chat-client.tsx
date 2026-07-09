"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";

type Msg = { role: "user" | "assistant"; content: string };

const PRESETS = [
  "What are the 3 best ideas under $5K in startup costs?",
  "What’s breaking out in the trends right now?",
  "Which flagship idea fits 10 hours a week best?",
  "Compare the top two fintech ideas for a solo founder",
];

export function ChatClient({ initialUsed, limit }: { initialUsed: number; limit: number }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [used, setUsed] = useState(initialUsed);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, status]);

  const left = Math.max(0, limit - used);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setShowUpgrade(false);
    setBusy(true);
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);

    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        if (data.error === "quota_exceeded") {
          setError(`You’ve used all ${limit} messages for today — the meter resets at midnight UTC.`);
          setUsed(limit);
        } else if (data.error === "pro_required") {
          setError("Chat needs a Pro subscription.");
          setShowUpgrade(true);
        } else if (data.error === "auth_required") {
          setError("Your session expired — sign in again.");
        } else {
          setError(data.message ?? "That didn’t go through — try again.");
        }
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
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
          let evt: { type: string; text?: string; message?: string; used?: number };
          try {
            evt = JSON.parse(line.slice(5));
          } catch {
            continue;
          }
          if (evt.type === "delta" && evt.text) {
            acc += evt.text;
            setStreaming(acc);
            setStatus(null);
          } else if (evt.type === "status" && evt.text) {
            setStatus(evt.text);
          } else if (evt.type === "done" && typeof evt.used === "number") {
            setUsed(evt.used);
          } else if (evt.type === "error") {
            setError(evt.message ?? "The analyst hit a snag — try again.");
          }
        }
      }
    } catch {
      setError("Connection dropped mid-answer — try again.");
    } finally {
      if (acc) setMessages((m) => [...m, { role: "assistant", content: acc }]);
      setStreaming(null);
      setStatus(null);
      setBusy(false);
    }
  }

  return (
    <div className="card flex h-[72vh] min-h-[480px] flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        {messages.length === 0 && !streaming && (
          <div className="mx-auto max-w-lg pt-10 text-center">
            <p className="font-display text-xl font-semibold">What should you build?</p>
            <p className="mt-2 text-sm text-ink-soft">
              Every answer is pulled from the vault’s researched data — try one of these:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-cream">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="max-w-none">
              <Markdown>{m.content}</Markdown>
            </div>
          ),
        )}

        {streaming && (
          <div className="max-w-none">
            <Markdown>{streaming}</Markdown>
          </div>
        )}
        {status && (
          <p className="flex items-center gap-2 text-sm italic text-ink-faint">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" aria-hidden />
            {status}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}{" "}
            {showUpgrade && (
              <Link href="/pro" className="font-semibold underline">
                Upgrade
              </Link>
            )}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3 sm:p-4"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Ask the vault
          </label>
          <textarea
            id="chat-input"
            rows={1}
            value={input}
            disabled={busy || left === 0}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={left === 0 ? "Daily limit reached — back tomorrow" : "Ask the vault anything…"}
            className="input max-h-32 flex-1 resize-none"
          />
          <button type="submit" disabled={busy || !input.trim() || left === 0} className="btn-primary shrink-0 disabled:opacity-60">
            {busy ? "Thinking…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-right text-[11px] text-ink-faint" aria-live="polite">
          {left} of {limit} messages left today
        </p>
      </form>
    </div>
  );
}
