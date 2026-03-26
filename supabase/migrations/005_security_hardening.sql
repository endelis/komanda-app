-- ============================================================
-- 005_security_hardening.sql
-- Prevents coaches from updating sensitive player fields via
-- direct API calls (bypassing frontend column selection).
-- Superadmin retains full update rights.
-- ============================================================

create or replace function guard_player_sensitive_update()
returns trigger as $$
begin
  -- Superadmin can update anything
  if get_role(auth.uid()) = 'superadmin' then
    return new;
  end if;

  -- Coaches cannot touch these fields
  if old.player_phone is distinct from new.player_phone then
    raise exception 'coaches cannot update player_phone';
  end if;
  if old.guardian_phone is distinct from new.guardian_phone then
    raise exception 'coaches cannot update guardian_phone';
  end if;
  if old.medical_notes is distinct from new.medical_notes then
    raise exception 'coaches cannot update medical_notes';
  end if;
  if old.gdpr_consent_confirmed is distinct from new.gdpr_consent_confirmed then
    raise exception 'coaches cannot update gdpr_consent_confirmed';
  end if;
  if old.gdpr_consent_date is distinct from new.gdpr_consent_date then
    raise exception 'coaches cannot update gdpr_consent_date';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger guard_player_sensitive_update_trigger
  before update on players
  for each row
  execute function guard_player_sensitive_update();

-- ─── Known accepted risks (to revisit before public launch) ──────────────────
-- 1. coaches_see_players policy allows branch coaches to SELECT all columns
--    including phone/medical of players not assigned to them. Frontend enforces
--    column selection, but a direct API call bypasses this. Fix: column-level
--    security via a SECURITY INVOKER view or PostgREST column privileges.
--
-- 2. coach_invites using (true) public read allows email enumeration with
--    anon key. Risk is low for a private sports club app. Fix pre-production:
--    gate reads through a SECURITY DEFINER function keyed on the token.
