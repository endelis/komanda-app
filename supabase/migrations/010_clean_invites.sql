-- ============================================================
-- 010_clean_invites.sql
-- Enforces the correct parent invite model:
--   - invites.player_id is NOT NULL (parent invite must target
--     a specific player — no club-roster selection)
--   - invites.club_id is dropped (no longer needed; club is
--     derived at runtime from player → branch → club)
--   - Removes the parent_see_club_roster policy added in 006
--     (parents no longer see the full roster)
--   - Removes the get_roster_by_invite_token function from 008
--     (no longer needed)
--
-- BEFORE RUNNING: ensure all existing invites rows have a
-- non-null player_id, or delete orphaned rows:
--   delete from invites where player_id is null;
-- ============================================================

-- 1. Drop roster-related objects from earlier migrations
drop policy   if exists "parent_see_club_roster" on players;
drop function if exists get_roster_by_invite_token(text);

-- 2. Enforce player_id NOT NULL on the invites table
--    (parent invites must always reference a specific player)
alter table invites
  alter column player_id set not null;

-- 3. Drop club_id — no longer needed since player_id is mandatory
--    and club can be derived via player → branch → club at query time.
alter table invites
  drop column if exists club_id;
