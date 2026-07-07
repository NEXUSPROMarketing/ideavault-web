# IdeaVault — web

Public storefront for IdeaVault: researched startup ideas, scored on demand
signals, with live trends and market insights. **Phase A** — read-only public
pages, no auth.

> From "I want to build something" to "I know exactly what to build."

## Stack

- **Next.js 15** (App Router, React Server Components, ISR)
- **TypeScript** (strict) + **Zod** on data boundaries
- **Tailwind CSS** — IdeaVault design system (cream / ink / terracotta / moss, Fraunces + Inter)
- **Supabase** (Postgres) — read-only via the publishable key; RLS enforces public read on content tables

## Pages

| Route | What |
|---|---|
| `/` | Dashboard: hero, stats, Idea of the Day, top-scored leaderboard, categories, hottest trends |
| `/ideas` | Searchable / filterable idea database (category, min score, difficulty, sort) |
| `/ideas/[slug]` | Full research report: score ring, quadrant, fit tiles, 12-metric breakdown, deep dives |
| `/trends` | Trend cards with status, volume, growth and sparklines |
| `/insights` | Market insights with pain / gap / revenue levels |
| `/today` | Latest daily drop + email capture (front-end only in Phase A) |

Plus `sitemap.xml`, `robots.txt`, per-page metadata, per-idea OG images and JSON-LD.

## Develop

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

## Deploy (Vercel)

Import the repo, set two environment variables, deploy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optionally set `NEXT_PUBLIC_SITE_URL` once a custom domain exists (used by
sitemap + OG URLs). All content pages use ISR (`revalidate: 3600`), so data
refreshes hourly without redeploys.

## Data honesty

Demand data blends live measurements and AI estimates — always labeled.
Strings containing `[live]` / `(live …)` render with a green LIVE badge;
estimated volumes are labeled `(est.)`.

## Phase A scope

No auth, no `/foryou`, no library, no Stripe, no cron, no email sending —
those arrive in Phases B/C (see the export plan).
