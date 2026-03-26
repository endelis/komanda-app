---
description: Technical defaults, stack conventions, patterns, known mistakes
---

## Stack
- React 18 + Vite (not CRA, not Next.js)
- Supabase JS v2 — import from `src/lib/supabase.js`
- react-i18next — all strings via `useTranslation()`, zero hardcoded UI text
- React Router v6 — page components in `src/pages/`
- Plain CSS — CSS variables only, no Tailwind, no styled-components
- Vercel deploy

## File structure
```
src/
  components/ui/       → Button Card Badge Avatar Input Modal Tag PhoneLink
  components/layout/   → AppShell Sidebar TopBar ThemeToggle LanguageToggle
  components/auth/     → LoginModal ProtectedRoute
  context/             → AuthContext.jsx
  pages/               → one file per route
  hooks/               → useAuth usePlayers useEvents useAttendance useTests useMeasurements useSeason
  lib/                 → supabase.js ageGroup.js format.js attendanceRatio.js
  i18n/                → index.js en.js lv.js
  styles/              → global.css
  App.jsx
  main.jsx
supabase/
  migrations/          → 001_initial_schema.sql 002_rls_policies.sql
  seed.sql
```

## Naming conventions
- Components: PascalCase (PlayerCard.jsx)
- Hooks: camelCase with use prefix (usePlayers.js)
- CSS classes: kebab-case (.player-card)
- Supabase tables: snake_case (player_users)
- All user-facing strings: i18n key only, never hardcoded

## Supabase patterns
```js
import { supabase } from '../lib/supabase'

// Always handle errors
const { data, error } = await supabase.from('players').select('id, fname, lname, dob, branch_id')
if (error) { /* handle */ }

// Never use select('*') for tables with sensitive columns
// Always list columns explicitly
```

## Auth pattern
```js
// AuthContext exposes:
const { user, role, branchId, clubId, signIn, signOut, loading } = useAuth()

// Role-based redirect after login:
// superadmin → /admin
// coach → /team
// parent | player → /home
```

## Age group (never store, always derive)
```js
// src/lib/ageGroup.js
export function getAgeGroup(dob, referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const seasonRef = new Date(year, 8, 1) // Sept 1
  const age = Math.floor((seasonRef - new Date(dob)) / 31557600000)
  if (age <= 7)  return 'U8'
  if (age <= 9)  return 'U10'
  if (age <= 11) return 'U12'
  if (age <= 13) return 'U14'
  if (age <= 15) return 'U16'
  return 'U18'
}
```

## Attendance ratio (exclude cancelled sessions)
```js
// src/lib/attendanceRatio.js
export function calcAttendanceRatio(records, events) {
  const held = events.filter(e =>
    !e.cancelled && (e.type === 'training' || e.type === 'match')
  )
  const present = records.filter(r => r.status === 'present').length
  return held.length > 0 ? Math.round((present / held.length) * 100) : null
}
```

## Known mistakes — do NOT repeat
- Do not use select('*') on players table — always list columns explicitly
- Do not allow parent/player role to write attendance
- Do not store age_group on player record — always derive from DOB
- Do not skip gdpr_consent_confirmed on player creation
- Do not use localStorage for auth state — Supabase session handles this
- Do not use position: fixed in components — breaks mobile layout
- Do not hardcode any UI string — always use i18n key

## Build check
```bash
npm run build   # must produce zero errors
npm run lint    # must produce zero errors
```
Run before marking any task done.
