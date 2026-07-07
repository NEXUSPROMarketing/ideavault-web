export const SITE_NAME = "IdeaVault";

export const SITE_TAGLINE =
  "From “I want to build something” to “I know exactly what to build.”";

export const SITE_DESCRIPTION =
  "Researched startup ideas, scored on demand signals. Live trends, market insights and one fully-researched idea drop every day.";

export const HONESTY_LINE =
  "Demand data blends live measurements and AI estimates — always labeled.";

/** Canonical site origin for metadata, OG images and the sitemap. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
