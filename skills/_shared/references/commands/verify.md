---
description: Верификация выполненной задачи по acceptance criteria + evidence, итог PASS/FAIL.
status: active
---
# /verify — Verify a TASK (acceptance → evidence → verdict)

<objective>
Подтвердить, что реализованный функционал работает с точки зрения пользователя.
Это **не** adversarial semantic verification: если решение может формально пройти AC, но быть неверным по существу, после `/verify` запусти `/red-verify`.
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

0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

1) Прочитай минимум:
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-<ID>.task.json`
- `.protocols/TASK-<ID>/context.md`
- `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- acceptance criteria источник:
  - `.memory-bank/features/FT-*` и/или
  - `.memory-bank/requirements.md` (REQ IDs)

If the task record is missing, stop with an explicit error.
If the task record has no `tier`, stop with an explicit error. Authoritative verification routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.

Tier policy:
- `T0`: `/verify` is normally not required; verification may be recorded in `.protocols/TASK-<ID>/run.md`.
- `T1`: `/verify` is optional for strictly local scope; compact `run.md` may contain the verification evidence and verdict.
- `T2` / `T3`: `/verify` is required before scheduler closure and must update `.protocols/TASK-<ID>/verification.md`.
- `T3`: include critical/security/runtime evidence where relevant. Exact markers are scheduler closure requirements, not loose text.

Status ownership:
- `/verify` owns verification evidence and `VERDICT: PASS|FAIL|NEEDS-CLARIFICATION`.
- In scheduler mode (`/autopilot` / `/autonomous`), `/verify` must not close the task, set `status: done`, set `status: failed`, block dependents, or promote dependents. It reports the verdict and recommended next status to the scheduler.
- In standalone/manual mode, `/verify` may mark a task `done` after functional `VERDICT: PASS`, including `T2` / `T3`.
- For risky manual tasks, `/red-verify` is a user/agent decision after `/verify`, not a universal precondition for `done`.

Приоритет basis для verify:
1. `verification_targets`, если они явно указаны в task record / IMPL plan / feature doc
2. `normative_inputs`, если они явно перечислены и релевантны проверке
3. classic acceptance criteria из feature doc
4. RTM / REQ IDs
5. tests, logs, screenshots и иные evidence artifacts в `.tasks/TASK-<ID>/`

Важно:
- отсутствие richer verification fields не является ошибкой
- в таком случае verifier должен опираться на classic AC/REQ model
- `evidence_required` и `verification_targets` описывают требования/цели проверки; сами по себе они не являются proof
- detailed verification report may live in `.protocols/TASK-<ID>/verification.md`, with artifacts in `.tasks/TASK-<ID>/`
- before any command sets `status: done`, the task record `verify` field must contain the completed evidence summary/marker (string or structured object)
- in scheduler mode, for `T2` / `T3`, `/verify` itself must not set `status: done`; PASS only records verification evidence and leaves closure pending `/red-verify`
- in manual mode, `/verify PASS` may close `T2` / `T3`; later `/red-verify` may reopen/block/fail if semantic issues are found

2) Для каждого AC/REQ:
- выполни минимальную проверку (предпочтительно детерминированную)
- зафиксируй:
  - что сделал
  - команды
  - где evidence (в `.tasks/TASK-<ID>/`)

Если richer verification targets заданы:
- сначала проверь их
- затем проверь, что они не противоречат classic acceptance criteria

3) Заполни protocol evidence:
- для `T0` / `T1`, если используется compact path, обнови `.protocols/TASK-<ID>/run.md`
- для `T2` / `T3`, заполни `.protocols/TASK-<ID>/verification.md` (по шаблону, если он есть в проекте)

4) Если проблемы:
- зафиксируй BUG в `.memory-bank/bugs/`
- in standalone/manual mode, add follow-up `.task.json` and update `.memory-bank/tasks/index.json` only if that is the explicit local workflow
- record `VERDICT: FAIL` and recommend `status: failed`
- in scheduler mode, do not write `failed` or `blocked`; return the recommendation so the scheduler owns failure handling and dependent blocking

5) Если всё ок:
- `VERDICT: PASS`
- обнови текущий task record:
  - add completed verification/evidence entries in `verify`
- status by tier:
  - scheduler mode: recommend the scheduler decision; do not close/fail/block/promote
  - manual mode: may set `status: done` after functional `VERDICT: PASS`, including `T2` / `T3`
- record RTM/feature lifecycle recommendations for `/mb-sync`; do not independently perform scheduler closure
</process>
