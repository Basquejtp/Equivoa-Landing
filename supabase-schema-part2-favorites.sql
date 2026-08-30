-- ============================================================
-- EQUIVOA — FAVOURITES TABLE (run this after supabase-schema.sql)
-- Paste into Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Safe to run once. If you already have a favorites table this
-- will just leave it alone (create if not exists).
-- ============================================================

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favourites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favourites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favourites"
  on public.favorites for delete
  using (auth.uid() = user_id);
