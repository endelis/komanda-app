-- ============================================================
-- 001_initial_schema.sql
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Clubs ───────────────────────────────────────────────────
create table clubs (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  season_reference text default 'sept1' check (season_reference in ('sept1','jan1')),
  created_at       timestamptz default now()
);

-- ─── Branches ────────────────────────────────────────────────
create table branches (
  id         uuid primary key default uuid_generate_v4(),
  club_id    uuid references clubs(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

-- ─── Seasons ─────────────────────────────────────────────────
create table seasons (
  id         uuid primary key default uuid_generate_v4(),
  branch_id  uuid references branches(id) on delete cascade,
  name       text not null,            -- e.g. "2025/2026"
  start_date date not null,
  end_date   date not null,
  is_current boolean default false,
  created_at timestamptz default now()
);

-- ─── Users (mirrors auth.users) ──────────────────────────────
create table users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  role               text not null check (role in ('superadmin','coach','parent','player')),
  display_name       text,
  club_id            uuid references clubs(id),
  language           text default 'lv' check (language in ('lv','en')),
  theme_preference   text default 'system' check (theme_preference in ('dark','light','system')),
  created_at         timestamptz default now()
);

-- ─── Coach access assignments ─────────────────────────────────
create table coach_access (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete cascade,
  branch_id  uuid references branches(id) on delete cascade,
  age_group  text check (age_group in ('U8','U10','U12','U14','U16','U18')),
             -- null = all age groups in branch
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ─── Players ─────────────────────────────────────────────────
create table players (
  id                       uuid primary key default uuid_generate_v4(),
  fname                    text not null,
  lname                    text not null,
  dob                      date not null,   -- age group always derived, never stored
  branch_id                uuid references branches(id) on delete cascade,
  assigned_coach_id        uuid references users(id),
  player_phone             text,            -- coach + superadmin only
  guardian_name            text,
  guardian_phone           text,            -- coach + superadmin only
  medical_notes            text,            -- coach + superadmin only, never parent/player
  gdpr_consent_confirmed   boolean not null default false,
  gdpr_consent_date        timestamptz,
  notes                    text,
  archived_at              timestamptz,     -- soft delete only — never hard delete
  created_by               uuid references users(id),
  created_at               timestamptz default now()
);

-- ─── Player ↔ user account links ─────────────────────────────
create table player_users (
  player_id    uuid references players(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  relationship text not null check (relationship in ('parent','player')),
  primary key (player_id, user_id)
);

-- ─── Calendar events ─────────────────────────────────────────
create table events (
  id                 uuid primary key default uuid_generate_v4(),
  branch_id          uuid references branches(id) on delete cascade,
  season_id          uuid references seasons(id),
  type               text not null check (type in ('training','match','tournament','measurement')),
  name               text not null,
  date               date not null,
  end_date           date,              -- tournaments only
  time               time,
  duration_minutes   int,
  location           text,
  cancelled          boolean default false,
  cancellation_note  text,
  created_by         uuid references users(id),
  created_at         timestamptz default now()
);

-- ─── Attendance ───────────────────────────────────────────────
-- Ratio = present ÷ held (held = not cancelled, type = training or match)
create table attendance (
  event_id   uuid references events(id) on delete cascade,
  player_id  uuid references players(id) on delete cascade,
  status     text not null check (status in ('present','absent','injured_sick','excused')),
  note       text,                      -- optional coach note e.g. "knee", "fever"
  marked_by  uuid references users(id),
  updated_at timestamptz default now(),
  primary key (event_id, player_id)
);

-- ─── Fitness test definitions ─────────────────────────────────
create table tests (
  id         uuid primary key default uuid_generate_v4(),
  branch_id  uuid references branches(id) on delete cascade,
  season_id  uuid references seasons(id),
  name       text not null,
  date       date not null,
  metrics    jsonb not null,            -- [{ "name": "Sprint 30m", "unit": "s" }, ...]
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ─── Fitness test results ─────────────────────────────────────
create table test_results (
  test_id    uuid references tests(id) on delete cascade,
  player_id  uuid references players(id) on delete cascade,
  results    jsonb not null,            -- { "Sprint 30m": "4.42", "Beep test": "11.2" }
  entered_by uuid references users(id),
  primary key (test_id, player_id)
);

-- ─── Body measurements ────────────────────────────────────────
create table measurements (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid references players(id) on delete cascade,
  season_id   uuid references seasons(id),
  date        date not null,
  weight_kg   numeric(5,1),
  height_cm   numeric(5,1),
  recorded_by uuid references users(id),
  created_at  timestamptz default now()
);

-- ─── Invite tokens ────────────────────────────────────────────
create table invites (
  id             uuid primary key default uuid_generate_v4(),
  player_id      uuid references players(id) on delete cascade,
  invited_email  text not null,
  role           text not null check (role in ('parent','player')),
  invited_by     uuid references users(id),
  token          text unique not null,
  accepted_at    timestamptz,
  expires_at     timestamptz not null,
  created_at     timestamptz default now()
);

-- ─── Age group helper function ────────────────────────────────
-- Based on Sept 1 season reference (matches clubs.season_reference default)
create or replace function get_age_group(dob date)
returns text as $$
declare
  season_ref date;
  age_years  int;
begin
  season_ref := make_date(extract(year from current_date)::int, 9, 1);
  age_years  := extract(year from age(season_ref, dob));
  if    age_years <= 7  then return 'U8';
  elsif age_years <= 9  then return 'U10';
  elsif age_years <= 11 then return 'U12';
  elsif age_years <= 13 then return 'U14';
  elsif age_years <= 15 then return 'U16';
  else                       return 'U18';
  end if;
end;
$$ language plpgsql immutable;

-- ─── Trigger: auto-insert user row on auth signup ─────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
