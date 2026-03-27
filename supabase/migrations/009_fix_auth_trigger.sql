-- ============================================================
-- 009_fix_auth_trigger.sql
-- SECURITY FIX: The original handle_new_user() trigger read
-- the role from raw_user_meta_data, which means any caller of
-- supabase.auth.signUp({ options: { data: { role: 'superadmin' } } })
-- would receive superadmin rights immediately.
--
-- Fix: trigger always assigns 'player' (the minimum role).
-- The correct role is assigned EXPLICITLY by the invite
-- acceptance flow after registration — never from metadata.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, created_at)
  values (new.id, new.email, 'player', now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- The trigger itself was created in 001_initial_schema.sql and
-- is already attached — replacing the function is sufficient.
