# Coach App (Komanda)

## Non-negotiables (apply to every task)
- NEVER delete user data — archive only (`archived_at`)
- NEVER expose `player_phone`, `guardian_phone`, `medical_notes` outside assigned coach + superadmin
- NEVER skip `gdpr_consent_confirmed` gate on player creation
- NEVER commit `.env.local` or any secrets
- NEVER hardcode UI strings — always use i18n keys in `src/i18n/en.js` + `src/i18n/lv.js`
- NEVER write attendance as parent or player role — coaches only
- ALWAYS run `npm run build` before marking any task done

## Current phase
Phase: [ ] — [ name ] — last worked: [ describe what was done and what comes next ]

## Stack
React + Vite · Supabase (Postgres + Auth + RLS) · Plain CSS · Vercel · react-i18next

## Roles
superadmin → coach → parent → player
Player/parent: read-only, own child only. Coach: full write within assigned scope.

## Age groups
U8 · U10 · U12 · U14 · U16 · U18 — derived from DOB at runtime, never stored.

## Key paths
- Rules: `.claude/rules/` — read the relevant file before starting a task
- Agents: `.claude/agents/` — spawn for research, code review, QA, RLS audit
- Skills: `.claude/skills/` — use for feature builds, migrations, phase sign-off
- Memory: `.claude/memory.md` — decisions made, known issues, session notes

---

## Phases

### Phase 0 — Setup + landing page ✓ (partially complete)
- [x] Vite + React scaffolded
- [x] @supabase/supabase-js and react-i18next installed
- [x] .env.local configured with Supabase URL and anon key
- [x] Global CSS with dark/light theme tokens
- [x] src/lib/supabase.js client init
- [x] src/i18n/ — lv.js and en.js translation files
- [x] React Router with protected route wrapper
- [x] AuthContext — Supabase auth state, signIn, signOut
- [x] Landing page — nav, hero, phone mockups, login modal
- [ ] Supabase schema — all tables created (Phase 0b)
- [ ] RLS policies applied (Phase 0b)
- [ ] Seed script: first superadmin + club + branch + season
- [ ] Deployed to Vercel

### Phase 0b — Supabase schema (next)
- [ ] supabase/migrations/001_initial_schema.sql
- [ ] supabase/migrations/002_rls_policies.sql
- [ ] supabase/seed.sql
- [ ] Run migrations in Supabase SQL editor
- [ ] Verify auth works end to end

### Phase 1 — Auth flows
- [ ] Invite acceptance: /invite/:token → set password → redirect by role
- [ ] Session persistence
- [ ] Sign out
- [ ] Password reset: /reset-password

### Phase 2 — Team (Players)
- [ ] Player list: age group filters, search, attendance % colour coded
- [ ] Add player form — GDPR consent checkbox mandatory
- [ ] Player profile: tap-to-call contacts, medical notes (coach only), test history, measurements
- [ ] Send parent/player invite by email

### Phase 3 — Calendar
- [ ] Event list grouped by month, colour-coded by type
- [ ] Training (gold) · Match (red) · Tournament (blue) · Measurement day (green)
- [ ] Add/edit/cancel events — cancelled shown struck through

### Phase 4 — Attendance
- [ ] Session list, expandable per session
- [ ] Mark per player: Present / Absent / Injured/Sick / Excused + optional note
- [ ] Coach can edit any past session
- [ ] Ratio excludes cancelled sessions

### Phase 5 — Performance
- [ ] Fitness tests: create, bulk result entry, delta vs previous test
- [ ] Measurements: bulk entry, per-player history

### Phase 6 — Player + Parent home (/home)
- [ ] Next training hero card — name, time, full location
- [ ] Upcoming tournament (within 30 days)
- [ ] Attendance ratio with session count
- [ ] Development snapshot: metric cards with deltas
- [ ] Latest measurements with trend
- [ ] /home/schedule and /home/progress
- [ ] Read-only, default language Latvian

### Phase 7 — Superadmin panel
- [ ] Invite coaches, assign scope (branch + age group)
- [ ] Manage branches and seasons

### Phase 8 — Polish + deploy
- [ ] Loading + empty states (both languages)
- [ ] Error handling throughout
- [ ] Mobile viewport, 44px touch targets
- [ ] RLS audit (spawn rls-auditor agent)
- [ ] Smoke test on real phone, both themes, both languages
- [ ] Deploy to Vercel

---

## Landing page spec (Phase 0c — complete)
- App name: KOMANDA (working title — final name TBD)
- Language: Latvian throughout
- Nav: logo left + "Ieiet" button right only
- Hero: eyebrow + H1 ("Viss tavs klubs — vienā vietā") + sub + 2 CTAs + 2 phone mockups
- Login modal: email + password + role-based redirect
- "Pieteikties demonstrācijai" CTA stays on hero

---

## When to read rules files
Before UI work → read `.claude/rules/design.md`
Before logic/data work → read `.claude/rules/tech.md`
Before schema changes → read `.claude/rules/data.md`
Before any auth/access work → read `.claude/rules/security.md`
When stuck or repeating mistakes → read `.claude/rules/workflow.md`

## How to start a session
```
Read CLAUDE.md. Current phase is [X] — [name]. [What to do this session.]
```
