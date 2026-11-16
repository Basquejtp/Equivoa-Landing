-- ============================================================
-- EQUIVOA — REMOVE THE ORIGINAL DEMO LISTINGS
-- Run this once in Supabase SQL Editor only if you previously ran
-- supabase-schema-part3-listings.sql with its original sample data.
--
-- This removes only the eight known demo rows, and only when they
-- have no provider owner. It does not delete provider-owned listings.
-- Review the returned row count before proceeding.
-- ============================================================

delete from public.listings
where provider_id is null
  and id in (
    'EQ-0142',
    'EQ-0209',
    'EQ-0317',
    'EQ-0455',
    'EQ-0521',
    'EQ-0630',
    'EQ-0748',
    'EQ-0812'
  )
returning id, name, location;
