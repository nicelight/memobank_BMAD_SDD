---
name: mb-execute
description: >
  Implementation handoff skill for one TASK-* using tier-selected protocol files,
  local gates, evidence, and explicit verification/sync handoff.
---

# mb-execute - Implementation Handoff

## Purpose
`mb-execute` implements one scoped JSON task. It is not a mini-scheduler and it
does not own task closure. Flow: read task -> minimal preflight -> protocol ->
implement -> local gates -> evidence -> handoff.

## Status Transition Modes

Status transitions have two modes.

Scheduler mode:
- `/autopilot` and `/autonomous` own task status transitions.
- Scheduler decides closure/failure/blocking eligibility.
- `/execute` returns scoped implementation handoff; it does not close tasks.
- `/verify` gives functional verdict/evidence; in scheduler mode it does not close/fail/block/promote.
- `/red-verify` gives semantic verdict for T2/T3; in scheduler mode it does not close/fail/block/promote.
- `/mb-sync` records/reconciles state after the scheduler-provided closure/failure/blocking decision. It does not decide closure itself.
- T0/T1 scheduler closure may use compact evidence / functional PASS according to tier policy.
- T2/T3 scheduler closure requires `VERDICT: PASS` plus `SEMANTIC_VERDICT: semantic-pass` before scheduler marks `done`.
- T3 scheduler closure also requires exact markers `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.

Manual mode:
- Expected simple flow: `/execute -> /verify`.
- `/verify` may mark a task `done` after functional `VERDICT: PASS`, including T2/T3.
- For risky tasks, user/agent decides whether to run `/red-verify` after `/verify`.
- If `/red-verify` is run later and finds semantic issues, it may change status `done -> blocked`, `done -> failed`, or create a bug/follow-up task.
- `semantic-concern` in manual mode means do not trust the existing `done` state without human review / follow-up.
- Do not mix scheduler mode and manual mode inside one task run.
- No persisted `mode` field is used.

## Inputs
- `TASK_ID`, for example `TASK-123`
- `.memory-bank/tasks/index.json`
- indexed `.memory-bank/tasks/<TASK_ID>.task.json`
- task `tier: T0|T1|T2|T3`
- feature or epic docs referenced by the task
- `.memory-bank/requirements.md` / REQ IDs when relevant
- richer task fields when present: `source_artifacts`, `normative_inputs`,
  `constraints`, `invariants`, `verification_targets`

Missing richer fields do not block classic tasks; fall back to referenced docs.

## Minimal Preflight
Stop with an explicit handoff error if:
- task record/indexed file is missing
- the record `id` does not match `TASK_ID`
- `tier` is missing or is not `T0|T1|T2|T3`
- task `status` is `blocked`, `failed`, or `done`
- any `depends_on` task is missing or is not `done`

Route only by `task.tier`. Do not use legacy `risk` / `risk.level`.

## Protocol Routing
Create `.tasks/<TASK_ID>/` for runtime artifacts.

`T0` / `T1`: use compact protocol:
- `.protocols/<TASK_ID>/run.md`; record tier, goal, context, plan, changes,
  gates, evidence, and handoff notes
- `VERDICT: PASS|FAIL|BLOCKED` is a local evidence marker only, not task closure

`T2` / `T3`: use full protocol:
- `.protocols/<TASK_ID>/context.md`, `plan.md`, `progress.md`,
  `verification.md`, `handoff.md`

`T3`: exact marker lines are closure requirements:
- `HUMAN_CHECKPOINT: done`
- `ROLLBACK_RECOVERY_NOTE: present`

Record whether these markers are present or still needed; do not close the task.

## Implementation Rules
- Keep scope bounded to the task and its acceptance criteria.
- Record goal, non-goals, constraints, touched areas, and gates before broad edits.
- If fan-out is needed, use narrow non-overlapping worker scopes.
- Preserve unrelated changes and do not rewrite generated `shared-*` files.
- Keep protocol notes factual: what changed, what was checked, where evidence is.

## Local Gates
Run relevant local gates from project instructions: lint/typecheck, unit tests,
and integration/e2e checks only when relevant.

If a gate cannot run or fails, record command, result, evidence path, and the
blocker in the protocol/handoff. Do not convert that into final task status.

## Output / Handoff Contract
Finish with:
- changed files summary
- protocol file paths
- local gates run and results
- evidence paths under `.tasks/<TASK_ID>/`
- verification targets and risk notes for verifier/reviewer
- MB-SYNC handoff notes: what should be synchronized and by whom
- recommended next owner: scheduler, verifier, red-verifier, explicit standalone owner, or human

## Non-Ownership Rules
`mb-execute` never:
- closes tasks
- writes final task status
- runs `/mb-sync`
- runs `/verify` or `/red-verify`
- promotes, blocks, or unblocks dependents
- performs scheduler transitions such as in-progress, failed, or done

Schedulers (`/autopilot`, `/autonomous`) or an explicit standalone owner perform
verification orchestration, final status decisions, MB-SYNC, and dependent
promotion/blocking.
