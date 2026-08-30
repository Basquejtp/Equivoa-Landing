-- ============================================================
-- EQUIVOA — LISTINGS TABLE (run after parts 1 and 2)
-- Paste into Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- This moves listings from a hardcoded JS array into a real table,
-- adds "available_from" for date filtering, and seeds it with the
-- 8 sample listings so nothing on the site looks empty afterwards.
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

-- ---------- seed data: the original 8 sample listings ----------
-- provider_id is null for these (nobody owns the demo data), so they
-- won't show up as editable in anyone's "My Listings" page, but will
-- keep appearing in Find/Map exactly as before.
insert into public.listings (id, name, location, type, accommodation, spaces, attrs, price, extras, description, lat, lng, available_from) values
('EQ-0142','Hazel Copse Livery','Somerset','Full-service yard','Stable + turnout',3,
 '["turnout-2x","turnout-individual","care-full","care-hay","care-mucking","care-rugs","care-checks","facility-indoor","facility-outdoor","facility-hacking","facility-washbay","facility-tackroom","training-weekly","activity-clinics"]'::jsonb,
 '{"model":"BOOK","amount":650,"period":"month","label":"Full Care Package"}'::jsonb,
 '[{"name":"3x daily turnout","amount":50},{"name":"Weekly private lesson","amount":45},{"name":"Clipping (per session)","amount":35}]'::jsonb,
 'A full-service yard on the edge of Exmoor, built for owners who want their horse properly looked after without giving up arena time or hacking.',
 51.03, -3.42, current_date),

('EQ-0209','Fenway Farm DIY','Devon','DIY livery','Stable + grazing',5,
 '["turnout-2x","turnout-group","turnout-flexible","care-basic","facility-outdoor","facility-hacking","facility-tackroom","activity-social"]'::jsonb,
 '{"model":"BOOK","amount":48,"period":"week","label":"DIY Livery"}'::jsonb,
 '[{"name":"Extra hay net (per week)","amount":6}]'::jsonb,
 'A friendly, sociable DIY yard where owners manage their own horse''s care day to day, with good hacking straight from the gate.',
 50.79, -3.68, current_date),

('EQ-0317','Oakridge Performance Yard','Surrey','Competition yard','Stable + individual turnout',1,
 '["turnout-1x","turnout-individual","care-full","care-checks","facility-indoor","facility-outdoor","facility-walker","facility-washbay","training-multiple","training-coach","training-competition","activity-shows","activity-clinics"]'::jsonb,
 '{"model":"POA","label":"Bespoke competition package"}'::jsonb,
 '[]'::jsonb,
 'A serious competition yard with a full training programme, built for horses actively campaigning at affiliated level.',
 51.19, -0.58, current_date + interval '60 days'),

('EQ-0455','Willow Bank Private Livery','Sussex','Small private yard','Stable + individual turnout',2,
 '["turnout-2x","turnout-individual","turnout-flexible","care-full","care-hay","care-rugs","facility-outdoor","facility-hacking"]'::jsonb,
 '{"model":"ENQUIRE","amount":520,"period":"month","label":"Private Full Livery"}'::jsonb,
 '[]'::jsonb,
 'A small, quiet family-run yard with only a handful of horses at any time, which suits owners who want a lot of individual attention.',
 50.99, -0.36, current_date + interval '14 days'),

('EQ-0521','Bridleway Equestrian Training Centre','Warwickshire','Training yard','Stable + group turnout',4,
 '["turnout-1x","turnout-group","care-basic","care-mucking","facility-indoor","facility-outdoor","facility-walker","training-weekly","training-multiple","training-coach","activity-clinics","activity-shows"]'::jsonb,
 '{"model":"ENQUIRE","amount":395,"period":"month","label":"Training Livery"}'::jsonb,
 '[{"name":"Competition day support","amount":60}]'::jsonb,
 'Built around instruction: multiple lessons a week are part of the culture here, not an add-on, with regular in-house clinics.',
 52.31, -1.63, current_date),

('EQ-0630','Meadowcroft Retirement Grazing','Somerset','Retirement grazing','Grass grazing',6,
 '["turnout-group","turnout-flexible","care-basic","facility-hacking"]'::jsonb,
 '{"model":"BOOK","amount":22,"period":"week","label":"Retirement Grazing"}'::jsonb,
 '[]'::jsonb,
 'Low-key, low-cost grazing for retired or resting horses, with daily checks included and minimal handling required.',
 51.06, -3.05, current_date),

('EQ-0748','Kestrel Stables','Yorkshire','Standard livery yard','Stable + turnout',4,
 '["turnout-2x","turnout-group","care-basic","care-hay","care-mucking","facility-outdoor","facility-tackroom","activity-social"]'::jsonb,
 '{"model":"BOOK","amount":58,"period":"week","label":"Standard Livery"}'::jsonb,
 '[{"name":"Rug changes (per week)","amount":8}]'::jsonb,
 'A straightforward, well-run yard on the North York Moors edge: no frills, reliable basic care, an easy-going crowd.',
 54.28, -1.03, current_date),

('EQ-0812','Somerset Grazing Meadows','Somerset','Grass grazing','Grass grazing only',8,
 '["turnout-group","turnout-flexible","facility-hacking"]'::jsonb,
 '{"model":"BOOK","amount":18,"period":"week","label":"Grass Grazing"}'::jsonb,
 '[]'::jsonb,
 'Simple grazing-only fields for owners who manage everything else themselves, with direct access onto bridleways.',
 51.09, -2.88, current_date)

on conflict (id) do nothing;
