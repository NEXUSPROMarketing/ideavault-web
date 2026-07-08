-- ============================================================
-- IdeaVault Phase C migration — build packs, AI usage, billing
-- Idempotent. Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Shared cache: one generated build pack per idea, served to everyone.
create table if not exists public.build_packs (
  idea_slug text primary key references public.ideas(slug) on delete cascade,
  content text not null,
  model text,
  created_at timestamptz default now()
);

-- Per-user per-day AI usage counters (chat quota).
create table if not exists public.ai_usage (
  user_id uuid references auth.users on delete cascade,
  day date not null,
  chat_messages int not null default 0,
  primary key (user_id, day)
);

alter table public.build_packs enable row level security;
alter table public.ai_usage enable row level security;
-- No policies on either: service-role access only (server routes gate access).

-- subscriptions: owner may read their own row (tier display);
-- writes happen only via the Stripe webhook using the service role.
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---- verify -------------------------------------------------
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('build_packs', 'ai_usage', 'subscriptions')
order by relname;
