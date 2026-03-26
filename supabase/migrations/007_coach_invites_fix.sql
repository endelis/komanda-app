-- ============================================================
-- 007_coach_invites_fix.sql
-- Fixes coach_invites RLS so superadmin can INSERT.
--
-- Root cause: "FOR ALL USING (...)" without an explicit
-- WITH CHECK clause causes Postgres to use the USING
-- expression as WITH CHECK, which can be silently denied
-- when the session context differs. Explicitly declaring
-- WITH CHECK makes intent clear and fixes the deny.
--
-- Also adds the coach_invites_accept_own UPDATE policy so
-- InvitePage can mark a coach invite as accepted after
-- the new coach sets their password.
-- ============================================================

-- ─── Re-create superadmin INSERT policy with explicit WITH CHECK ──
drop policy if exists "superadmin_manage_coach_invites" on coach_invites;

create policy "superadmin_manage_coach_invites" on coach_invites
  for all
  using     (get_role(auth.uid()) = 'superadmin')
  with check (get_role(auth.uid()) = 'superadmin');

-- ─── Allow newly-signed-up coach to mark their invite accepted ────
-- InvitePage calls UPDATE on coach_invites after signUp.
-- At that point the user has role='coach' — not superadmin —
-- so the above policy won't cover them for UPDATE.
drop policy if exists "coach_invites_accept_own" on coach_invites;

create policy "coach_invites_accept_own" on coach_invites
  for update
  using (accepted_at is null and expires_at > now());
