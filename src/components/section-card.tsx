function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** White report card with a serif section heading. */
export function SectionCard({
  title,
  id,
  children,
  className = "",
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const sectionId = id ?? slugify(title);
  const headingId = `${sectionId}-heading`;
  return (
    <section id={sectionId} aria-labelledby={headingId} className={`card p-5 sm:p-6 ${className}`}>
      <h2 id={headingId} className="font-display text-lg font-semibold text-ink sm:text-xl">
        {title}
      </h2>
      <div className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
