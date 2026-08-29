-- ============================================================
-- EQUIVOA — DATABASE SCHEMA
-- Paste this whole file into Supabase: Dashboard -> SQL Editor
-- -> New query -> paste -> Run. Safe to run once on a fresh project.
-- ============================================================

-- ---------- profiles ----------
-- One row per signed-up person, linked 1:1 to Supabase's built-in auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'rider' check (role in ('rider','yard','coach')),
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'rider'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- preferences ----------
-- One row per (user, attribute) — this is what find.html reads and writes
-- when someone taps a chip. weight: 1=preferred, 2=important, 3=requirement.
create table if not exists public.preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  attr_key text not null,
  weight smallint not null check (weight between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, attr_key)
);

alter table public.preferences enable row level security;

create policy "Users can view their own preferences"
  on public.preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete their own preferences"
  on public.preferences for delete
  using (auth.uid() = user_id);

-- ---------- waitlist ----------
-- Public signups from the homepage form. Anyone can add a row;
-- nobody (except you, via the Supabase dashboard) can read the list back.
create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  role text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- No select policy on purpose: the public site can write, but can't read
-- the list back. You can still read it yourself in the Supabase dashboard,
-- which bypasses RLS.
