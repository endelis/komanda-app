---
name: db-migration
description: Safe database schema changes with RLS verification. Use when: "add a column", "create a table", "write a migration".
tools: [read, write, bash]
---

## Process

1. Read all files in supabase/migrations/ — find highest migration number
2. Create supabase/migrations/[NNN]_[description].sql with the change + a comment explaining why
3. If new table or sensitive column: add RLS policies in the migration file
4. Update supabase/seed.sql if initial data structure changes
5. Spawn `rls-auditor` on new/modified policies
6. Report: migration file created, RLS changes made, audit result

## Rules
- Never DROP a column in production — add new one, migrate data
- Never DELETE user data — archive with archived_at
- Always test on dev/staging before production
- Include date and reason comment in each migration
