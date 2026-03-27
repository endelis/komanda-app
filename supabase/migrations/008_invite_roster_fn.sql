-- ============================================================
-- 008_invite_roster_fn.sql
-- SECURITY DEFINER function that returns the club player
-- roster for a given invite token.
--
-- Why a function instead of the parent_see_club_roster RLS policy:
--   1. Works whether or not the new user has an active session
--      (Supabase may require email confirmation before issuing
--      a session, so auth.uid() can be null in step 2).
--   2. Works even if users.club_id was not yet written (the
--      update in step 1 is silently blocked when unauthenticated).
--   3. Uses the invite token as authorization context —
--      only valid (non-expired, non-accepted) tokens work.
--   4. Only exposes safe fields: id, fname, lname, dob.
--      Sensitive columns (phone numbers, medical_notes) are
--      never touched.
-- ============================================================

create or replace function get_roster_by_invite_token(p_token text)
returns table(id uuid, fname text, lname text, dob date)
language sql security definer stable as $$
  select p.id, p.fname, p.lname, p.dob
  from   players  p
  join   branches b on b.id = p.branch_id
  join   invites  i on i.club_id = b.club_id
  where  i.token       = p_token
    and  i.accepted_at is null
    and  i.expires_at  > now()
    and  p.archived_at is null
  order  by p.lname;
$$;
