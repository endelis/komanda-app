---
name: phase-complete
description: Run before marking any phase complete. Runs build check, code review, QA. Use when: "verify phase is done", "run phase sign-off".
tools: [bash, read, glob, task]
---

## Process

### Step 1 — Build check
Run `npm run build` and `npm run lint`.
Stop immediately if errors found.

### Step 2 — Code review
Spawn `code-reviewer` agent on all files changed this phase.
Stop if blocking issues found.

### Step 3 — QA
Spawn `qa` agent on features built this phase.
Stop if any FAIL results.

### Step 4 — Security (if applicable)
If phase touched auth, RLS, player creation, or attendance:
Spawn `rls-auditor` on relevant policy files.

### Step 5 — Sign-off report
```
Phase [X] — [name] — READY / NOT READY

Build:        PASS / FAIL
Code review:  PASS / N blocking issues
QA:           PASS / N failures
Security:     PASS / SKIPPED / N issues

Next phase: [X+1] — [name]
```

Update "Current phase" in CLAUDE.md.
Commit: `feat: complete phase [X] — [name]`
