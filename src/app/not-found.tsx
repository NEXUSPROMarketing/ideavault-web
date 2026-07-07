import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          This idea hasn’t been researched yet.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          The page you’re looking for doesn’t exist — but there are plenty of scored,
          sourced ideas that do.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/ideas" className="btn-primary">
            Browse the database
          </Link>
          <Link href="/" className="btn-secondary">
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
