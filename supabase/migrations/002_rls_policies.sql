-- ============================================================
-- 002_rls_policies.sql
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────
alter table clubs          enable row level security;
alter table branches       enable row level security;
alter table seasons        enable row level security;
alter table users          enable row level security;
alter table coach_access   enable row level security;
alter table players        enable row level security;
alter table player_users   enable row level security;
alter table events         enable row level security;
alter table attendance     enable row level security;
alter table tests          enable row level security;
alter table test_results   enable row level security;
alter table measurements   enable row level security;
alter table invites        enable row level security;

-- ─── Helper: get current user role ───────────────────────────
create or replace function get_role(user_id uuid)
returns text as $$
  select role from users where id = user_id;
$$ language sql security definer stable;

-- ════════════════════════════════════════════════════════════
-- USERS
-- ════════════════════════════════════════════════════════════
create policy "users_read_own" on users
  for select using (auth.uid() = id);

create policy "superadmin_read_users" on users
  for select using (get_role(auth.uid()) = 'superadmin');

-- Handled by the handle_new_user trigger
create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on users
  for update using (auth.uid() = id);

-- ════════════════════════════════════════════════════════════
-- CLUBS
-- ════════════════════════════════════════════════════════════
create policy "users_read_own_club" on clubs
  for select using (
    id in (select club_id from users where id = auth.uid())
  );

create policy "superadmin_write_clubs" on clubs
  for all using (get_role(auth.uid()) = 'superadmin');

-- ════════════════════════════════════════════════════════════
-- BRANCHES
-- ════════════════════════════════════════════════════════════
create policy "users_read_branches" on branches
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or id in (select branch_id from coach_access where user_id = auth.uid())
    or id in (
      select p.branch_id from players p
      inner join player_users pu on pu.player_id = p.id
      where pu.user_id = auth.uid()
    )
  );

create policy "superadmin_write_branches" on branches
  for all using (get_role(auth.uid()) = 'superadmin');

-- ════════════════════════════════════════════════════════════
-- SEASONS
-- ════════════════════════════════════════════════════════════
create policy "users_read_seasons" on seasons
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or branch_id in (select branch_id from coach_access where user_id = auth.uid())
    or branch_id in (
      select p.branch_id from players p
      inner join player_users pu on pu.player_id = p.id
      where pu.user_id = auth.uid()
    )
  );

create policy "superadmin_write_seasons" on seasons
  for all using (get_role(auth.uid()) = 'superadmin');

-- ════════════════════════════════════════════════════════════
-- COACH ACCESS
-- ════════════════════════════════════════════════════════════
create policy "coaches_read_own_access" on coach_access
  for select using (user_id = auth.uid());

create policy "superadmin_manage_coach_access" on coach_access
  for all using (get_role(auth.uid()) = 'superadmin');

-- ════════════════════════════════════════════════════════════
-- PLAYERS
-- ════════════════════════════════════════════════════════════
create policy "coaches_see_players" on players
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or assigned_coach_id = auth.uid()
    or auth.uid() in (
      select user_id from coach_access
      where branch_id = players.branch_id
    )
  );

-- Parents and players see only their linked player record
create policy "family_see_own_player" on players
  for select using (
    id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );

create policy "coaches_insert_players" on players
  for insert with check (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "coaches_update_players" on players
  for update using (
    get_role(auth.uid()) = 'superadmin'
    or assigned_coach_id = auth.uid()
  );

-- Soft delete only — coaches set archived_at, never hard delete
-- (covered by coaches_update_players above)

-- ════════════════════════════════════════════════════════════
-- PLAYER_USERS
-- ════════════════════════════════════════════════════════════
create policy "coaches_manage_player_users" on player_users
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "family_read_own_link" on player_users
  for select using (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- EVENTS
-- ════════════════════════════════════════════════════════════
create policy "coaches_see_events" on events
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or branch_id in (
      select branch_id from coach_access where user_id = auth.uid()
    )
  );

create policy "family_see_events" on events
  for select using (
    branch_id in (
      select p.branch_id from players p
      inner join player_users pu on pu.player_id = p.id
      where pu.user_id = auth.uid()
    )
  );

create policy "coaches_write_events" on events
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

-- ════════════════════════════════════════════════════════════
-- ATTENDANCE
-- ════════════════════════════════════════════════════════════
-- Coaches and superadmin only — parents/players NEVER write attendance
create policy "coaches_write_attendance" on attendance
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "family_read_attendance" on attendance
  for select using (
    player_id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- TESTS
-- ════════════════════════════════════════════════════════════
create policy "coaches_manage_tests" on tests
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "family_read_tests" on tests
  for select using (
    branch_id in (
      select p.branch_id from players p
      inner join player_users pu on pu.player_id = p.id
      where pu.user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- TEST RESULTS
-- ════════════════════════════════════════════════════════════
create policy "coaches_manage_test_results" on test_results
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "family_read_own_results" on test_results
  for select using (
    player_id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- MEASUREMENTS
-- ════════════════════════════════════════════════════════════
create policy "coaches_manage_measurements" on measurements
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

create policy "family_read_own_measurements" on measurements
  for select using (
    player_id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- INVITES
-- ════════════════════════════════════════════════════════════
create policy "coaches_manage_invites" on invites
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

-- ─── Sensitive field view (parents/players use this) ─────────
-- Strips player_phone, guardian_phone, medical_notes
create view players_public as
  select
    id, fname, lname, dob, branch_id,
    assigned_coach_id, guardian_name,
    notes, archived_at, created_at
  from players;
