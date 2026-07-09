-- ============================================================
-- IdeaVault Business Coach migration — coach_sessions
-- Idempotent. Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  sticking_point text not null,
  situation text not null,
  idea_slug text references public.ideas(slug) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'ready', 'failed')),
  content text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists coach_sessions_user_idx
  on public.coach_sessions (user_id, created_at desc);

alter table public.coach_sessions enable row level security;

-- Owners read their own sessions and create their own; only the service
-- role (the Coach agent) writes content/status updates.
drop policy if exists "coach_sessions_select_own" on public.coach_sessions;
create policy "coach_sessions_select_own" on public.coach_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "coach_sessions_insert_own" on public.coach_sessions;
create policy "coach_sessions_insert_own" on public.coach_sessions
  for insert with check (auth.uid() = user_id);

-- ---- verify -------------------------------------------------
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace and relname = 'coach_sessions';
