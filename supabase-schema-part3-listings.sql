-- ============================================================
-- EQUIVOA — LISTINGS TABLE (run after parts 1 and 2)
-- Paste into Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Creates the listings table and access policies.
-- No demo records are added; providers create real listings through the site.
-- Safe to run once.
-- ============================================================

create table if not exists public.listings (
  id text primary key,
  provider_id uuid references auth.users(id) on delete set null,
  name text not null,
  location text not null,
  type text not null,
  accommodation text not null,
  spaces int not null default 1,
  attrs jsonb not null default '[]'::jsonb,
  price jsonb not null default '{}'::jsonb,
  extras jsonb not null default '[]'::jsonb,
  description text default '',
  lat numeric,
  lng numeric,
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Anyone can view listings"
  on public.listings for select
  using (true);

create policy "Providers can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = provider_id);

create policy "Providers can update their own listings"
  on public.listings for update
  using (auth.uid() = provider_id);

create policy "Providers can delete their own listings"
  on public.listings for delete
  using (auth.uid() = provider_id);

-- No sample or fictional listings are inserted here.
-- Only provider-created, published listings should appear in the public directory.
