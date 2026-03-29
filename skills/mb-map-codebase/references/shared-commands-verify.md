---
description: Верификация выполненной задачи по acceptance criteria + evidence, итог PASS/FAIL.
status: active
---
# /verify — Verify a TASK (acceptance → evidence → verdict)

<objective>
Подтвердить, что реализованный функционал работает с точки зрения пользователя.
</objective>

<process>

0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

1) Прочитай минимум:
- `.protocols/TASK-<ID>/context.md`
- `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- acceptance criteria источник:
  - `.memory-bank/features/FT-*` и/или
  - `.memory-bank/requirements.md` (REQ IDs)

Приоритет basis для verify:
1. `Verification Targets`, если они явно указаны в task card / IMPL plan / feature doc
2. `Normative Inputs`, если они явно перечислены и релевантны проверке
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
- добавь follow-up TASK в `.memory-bank/tasks/backlog.md` (если нужно)
- переведи текущую задачу в `failed`
- downstream dependents пометь `blocked`

5) Если всё ок:
- `VERDICT: PASS`
- обнови RTM lifecycle и backlog статусы (если используешь)
- если у feature/epic есть `lifecycle`, синхронизируй и его
</process>
