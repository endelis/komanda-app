---
description: Security, RLS policies, GDPR, data protection for minors
---

## Non-negotiable security rules
- ALL data access controlled by Supabase RLS — never by frontend JS alone
- NO public access to any table — RLS enabled on every table
- phone numbers and medical_notes: returned ONLY when auth.uid() = assigned_coach_id OR role = superadmin
- Attendance: INSERT and UPDATE restricted to coach and superadmin only
- Parents and players: SELECT only, and only for their linked player record

## Enable RLS on all tables

```sql
alter table clubs enable row level security;
alter table branches enable row level security;
alter table seasons enable row level security;
alter table users enable row level security;
alter table coach_access enable row level security;
alter table players enable row level security;
alter table player_users enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;
alter table tests enable row level security;
alter table test_results enable row level security;
alter table measurements enable row level security;
alter table invites enable row level security;
```

## Helper function — get current user role

```sql
create or replace function get_role(user_id uuid)
returns text as $$
  select role from users where id = user_id;
$$ language sql security definer stable;
```

## Key RLS policies

### users table
```sql
-- Users can read their own record
create policy "users_read_own" on users
  for select using (auth.uid() = id);

-- Superadmin reads all users in their club
create policy "superadmin_read_users" on users
  for select using (get_role(auth.uid()) = 'superadmin');

-- Insert on sign-up (handled by trigger)
create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);
```

### players table
```sql
-- Coaches see players in their assigned scope
create policy "coaches_see_players" on players
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or assigned_coach_id = auth.uid()
    or auth.uid() in (
      select user_id from coach_access
      where branch_id = players.branch_id
    )
  );

-- Parents/players see only their linked player
create policy "family_see_own_player" on players
  for select using (
    id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );

-- Coaches and superadmin can insert players
create policy "coaches_insert_players" on players
  for insert with check (
    get_role(auth.uid()) in ('coach','superadmin')
  );

-- Coaches and superadmin can update players
create policy "coaches_update_players" on players
  for update using (
    get_role(auth.uid()) = 'superadmin'
    or assigned_coach_id = auth.uid()
  );
```

### attendance table
```sql
-- Coaches and superadmin write attendance
create policy "coaches_write_attendance" on attendance
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );

-- Parents/players read own child attendance only
create policy "family_read_attendance" on attendance
  for select using (
    player_id in (
      select player_id from player_users where user_id = auth.uid()
    )
  );
```

### events table
```sql
-- Coaches and superadmin in same branch see events
create policy "coaches_see_events" on events
  for select using (
    get_role(auth.uid()) = 'superadmin'
    or branch_id in (
      select branch_id from coach_access where user_id = auth.uid()
    )
  );

-- Parents/players see events for their branch
create policy "family_see_events" on events
  for select using (
    branch_id in (
      select p.branch_id from players p
      inner join player_users pu on pu.player_id = p.id
      where pu.user_id = auth.uid()
    )
  );

-- Coaches write events
create policy "coaches_write_events" on events
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );
```

### invites table
```sql
create policy "coaches_manage_invites" on invites
  for all using (
    get_role(auth.uid()) in ('coach','superadmin')
  );
```

## GDPR — mandatory
- Player creation MUST include gdpr_consent_confirmed = true
- UI checkbox text: "Apstiprinu, ka aizbildņa piekrišana datu glabāšanai ir saņemta"
- Checkbox is mandatory — form cannot submit without it
- gdpr_consent_date stored on player record

## Sensitive field protection
phone numbers and medical_notes are stored in the players table.
The RLS policies above restrict who can query the players table.
For extra protection, create a view that strips sensitive fields for non-coaches:

```sql
create view players_public as
  select id, fname, lname, dob, branch_id, guardian_name, notes, archived_at, created_at
  from players;
```

Parents and players query this view. Coaches query the full players table.

## Before going live checklist
- [ ] RLS enabled on all tables
- [ ] Test each role in Supabase SQL editor
- [ ] Attempt to read another player's phone as wrong coach — must fail
- [ ] Attempt to write attendance as parent — must fail
- [ ] GDPR gate tested — form blocked without checkbox
- [ ] .env.local not in git repo
- [ ] Only anon key in frontend — service role key never in any frontend file
- [ ] Vercel env vars set in dashboard
