---
description: Автономный прогон JSON task queue (TASK-*) в чистых сессиях Codex/Claude.
status: active
---
# /autopilot — Run JSON task queue autonomously

## Важно
- Это **executor JSON task queue**, а не полный `PRD → done` orchestrator.
- Для полного unattended flow используй `/autonomous`.
- Запуск разрешён только если JSON task records уже декомпозированы и последний `/review` дал `APPROVE`.
- По умолчанию выполняй **строго последовательно**. Параллель — только для независимых задач без общих файлов.
- `/autopilot` не запускает `/prd-to-tasks` и не создает task queue; он только исполняет уже готовые JSON task records.

## Preconditions
- `.memory-bank/tasks/index.json` exists and lists task record files.
- `.memory-bank/schemas/task.schema.json` exists.
- Each indexed `.memory-bank/tasks/*.task.json` has at minimum:
  - `id`
  - `status: planned|ready|in_progress|blocked|done|failed`
  - `wave`
  - `feature`
  - `depends_on`
  - `touched_files`
  - `tier: T0|T1|T2|T3`
- Every task `feature` points to a `.memory-bank/features/FT-<NNN>-*.md` file with `clarification_status: complete`.
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.
- Нет unresolved blocking questions в `.protocols/AUTONOMOUS-RUN/status.md` или equivalent run protocol.
- `/mb-doctor --strict` passes before the run starts.

If there are no JSON task records, stop with an explicit error:
`HALT_DEPENDENCY_DEADLOCK: no schema-backed task records found in .memory-bank/tasks/index.json`.

If any indexed task record is missing `tier`, stop with `HALT_POLICY_VIOLATION`.
If any indexed task record is missing `feature`, references a missing feature file, or references a feature with missing/pending clarification metadata, stop with `HALT_CLARIFICATION_REQUIRED`.
Read the task queue and task metadata only from JSON task records.
Before task selection and before progression after a task closes, run `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`. Treat a missing doctor command/script, non-zero exit, or readiness error as `HALT_QUALITY_GATES`. Pending/missing feature clarification and tasks linked to unclarified features are readiness errors. `mb-doctor` runs `mb-lint` as its first gate; do not fall back to plain `mb-lint` for autonomous readiness.

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

## Status ownership

- `/autopilot` is the scheduler for an already prepared JSON task queue.
- `/autopilot` owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done`, `in_progress -> failed`, dependent block/unblock decisions, and terminal queue state.
- `/execute` returns implementation artifacts, gates, progress, and handoff evidence; it does not close or promote tasks in scheduler mode.
- `/verify` writes verification evidence/verdict and recommended next status; it does not close tasks or block/promote dependents in scheduler mode.
- `/red-verify` writes semantic evidence/verdict and recommended next status; it does not independently close tasks in scheduler mode.
- `/mb-sync` records the scheduler-provided closure/failure/blocking decision and consistency updates; it does not independently advance dependents.

## Selection rule
На каждой итерации reread `.memory-bank/tasks/index.json` and indexed `.task.json` records.

Сначала выполни promotion pass:
- `planned -> ready`, если все `depends_on` уже `done` и нет blockers / blocking review rejects / unresolved semantic-concern
- не продвигай задачу, если upstream failed/blocked, есть open blocking bug или task-level review reject
- запиши promotion в соответствующий `.task.json`

Затем выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocked upstream

Если после promotion pass `ready` пусто:
- и JSON task queue полностью закрыт → `SUCCESS`
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK`

## TASK loop
Для каждой выбранной задачи:
1) переведи в task record `status: ready -> in_progress`
2) перечитай `task.tier` из JSON record and route only by that value
3) выполни `/execute TASK-<ID>`
4) verification by tier:
   - `T0` / `T1`: compact path is allowed; verification may be recorded in `.protocols/TASK-<ID>/run.md`
   - `T2` / `T3`: full path is required; run `/verify TASK-<ID>` and `/red-verify TASK-<ID>` before closure
   - `T3`: require exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`; no silent autonomous closure
5) scheduler closure decision:
   - `T0` / `T1`: normal `done` allowed after verification `PASS`
   - `T2` / `T3`: `done` allowed only after `/verify` `PASS` evidence and `/red-verify` `semantic-pass`
6) run `/mb-sync` to sync the scheduler decision; `/mb-sync` must not promote dependents by itself
7) apply scheduler-owned closure:
   - `status: done` in the task record
   - run `/mb-doctor --strict` before promoting dependents
   - promote dependents через explicit `planned -> ready`, если все их deps закрыты и нет blockers / blocking review rejects / unresolved semantic-concern
8) если итог = `semantic-concern`:
   - не ставь normal `done`
   - до продолжения task/wave явно выбери и запиши решение: `blocked` для task/dependents или `in_progress` pending human review
   - если human review принимает concern, сначала зафиксируй owner/reason и повтори `/red-verify`; normal `done` разрешён только после `semantic-pass`
   - не продвигай dependents, пока задача не получила `semantic-pass`
   - `/mb-sync` только для записи blocked / human-review-required состояния
9) если `FAIL` или `semantic-fail`:
   - `status: failed` in the task record
   - создай bug + follow-up task
   - downstream dependents → `blocked`
   - проверь failure budget

Новые follow-up задачи, созданные во время verify, должны подхватываться **в том же run** на следующей итерации.

## Concrete task-level commands
### Codex (fresh session per TASK)

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, and the tier-selected protocol path. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read the indexed JSON task record and linked acceptance criteria. Route only by task.tier: T0/T1 compact run.md; T2/T3 verify + red-verify; T3 exact markers HUMAN_CHECKPOINT: done and ROLLBACK_RECOVERY_NOTE: present. Run mb-doctor --strict before progression."
```

### Claude (fresh session per TASK)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, and the tier-selected protocol path. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read the indexed JSON task record and linked acceptance criteria. Route only by task.tier: T0/T1 compact run.md; T2/T3 verify + red-verify; T3 exact markers HUMAN_CHECKPOINT: done and ROLLBACK_RECOVERY_NOTE: present. Run mb-doctor --strict before progression."
```

## Terminal states
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_CLARIFICATION_REQUIRED`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
