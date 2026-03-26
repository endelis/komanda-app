-- ============================================================
-- seed.sql
-- Run AFTER 001 + 002 migrations.
-- Creates: club → branch → season → superadmin user.
--
-- BEFORE RUNNING:
--   1. Create the superadmin user in Supabase Dashboard →
--      Authentication → Users → "Add user"
--      Email: your-email@example.com  (change below)
--   2. Copy the generated UUID and replace SUPERADMIN_UUID below.
--   3. Run this script in SQL Editor.
-- ============================================================

do $$
declare
  v_club_id   uuid;
  v_branch_id uuid;
  v_season_id uuid;

  -- !! Replace with the UUID of the user you created in Auth
  v_admin_id  uuid := '38b8b0db-8cfa-4890-b6d1-21b0d4bacf01';
  v_admin_email text := 'mail@endelis.co';
begin

  -- Club
  insert into clubs (name, season_reference)
  values ('Komanda SC', 'sept1')
  returning id into v_club_id;

  -- Branch
  insert into branches (club_id, name)
  values (v_club_id, 'Livonija-Mālpils')
  returning id into v_branch_id;

  -- Current season (2024/2025)
  insert into seasons (branch_id, name, start_date, end_date, is_current)
  values (v_branch_id, '2024/2025', '2024-09-01', '2025-06-30', true)
  returning id into v_season_id;

  -- Superadmin user row (auth user must already exist)
  insert into users (id, email, role, display_name, club_id)
  values (v_admin_id, v_admin_email, 'superadmin', 'Admin', v_club_id)
  on conflict (id) do update
    set role = 'superadmin', club_id = v_club_id;

end $$;
