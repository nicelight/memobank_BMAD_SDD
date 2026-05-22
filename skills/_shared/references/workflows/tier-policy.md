---
description: Tier policy for TASK routing, protocol depth, verification, and MB-SYNC.
status: active
---
# Tier Policy

Task records route execution by a single required field:

```json
"tier": "T0"
```

Allowed values: `T0`, `T1`, `T2`, `T3`.

Do not use a separate risk model in task records. If scope grows during execution, update the task to the higher tier and follow the higher-tier policy.

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

Tier summary:
- T0/T1: compact allowed.
- T2/T3: verify + red-verify before scheduler marks done.
- T3: human checkpoint + rollback/recovery before scheduler marks done.
- Manual mode: /verify PASS may close; /red-verify may reopen/block/fail.

## T0 - trivial / docs-only

Use for typos, formatting, broken links, or safe documentation changes with no runtime, contract, state, data, security, or test impact.

- Protocol: compact allowed. Full protocol not required.
- Separate `/verify`: not required; it may be skipped if compact evidence is enough
- `/red-verify`: not required
- Evidence: `VERDICT: PASS` or clear compact evidence accepted by current lint/doctor policy
- MB-SYNC: only if durable Memory Bank docs/state changed

## T1 - local code / local behavior

Use for one local function, one small component, a local unit test, or a contained behavior change with low blast radius.

- Protocol: compact allowed. Full protocol not required.
- Checks: relevant local lint/typecheck/unit tests when available
- Separate `/verify`: optional; it may be skipped if compact evidence is enough
- `/red-verify`: not required
- Evidence: `VERDICT: PASS` or clear compact evidence accepted by current lint/doctor policy
- MB-SYNC: only if durable Memory Bank docs/state changed

## T2 - cross-module / API / state / data / domain

Use for APIs, contracts, events, schemas, state machines, lifecycle changes, data behavior, migrations, multiple modules, or meaningful domain logic.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- Scheduler mode: verify + red-verify before scheduler marks done; semantic-pass required
- Manual mode: `/verify PASS` may close; later `/red-verify` may reopen/block/fail
- Evidence: store substantive artifacts under `.tasks/<TASK_ID>/`
- MB-SYNC: required

## T3 - critical / security / production / irreversible

Use for auth, permissions, secrets, security-sensitive behavior, deploy/runtime or production impact, irreversible migration, data loss, payments, compliance, or destructive operations.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- Scheduler mode: verify + red-verify before scheduler marks done; semantic-pass required
- T3: human checkpoint + rollback/recovery before scheduler marks done
- Required scheduler marker lines are exact standalone lines: `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`
- Manual mode: `/verify PASS` may still close; later red-verify/human review may reopen/block/fail
- MB-SYNC: required

## Assignment Rules

- Docs-only and safe -> `T0`
- Local, contained, low blast radius -> `T1`
- API, contracts, state, data, migration, domain logic, or multiple modules -> at least `T2`
- Auth, security, deploy/runtime, production, irreversible/data-loss, payments, or compliance -> `T3`
- If unsure between two tiers, choose the higher tier
