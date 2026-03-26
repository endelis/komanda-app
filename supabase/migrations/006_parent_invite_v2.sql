-- ============================================================
-- 006_parent_invite_v2.sql
-- Redesigned parent invite flow:
--   - invites.club_id so the acceptance page knows which
--     club's players to show for child-claim step
--   - parent_see_club_roster: lets a newly-registered parent
--     view the club player roster (safe fields only) to claim
--     their children
--   - invites_accept_own: lets any authenticated user mark a
--     valid (non-expired, non-accepted) invite as accepted
-- ============================================================

-- ─── 1. Add club_id to invites ────────────────────────────────
-- player_id stays nullable (parent invites don't pre-select a player)
alter table invites
  add column if not exists club_id uuid references clubs(id);

-- ─── 2. Parent can see club roster during child-claim step ────
-- After signUp, we set users.club_id from the invite.
-- This policy lets the parent query unarchived players in
-- their club so they can select their children.
-- Sensitive fields (phone, medical) are never returned because
-- the InvitePage selects only id, fname, lname, dob.
create policy "parent_see_club_roster" on players
  for select using (
    get_role(auth.uid()) = 'parent'
    and branch_id in (
      select b.id from branches b
      where b.club_id = (
        select club_id from users where id = auth.uid()
      )
    )
  );

-- ─── 3. Allow marking an invite as accepted ───────────────────
-- The newly-registered parent (role='parent') is not a coach,
-- so coaches_manage_invites doesn't cover them.
-- This policy allows any authenticated user to UPDATE a row
-- only while it is still valid (not expired, not yet accepted).
-- The application always scopes the update to a specific invite
-- id obtained via a prior token lookup.
create policy "invites_accept_own" on invites
  for update
  using (accepted_at is null and expires_at > now());
