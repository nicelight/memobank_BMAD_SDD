---
name: mb-verify
description: >
  Verify one TASK-* against acceptance criteria and record reproducible evidence.
---

# mb-verify — Verifier loop (acceptance → evidence → verdict)

- **What it does:** checks a completed task against acceptance criteria and records the result with evidence.
- **Use it when:** implementation is done and you want an explicit PASS, FAIL, or partial verdict.
- **Input:** `TASK_ID`, acceptance criteria sources, and the task protocol files.
- **Output:** `verification.md`, evidence artifacts, updated task state, and follow-up bugs when criteria fail.

## Goal
Independent-ish verification so we don’t “trust without verify”.

This is **not** the adversarial semantic pass.
If a task may satisfy AC/REQ while still being wrong in substance, follow with `/red-verify` / `mb-red-verify`.

## Inputs
- `TASK_ID` (e.g. `TASK-123`)
- Authoritative task record via `.memory-bank/tasks/index.json` and `.memory-bank/tasks/<TASK_ID>.task.json`
- Mandatory `tier: T0|T1|T2|T3` in that task record
- Links to acceptance criteria:
  - `.memory-bank/features/FT-*` and/or
  - `.memory-bank/requirements.md` (REQ IDs)
- Link to protocol plan: `.protocols/<TASK_ID>/plan.md`

If present, also use:
- `verification_targets`
- `normative_inputs`
- task record references to source artifacts

## Preconditions
- Implementation is done and gates were run (or failures recorded).
- `.memory-bank/tasks/index.json` lists the target task record, and the indexed `.task.json` validates the requested `TASK_ID`.
- Authoritative verification routing is only `task.tier`; the old `risk` / `risk.level` model is invalid.

## Required outputs
- `T0` / `T1`: verification may be recorded in compact `.protocols/<TASK_ID>/run.md`.
- `T2` / `T3`: update (or create) `.protocols/<TASK_ID>/verification.md` using:
  - `./references/shared-protocols-verification-template.md`
- Store evidence in `.tasks/<TASK_ID>/`:
  - logs, screenshots, videos, reproduction steps
- Add completed evidence entries to the task record `verify` field; `evidence_required` and `verification_targets` remain requirements/targets, not proof by themselves.
- Before any command sets `status: done`, the task record `verify` field must contain completed verification/evidence entries.

## Process

### 1) Prime only what you need
Read:
- `.memory-bank/tasks/index.json`
- indexed `.memory-bank/tasks/<TASK_ID>.task.json`
- `.protocols/<TASK_ID>/context.md`
- `.protocols/<TASK_ID>/plan.md`
- `.protocols/<TASK_ID>/progress.md`
- acceptance criteria source docs

Before verifying, validate the authoritative task record:
- the task is present in `.memory-bank/tasks/index.json`
- the indexed record `id` matches `TASK_ID`
- required fields for verification are present (`status`, `feature`, `reqs`, `depends_on`, `gates`, `verify`)
- `tier` is present; if missing, stop

If the authoritative task record is missing or invalid, stop and report the issue instead of verifying from protocol docs alone.

Priority:
1. explicit `Verification Targets`
2. explicit `Normative Inputs`
3. classic feature acceptance criteria and RTM
4. evidence in `.tasks/<TASK_ID>/`

Missing richer fields must not block verification of a classic task.

### 2) Verify acceptance criteria
For each AC / REQ:
- run the smallest meaningful check
- prefer deterministic checks (tests/CLI) over “looks OK”
- record what you did and link the evidence

If the task changes UI or browser behavior:
- prefer Playwright / agent-browser / CDP-driven verification
- capture screenshots/videos/traces when useful
- store artifacts in `.tasks/<TASK_ID>/`
- do not use “I clicked around manually” as the main evidence when browser automation is available

### 3) Verdict
If anything fails:
- set `VERDICT: FAIL`
- create a bug doc in `.memory-bank/bugs/BUG-<short>.md`
- add a follow-up `.task.json` and update `.memory-bank/tasks/index.json` (if needed)
- mark current task record as `failed`
- block downstream dependents until the bug/follow-up is resolved

If all pass:
- `VERDICT: PASS`
- add completed verification/evidence entries in `verify`
- apply status by tier:
  - `T0` / `T1`: may keep compact closure behavior and set `status: done` when local policy allows it
  - `T2` / `T3`: do not set `status: done`; leave the task pending `/red-verify` / `mb-red-verify` with an explicit non-`done` state such as `in_progress`
- for `T2` / `T3`, final closure is eligible only after `/red-verify` / `mb-red-verify` returns `semantic-pass`

### 4) Sync statuses
- Update RTM lifecycle in `.memory-bank/requirements.md` (if used)
- If the feature/epic doc tracks `lifecycle`, sync it there too
- Update task state in the authoritative `.task.json` record according to the tier policy above

## Definition of done
- Verification output exists and is evidence-backed: compact `run.md` for eligible `T0` / `T1`, full `verification.md` for `T2` / `T3`.
- PASS verification has updated RTM/task evidence; `T2` / `T3` tasks are not closed until `/red-verify` / `mb-red-verify` produces `semantic-pass`.
- FAIL tasks have a bug doc and next steps.
