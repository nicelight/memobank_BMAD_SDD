---
description: Выполнение одной TASK-XXX как implementation handoff: read -> preflight -> protocol -> implement -> local gates -> evidence -> handoff.
status: active
---

# /execute - Execute One TASK

<objective>
Implement one scoped JSON task and produce protocol/evidence for the next owner.
`/execute` is not a scheduler and never closes tasks.
</objective>

<process>

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

## 0) Input
Expected `$ARGUMENTS`:
- `TASK-<ID>`

Required sources:
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-<ID>.task.json`
- task-relevant feature, epic, requirements, or normative docs referenced by the
  task

Use richer task fields when present:
- `source_artifacts`
- `normative_inputs`
- `constraints`
- `invariants`
- `verification_targets`

Missing richer fields are not an error. Use classic feature/requirements/docs
fallback when they are absent.

## 1) Preflight
Stop with an explicit error if:
- the task record is missing from `index.json`
- the indexed task file is missing
- the task record `id` does not match `TASK-<ID>`
- the task record has no `tier`
- `tier` is not `T0`, `T1`, `T2`, or `T3`
- task `status` is `blocked`, `failed`, or `done`
- any `depends_on` task is missing or has status other than `done`

Authoritative routing is only `task.tier`. Do not use legacy `risk` /
`risk.level`.

## 2) Protocol By Tier
Create `.tasks/TASK-<ID>/` for runtime evidence and reports.

For `T0` / `T1`, create or update compact protocol:
- `.protocols/TASK-<ID>/run.md`
- include tier, task record path, goal, non-goals, context used, fallback basis,
  plan, changes, local gates, evidence, and handoff notes
- `VERDICT: PASS|FAIL|BLOCKED` is a local evidence verdict only; it is not final
  task closure

For `T2` / `T3`, create or update full protocol:
- `.protocols/TASK-<ID>/context.md`
- `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- `.protocols/TASK-<ID>/verification.md`
- `.protocols/TASK-<ID>/handoff.md`

For `T3`, exact closure marker lines are required by the later closure owner:
- `HUMAN_CHECKPOINT: done`
- `ROLLBACK_RECOVERY_NOTE: present`

During `/execute`, record marker presence or gaps in handoff notes. Do not close
the task.

Use protocol templates when available. In `plan.md` or compact `run.md`, record:
- task tier and authoritative task record path
- richer inputs found
- fallback basis used when richer inputs are absent
- intended local gates
- MB-SYNC handoff / owner

## 3) Implement
Implement only scoped task changes.

Rules:
- keep edits bounded to acceptance criteria and referenced specs
- preserve unrelated user changes
- do not edit generated `skills/*/{agents,references,scripts}/shared-*` files
- update protocol/progress with what changed and where evidence lives
- if fan-out is necessary, use narrow non-overlapping worker scopes and collect
  reports in `.tasks/TASK-<ID>/`

Dependency sequencing:
- `/execute` handles only the requested task
- it does not promote dependent tasks
- it does not block dependent tasks after a failure
- dependent-task orchestration belongs to the scheduler or explicit owner

## 4) Local Gates
Run local implementation gates relevant to the touched code:
- lint / typecheck when applicable
- unit tests for touched behavior
- integration/e2e checks only when relevant

Record for each gate:
- command
- result
- evidence path or concise output summary
- blocker if the gate could not run

Gate results are evidence. `/execute` must not turn them into final task status.

## 5) Handoff Output
Return a concise handoff report containing:
- changed files
- protocol paths
- local gates run and results
- evidence paths under `.tasks/TASK-<ID>/`
- verification targets and notes for `/verify` or `/red-verify`
- MB-SYNC handoff notes for scheduler or explicit standalone owner
- blockers, unresolved questions, or FAIL reason if any
- recommended next owner

## 6) Do Not Own
`/execute` never:
- runs `/verify`
- runs `/red-verify`
- runs `/mb-sync`
- writes final task status
- closes tasks
- promotes, blocks, or unblocks dependents
- performs scheduler state transitions

Schedulers (`/autopilot`, `/autonomous`) or an explicit standalone owner perform
verification orchestration, final task status decisions, MB-SYNC, and dependent
promotion/blocking.

</process>
