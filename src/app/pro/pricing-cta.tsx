"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PricingCta() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        message?: string;
      };
      if (res.status === 401) {
        router.push("/login?next=/pro");
        return;
      }
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(
        data.error === "not_configured"
          ? "Payments aren’t switched on yet — check back shortly."
          : (data.message ?? "Checkout didn’t start — try again."),
      );
    } catch {
      setError("Checkout didn’t start — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="font-display text-3xl font-bold">
          {interval === "monthly" ? "$19" : "$149"}
          <span className="font-sans text-sm font-normal text-ink-faint">
            {interval === "monthly" ? "/month" : "/year"}
          </span>
        </p>
        {interval === "yearly" && (
          <span className="rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-bold text-moss">
            ≈ 2 months free
          </span>
        )}
      </div>
      <div
        className="mt-3 inline-flex rounded-full border border-line bg-cream p-0.5"
        role="group"
        aria-label="Billing interval"
      >
        {(["monthly", "yearly"] as const).map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={interval === i}
            onClick={() => setInterval(i)}
            className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors ${
              interval === i ? "bg-ink text-cream" : "text-ink-soft hover:text-ink"
            }`}
          >
            {i === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={checkout}
        disabled={busy}
        className="btn-primary mt-4 w-full disabled:opacity-60"
      >
        {busy ? "Opening checkout…" : "Upgrade to Pro"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-faint">
        Stripe checkout · cancel anytime
      </p>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
