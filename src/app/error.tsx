"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          The data didn’t load this time.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Usually this is a brief hiccup fetching from the database. Try again — if it keeps
          happening, the next hourly refresh normally clears it.
        </p>
        {error.digest && <p className="mt-2 text-xs text-ink-faint">Ref: {error.digest}</p>}
        <button type="button" onClick={reset} className="btn-primary mt-7">
          Try again
        </button>
      </div>
    </div>
  );
}
