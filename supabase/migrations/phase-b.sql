-- ============================================================
-- IdeaVault Phase B migration — user-side tables & policies
-- Idempotent: safe to run on a database that already has
-- profiles / idea_status from the go-live schema.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---- tables ------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  skills text,
  interests text,
  budget text,
  hours text,
  technical text,
  audience text,
  goal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.idea_status (
  user_id uuid references auth.users on delete cascade,
  idea_slug text references public.ideas(slug) on delete cascade,
  status text check (status in ('saved', 'interested', 'building', 'passed')),
  updated_at timestamptz default now(),
  primary key (user_id, idea_slug)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  unsub_token uuid not null default gen_random_uuid(),
  confirmed boolean not null default true,
  created_at timestamptz default now()
);

-- ---- row level security -------------------------------------

alter table public.profiles enable row level security;
alter table public.idea_status enable row level security;
alter table public.subscribers enable row level security;

-- profiles: owner-only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- idea_status: owner-only
drop policy if exists "idea_status_select_own" on public.idea_status;
create policy "idea_status_select_own" on public.idea_status
  for select using (auth.uid() = user_id);

drop policy if exists "idea_status_insert_own" on public.idea_status;
create policy "idea_status_insert_own" on public.idea_status
  for insert with check (auth.uid() = user_id);

drop policy if exists "idea_status_update_own" on public.idea_status;
create policy "idea_status_update_own" on public.idea_status
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "idea_status_delete_own" on public.idea_status;
create policy "idea_status_delete_own" on public.idea_status
  for delete using (auth.uid() = user_id);

-- subscribers: public may INSERT (email signup); nobody but the
-- service role may read, update or delete.
drop policy if exists "subscribers_public_insert" on public.subscribers;
create policy "subscribers_public_insert" on public.subscribers
  for insert to anon, authenticated with check (true);

-- ---- verify -------------------------------------------------
-- Expected: profiles / idea_status / subscribers all exist,
-- rls_enabled = true for all three.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'idea_status', 'subscribers')
order by relname;
