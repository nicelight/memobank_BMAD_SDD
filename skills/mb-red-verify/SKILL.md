---
name: mb-red-verify
description: >
  Adversarial semantic verification for one TASK-* so teams can catch solutions that pass process checks but are still wrong in substance.
---

# mb-red-verify — Adversarial semantic verification

- **What it does:** pressure-tests one completed `TASK-*` for semantic correctness, hidden failure modes, and systemic harm.
- **Use it when:** a task may be locally correct yet still wrong in product/domain/architectural/operational reality.
- **Input:** `TASK_ID`, task intent, actual change surface, tests/evidence, and only then relevant spec reconciliation.
- **Output:** `red-verification.md`, a concise semantic-risk report, and follow-up bugs/tasks when concerns are serious.

## Goal
Catch changes that are "disciplined but wrong":
- pass acceptance criteria but solve the wrong problem
- work locally but damage system integrity
- overfit to the task record and ignore neighboring constraints
- introduce architectural drift, state inconsistency, or hidden maintenance cost
- create false confidence because the evidence surface is too narrow

## This is intentionally different from existing commands
- `mb-verify` checks acceptance criteria and evidence-backed task completion.
- `mb-review` reviews Memory Bank quality, planning, and discipline in fresh context.
- `mb-red-verify` asks: "Is this solution actually right in substance?"

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

## Preconditions
- Implementation exists.
- Quality gates were already run (or failures were recorded).
- For non-trivial tasks, `mb-verify` should usually run first.
- The indexed task record contains `tier`. Authoritative red-verification routing is only `task.tier`; the old `risk` / `risk.level` model is invalid.
- In scheduler mode, `T2` / `T3` require this pass before scheduler marks `done`.
- In manual mode, this pass is optional after `mb-verify PASS`; run it when risk/substance warrants it.
- `T0` / `T1` usually skip it unless scope has grown and the tier is updated first.

## Required outputs
Create or update:
- `.protocols/<TASK_ID>/red-verification.md`

Store a concise report in:
- `.tasks/<TASK_ID>/<TASK_ID>-S-RED-VERIFY-final-report-docs-01.md`

If concerns are material:
- `.memory-bank/bugs/BUG-<short>.md`
- follow-up `.task.json` records indexed in `.memory-bank/tasks/index.json`
- recommended task/dependent status for the active scheduler or explicit standalone owner

Use:
- `./references/shared-protocols-red-verification-template.md`
- `./agents/red-verifier.md`

## Input priority
Do **not** start by over-trusting the same full spec context the implementer used.

Prime in this order:
1. task intent and expected real-world outcome
2. actual code changes / diff / touched runtime behavior
3. tests, logs, screenshots, traces, and other evidence
4. neighboring constraints (`contracts/*`, `states/*`, `runbooks/*`, invariants)
5. broader spec reconciliation

This keeps the verifier from merely confirming the workflow surface.

## When to use it
Use `mb-red-verify` when:
- `task.tier` is `T2` or `T3`
- contracts, states, migrations, or data behavior changed
- the task crosses boundaries between modules/features
- runtime or API behavior changed
- business rules or domain semantics matter heavily
- acceptance criteria can be satisfied in a narrow but misleading way
- the change is risky, architectural, or likely to create hidden future cost

## When not to use it
Usually skip it for:
- typo-only edits
- formatting-only changes
- isolated mechanical refactors with no behavioral impact

## Process

### 1) Start from task intent and reality, not paperwork
Read only what you need:
- `.protocols/<TASK_ID>/plan.md`
- `.protocols/<TASK_ID>/progress.md`
- `.protocols/<TASK_ID>/verification.md` if it exists
- linked task record, feature, and requirement docs for intent
- the real diff / changed files / tests / runtime artifacts

### 2) Build a hostile hypothesis list
Challenge the solution from multiple angles:
- wrong problem solved
- local optimization with systemic harm
- hidden assumptions
- cross-boundary regression risk
- architectural drift
- state/data inconsistency
- operational weakness
- future maintenance burden

### 3) Reconcile with specs only after forming independent concerns
Then inspect the smallest sufficient spec subset:
- relevant `contracts/*`
- `states/*`
- `runbooks/*`
- `requirements.md`
- `invariants.md`
- related feature/epic docs

If code and specs disagree, record the drift explicitly rather than silently choosing one side.

### 4) Produce a hard-to-game report
The output must be concise and high-signal. Include:
- semantic verdict
- top substance risks
- hidden assumptions
- cross-boundary impact
- architectural concerns
- state/data consistency concerns
- operational concerns
- future maintenance cost
- how the change could still be wrong
- counterproposal or escalation path

For `T3`, also cover critical/security/runtime/recovery concerns and confirm exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present` are present before closure.

### 5) Take action from the verdict
- `semantic-pass`: no substantive concerns found; scheduler closure-eligible when `mb-verify` also has `PASS`; manual `done` may remain trusted
- `semantic-concern`: not proven wrong, but blocked or human-review-required; in manual mode, do not trust existing `done` without human review / follow-up
- `semantic-fail`: substantively wrong, systemically harmful, or too risky to accept; recommend or apply task `status: failed` according to active workflow ownership

When invoked by `/autopilot` or `/autonomous`, `mb-red-verify` must not independently close the task, write `done`, write `failed`, block dependents, or promote dependents. It writes the semantic verdict and returns the recommended status/dependent action to the scheduler.

For `semantic-concern`, recommend blocking task/dependents, reopening from `done`, or leaving the task pending human review. If human review accepts the concern, record owner/reason and repeat `mb-red-verify`; scheduler normal `done` requires `semantic-pass`.
For `semantic-fail`, file or recommend a bug, recommend follow-up tasks, recommend or apply `status: failed` according to active workflow ownership, and stop downstream progression through the scheduler/explicit standalone owner.

## Definition of done
- `red-verification.md` exists and is substance-focused.
- The report is concise, skeptical, and not just a rephrased `/verify`.
- Serious concerns result in explicit bugs/tasks/escalation.
