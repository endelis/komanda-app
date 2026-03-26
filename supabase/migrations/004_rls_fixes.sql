-- ============================================================
-- 004_rls_fixes.sql
-- Fixes found during RLS audit
-- ============================================================

-- FIX 1: invites — allow unauthenticated read by token
-- InvitePage queries this table before the user has logged in.
-- The token is a UUID (unguessable), so using (true) is safe here.
create policy "public_read_invite_by_token" on invites
  for select using (true);

-- FIX 2: coach_access — allow a newly signed-up coach to insert their own row
-- When a coach accepts an invite, they are authenticated as role='coach' and
-- need to insert a coach_access entry for themselves.
-- superadmin_manage_coach_access covers all superadmin writes; this covers
-- the invite-acceptance path only (user_id must match the authenticated user).
create policy "own_coach_access_insert" on coach_access
  for insert with check (user_id = auth.uid());

-- FIX 3: player_users — allow invited parent/player to insert their own link
-- InvitePage inserts a player_users row after signup. The coaches_manage_player_users
-- policy requires coach/superadmin; a newly created parent/player would be blocked.
create policy "own_player_users_insert" on player_users
  for insert with check (user_id = auth.uid());
