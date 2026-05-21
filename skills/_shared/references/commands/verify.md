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
- `T2` / `T3`: `/verify` is required before closure and must update `.protocols/TASK-<ID>/verification.md`.
- `T3`: include critical/security/runtime evidence where relevant and confirm exact marker `ROLLBACK_RECOVERY_NOTE: present` exists before closure.

Status ownership:
- `/verify` owns verification evidence and `VERDICT: PASS|FAIL|NEEDS-CLARIFICATION`.
- In scheduler mode (`/autopilot` / `/autonomous`), `/verify` must not close the task, set `status: done`, set `status: failed`, block dependents, or promote dependents. It reports the verdict and recommended next status to the scheduler.
- In standalone/manual mode, `/verify` may state the recommended next status. It may only perform local `T0` / `T1` compact closure when the direct standalone path explicitly chose compact local closure.
- For `T2` / `T3`, `/verify` never closes as `done`; PASS only makes the task eligible for `/red-verify`.

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
- for `T2` / `T3`, `/verify` itself must not set `status: done`; PASS only records verification evidence and leaves closure pending `/red-verify`

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
  - `T0` / `T1`: may keep compact closure behavior and set `status: done` only when an explicit standalone compact path allows it; otherwise recommend `done`
  - `T2` / `T3`: leave `status: in_progress` (or otherwise explicitly not `done`) pending `/red-verify`
- record RTM/feature lifecycle recommendations for `/mb-sync`; do not independently perform scheduler closure
</process>
