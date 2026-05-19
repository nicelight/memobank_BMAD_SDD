---
description: Автономный прогон backlog задач (TASK-*) в чистых сессиях Codex/Claude.
status: active
---
# /autopilot — Run JSON task queue autonomously

## Важно
- Это **executor backlog-а**, а не полный `PRD → done` orchestrator.
- Для полного unattended flow используй `/autonomous`.
- Запуск разрешён только если JSON task records уже декомпозированы и последний `/review` дал `APPROVE`.
- По умолчанию выполняй **строго последовательно**. Параллель — только для независимых задач без общих файлов.

## Preconditions
- `.memory-bank/tasks/index.json` exists and lists task record files.
- `.memory-bank/schemas/task.schema.json` exists.
- Each indexed `.memory-bank/tasks/*.task.json` has at minimum:
  - `id`
  - `status: planned|ready|in_progress|blocked|done|failed`
  - `wave`
  - `depends_on`
  - `touched_files`
  - `risk.level: low|medium|high`
- Нет unresolved blocking questions в `.protocols/AUTONOMOUS-RUN/status.md` или equivalent run protocol.

If there are no JSON task records, stop with an explicit error:
`HALT_DEPENDENCY_DEADLOCK: no schema-backed task records found in .memory-bank/tasks/index.json`.

Do not parse markdown task cards from `.memory-bank/tasks/backlog.md`; that file is only a readable summary/router.

## Протокол batch-run
Если `.protocols/AUTONOMOUS-RUN/status.md` ещё нет:
- создай его с разделами:
  - run metadata
  - review gate
  - blocking questions / assumptions
  - queue state
  - failure budget
  - terminal state

Во время прогона обновляй:
- queue state from JSON task records (`ready`, `in_progress`, `blocked`, `done`, `failed`)
- latest review verdict
- current failure budget
- terminal state

## Selection rule
На каждой итерации reread `.memory-bank/tasks/index.json` and indexed `.task.json` records. Выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocked upstream

Если `ready` пусто:
- и JSON task queue полностью закрыт → `SUCCESS`
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK`

## TASK loop
Для каждой выбранной задачи:
1) переведи в task record `status: ready -> in_progress`
2) выполни `/execute TASK-<ID>`
3) выполни `/verify TASK-<ID>`
4) если задача domain-heavy, cross-boundary, stateful, migration/runtime/API-sensitive или есть риск "формально PASS, но семантически мимо" — выполни `/red-verify TASK-<ID>`
5) если итог = `PASS` и нет `semantic-fail`:
   - `status: done` in the task record
   - `/mb-sync`
   - разблокируй dependents, если все их deps закрыты
6) если `FAIL` или `semantic-fail`:
   - `status: failed` in the task record
   - создай bug + follow-up task
   - downstream dependents → `blocked`
   - проверь failure budget

Новые follow-up задачи, созданные во время verify, должны подхватываться **в том же run** на следующей итерации.

## Concrete task-level commands
### Codex (fresh session per TASK)

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read AGENTS.md, .protocols/TASK-123/{context,plan,progress}.md and linked FT/REQ specs. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md and linked acceptance criteria. Keep context.md updated. Fill verification.md. If PASS: mark task done and run MB-SYNC. If FAIL: create BUG + follow-up TASK and block dependents."
```

### Claude (fresh session per TASK)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read AGENTS.md, .protocols/TASK-123/{context,plan,progress}.md and linked FT/REQ specs. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md and linked acceptance criteria. Keep context.md updated. Fill verification.md. If PASS: mark task done and run MB-SYNC. If FAIL: create BUG + follow-up TASK and block dependents."
```

## Terminal states
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
