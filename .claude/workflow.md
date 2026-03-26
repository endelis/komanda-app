---
description: Build workflow, verification loops, context management, session hygiene
---

## Build loop (always follow this)
1. Plan — for any task touching >2 files, outline the plan first
2. Build — implement
3. Verify — run the appropriate check below
4. Fix — address issues
5. Confirm — only mark done after verification passes

## Verification by task type

### UI work
- Take a screenshot of the rendered result
- Check dark theme, light theme, mobile 375px
- Check empty state and loading state
- Fix and re-check until correct

### Logic/data work
- Run `npm run build` — zero errors required
- Test happy path in browser
- Test one edge case (empty state, missing data)

### Schema/migration work
- Run migration in Supabase SQL editor
- Verify RLS with a test query for each role
- Check seeded data still loads

### Auth/security work
- Test as each role: superadmin, coach, parent, player
- Attempt a forbidden action — confirm it is blocked
- Verify phone/medical fields hidden from wrong roles

## Plan mode triggers
Always plan before:
- Adding a new page or route
- Changing the database schema
- Adding a new RLS policy
- Building a feature end-to-end
- Fixing a bug across >2 files

## Context management
- Run /compact when context bar exceeds 60%
- Run /clear when switching to a completely unrelated task
- Run /context to audit token usage
- Keep prompts specific — name the file and function, not the whole feature
- Never paste full API docs — ask for specific endpoints only
- If Claude makes the same mistake twice, add it to tech.md immediately

## Session start
- State the current phase clearly
- Describe exactly what one thing we are finishing this session
- Run `git status` — commit stale work before starting

## Session end
- Run `npm run build` — no errors
- Commit with a clear message
- Update "Current phase" line in CLAUDE.md
- Note blockers or next steps

## Spawning sub-agents
- Use `researcher` agent for unfamiliar APIs or Supabase patterns
- Use `code-reviewer` after completing a significant feature
- Use `qa` agent before marking a phase complete
- Use `rls-auditor` before going live or after any schema change
