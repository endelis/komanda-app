# Session memory

## Decisions made
- App name: KOMANDA (working title — final name TBD, Stride rejected)
- Age groups: U8/U10/U12/U14/U16/U18 only
- Season reference date: Sept 1 (Latvian sports convention)
- No player positions or playing roles
- Attendance is coach-only write — parents/players never touch it
- Injured and sick = one combined status: `injured_sick`
- GDPR consent checkbox mandatory at player creation
- First branch: Livonia-Mālpils
- Two coaches: one covers U8-U10, one covers U11-U18, both see all players
- Landing page language: Latvian throughout
- Nav: logo left + single "Ieiet" button right — no other nav links
- "Pieteikties demonstrācijai" CTA stays on hero section
- Deploy target: Vercel

## Phase 0 status
- [x] Vite + React project created (folder: komanda-app)
- [x] Dependencies installed
- [x] .env.local configured with Supabase keys
- [x] AuthContext, ProtectedRoute, App.jsx with routes
- [x] Landing page with hero, phone mockups, login modal
- [x] i18n set up (lv.js + en.js)
- [x] Global CSS with dark/light tokens
- [ ] Supabase migrations — next task
- [ ] Seed script
- [ ] Vercel deploy

## Known issues
(Add issues here as discovered during build)

## Context for next session
Phase 0b — Supabase schema. Need to create migration files and run in Supabase SQL editor.
Files to create:
- supabase/migrations/001_initial_schema.sql
- supabase/migrations/002_rls_policies.sql
- supabase/seed.sql
