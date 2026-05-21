---
name: mb-execute
description: >
  Execute one TASK-* with a reproducible protocol, quality gates, and scheduler/standalone handoff.
---

# mb-execute — Execution loop (plan → build → gates → handoff)

- **What it does:** implements one scoped task and records the run in protocol files.
- **Use it when:** `TASK-*` already exists as a JSON record created by `/prd-to-tasks` and you want a clean, resumable implementation flow.
- **Input:** `TASK_ID` plus the indexed JSON task record, including mandatory `tier`.
- **Output:** code changes, protocol artifacts, verification inputs, and scheduler/standalone handoff recommendations.

## Goal
Turn a JSON task record into a **reproducible, verifiable change**:
- clear plan
- bounded implementation
- deterministic gates
- recorded verification
- explicit verification / MB-SYNC handoff

## Inputs
Orchestrator must provide:
- `TASK_ID` (e.g. `TASK-123`)
- link to the driving spec(s):
  - `.memory-bank/features/FT-*/...` and/or
  - `.memory-bank/requirements.md` (REQ IDs)
  - `.memory-bank/tasks/index.json` entry and indexed `.memory-bank/tasks/<TASK_ID>.task.json`

If present, also pass through richer structured inputs from the task record or IMPL plan:
- `source_artifacts`
- `normative_inputs`
- `constraints`
- `invariants`
- `verification_targets`

The task record must contain `tier: T0|T1|T2|T3`. Authoritative routing is only through `task.tier`; the old `risk` / `risk.level` model is invalid.

## Required artifacts
Create artifacts by tier:
- `T0` / `T1`: compact `.protocols/<TASK_ID>/run.md` is allowed and records context, plan, checks, verification summary, MB-SYNC decision, and verdict.
- `T2` / `T3`: full protocol is required: `.protocols/<TASK_ID>/context.md`, `plan.md`, `progress.md`, `verification.md`, `handoff.md`.
- `T3`: include exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present` before closure.

And a runtime folder:
- `.tasks/<TASK_ID>/`

Use templates from:
- `./references/shared-protocols-context-template.md`
- `./references/shared-protocols-plan-template.md`
- `./references/shared-protocols-progress-template.md`
- `./references/shared-protocols-verification-template.md`
- `./references/shared-protocols-handoff-template.md`

## Process

### 1) Prime context (cheap-to-prime)
Read only what you need:
- `AGENTS.md`
- `.memory-bank/index.md`
- the specific `FT-*` / `REQ-*` relevant to `TASK_ID`

Priority:
1. richer task record / IMPL-plan fields when present
2. classic feature + requirement inputs
3. duo docs and related normative docs as needed

Missing richer fields must not block execution of a classic task.
If the JSON task record or `tier` is missing, stop.

### 2) Write the plan (before touching code)
In the selected protocol file (`run.md` for compact T0/T1, `plan.md` for full T2/T3):
- goal + non-goals
- touched files/modules (hypotheses allowed, mark as such)
- constraints/invariants
- quality gates to run
- **MB-SYNC step is mandatory** (link to `.memory-bank/workflows/mb-sync.md`); in `/autopilot` / `/autonomous`, record it as scheduler-owned

If richer inputs were available, record them explicitly.
If they were absent, record the fallback basis used for execution.

### 3) Implementation (fan-out allowed)
If work is non-trivial:
- spawn subagents (max depth=2)
- give each worker a narrow scope (≤3–5 files)
- workers write details to `.tasks/<TASK_ID>/...`

Recommended role split (optional):
- **Implementer**: changes code/tests — `./agents/shared-implementer.md`
- **Secretary**: keeps `progress.md` updated — `./agents/shared-secretary.md`

### 3.1) Fresh Codex session per task (optional, clean context)
If you want the implementation to run in a **fresh Codex session** (clean context), run it via shell:

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, and tier-selected protocol files. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Write report to .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'
```

Then run verification in another fresh session:

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read the indexed JSON task record, tier-selected protocol files, and acceptance criteria. For T0/T1 record verification in run.md; for T2/T3 fill verification.md and store evidence in .tasks/TASK-123/. VERDICT: PASS/FAIL.'
```

### 3.2) Fresh Claude session per task (required when working in Claude Code)
If you are running inside **Claude Code**, enforce clean context by executing each `TASK-XXX` in a **fresh Claude session**:

Run implementer in a fresh session via shell (new session, clean context):

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, tier-selected protocol files, and acceptance criteria docs. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Write report to .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'
```

Then run verifier in another fresh session:

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read the indexed JSON task record, tier-selected protocol files, and acceptance criteria docs. For T0/T1 record verification in run.md; for T2/T3 fill verification.md and store evidence in .tasks/TASK-123/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
```

### 3.3) Sequencing rule (dependencies)
- If tasks are **independent** (no dependency and no shared files), you MAY run them in separate clean sessions in parallel.
- If tasks have a **dependency chain** (TASK-B requires outputs from TASK-A), run them **sequentially**, one after another, each in its own clean session.
- If tasks touch the same files, treat them as dependent unless you isolate via worktrees/branches.

### 4) Quality gates (deterministic)
Run the repo’s canonical gates (from `AGENTS.md`). Minimum:
- lint / typecheck
- unit tests
- integration/e2e when relevant

If any gate is flaky, record it in `progress.md` and (if needed) file a bug doc in `.memory-bank/bugs/`.

### 5) Verification handoff
Do not self-validate beyond sanity checks.
- `T0` / `T1`: local verification may be recorded in compact `run.md`.
- `T2` / `T3`: hand off to `mb-verify` and `mb-red-verify` before closure.

Scheduler mode ownership:
- If `mb-execute` is called by `/autopilot` or `/autonomous`, the scheduler owns the verify / red-verify / MB-SYNC sequence and final task status transitions.
- In scheduler mode, `mb-execute` should finish with implementation artifacts, gates, and verification handoff inputs; it must not duplicate scheduler-owned closure or promote the task to `done`.
- Standalone `mb-execute` may guide or call follow-up `mb-verify`, `mb-red-verify`, and MB-SYNC as needed, but only outside scheduler-owned runs.

### 6) MB-SYNC / closure handoff
For standalone execution, after verification is complete, provide an explicit closure recommendation and sync only an already-made local decision:
- update `.memory-bank/` docs (only WHY/WHERE + navigation)
- update `.memory-bank/index.md` routers if needed
- update `.memory-bank/requirements.md` RTM status (if used)
- update the JSON task record only when an explicit standalone closure decision exists; otherwise recommend the correct state (`done` / `failed` / `blocked`)
- append a record to `.memory-bank/changelog.md`

When invoked from `/autopilot` or `/autonomous`, skip this closure step locally and leave MB-SYNC plus final state promotion to the scheduler.

## Definition of done
- Protocol folder matches the task tier: compact `run.md` for eligible `T0` / `T1`, full five-file protocol for `T2` / `T3`.
- Gates pass (or failures are explicitly recorded + bug filed).
- Verification evidence is recorded in compact `run.md` or full `verification.md` according to tier.
- Memory Bank sync / changelog is completed only for explicit standalone closure; scheduler runs own final sync in `/autopilot` / `/autonomous` mode.
