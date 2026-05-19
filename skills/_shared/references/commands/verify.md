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

If the task record is missing, stop with an explicit error. Do not use `.memory-bank/tasks/backlog.md` as authoritative task state.

Приоритет basis для verify:
1. `verification_targets`, если они явно указаны в task record / IMPL plan / feature doc
2. `normative_inputs`, если они явно перечислены и релевантны проверке
3. classic acceptance criteria из feature doc
4. RTM / REQ IDs
5. tests, logs, screenshots и иные evidence artifacts в `.tasks/TASK-<ID>/`

Важно:
- отсутствие richer verification fields не является ошибкой
- в таком случае verifier должен опираться на classic AC/REQ model

2) Для каждого AC/REQ:
- выполни минимальную проверку (предпочтительно детерминированную)
- зафиксируй:
  - что сделал
  - команды
  - где evidence (в `.tasks/TASK-<ID>/`)

Если richer verification targets заданы:
- сначала проверь их
- затем проверь, что они не противоречат classic acceptance criteria

3) Заполни `.protocols/TASK-<ID>/verification.md` (по шаблону, если он есть в проекте).

4) Если проблемы:
- зафиксируй BUG в `.memory-bank/bugs/`
- добавь follow-up `.task.json`, обнови `.memory-bank/tasks/index.json`, затем refresh `.memory-bank/tasks/backlog.md` как summary
- переведи текущую задачу в `status: failed` в `.task.json`
- downstream dependents пометь `status: blocked` в их `.task.json`

5) Если всё ок:
- `VERDICT: PASS`
- обнови текущий task record:
  - `status: done`
  - add verification/evidence marker in `verify`, `evidence_required`, or `verification_targets`
- обнови RTM lifecycle и refresh backlog summary (если используешь)
- если у feature/epic есть `lifecycle`, синхронизируй и его
</process>
