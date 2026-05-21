---
description: Выполнение одной задачи (TASK-XXX) по протоколу: plan → build → gates; standalone can continue to verify → MB-SYNC.
status: active
---
# /execute — Execute one TASK (protocol-driven)

<objective>
Выполнять задачи последовательно или волнами так, чтобы:
- работа была параллельной, но без конфликтов
- результаты были верифицируемы
- standalone closure could update Memory Bank promptly, while scheduler mode reports evidence for scheduler-owned sync
</objective>

<process>

## 0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

Execution mode:
- Scheduler mode: `/execute` was called by `/autopilot` or `/autonomous`.
- Standalone mode: user invoked `/execute TASK-<ID>` directly.

Status ownership:
- In scheduler mode, the scheduler owns task state transitions, verify/red-verify, MB-SYNC, final closure, failure handling, and dependent promotion.
- In scheduler mode, `/execute` must implement scoped changes, update protocol/progress/evidence, run implementation gates that belong to the task, and report result/evidence to the scheduler.
- In scheduler mode, `/execute` must not mutate `ready -> in_progress`, `in_progress -> failed`, or `in_progress -> done`; must not run `/mb-sync`; must not update JSON task status after verification; and must not promote or block dependent tasks.
- In standalone mode, `/execute` owns implementation, local gates, protocol progress, and handoff evidence. It should recommend follow-up verification/status, not silently perform final closure.
- Exception: for explicitly compact standalone `T0` / `T1` tasks, local closure may be recorded in `run.md` and the task record only when the user/direct command path intentionally uses compact local closure.

## 1) Прочитай источники
Открой минимум:
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-<ID>.task.json`
- соответствующие спеки (например `.memory-bank/features/FT-*` / `.memory-bank/requirements.md`)

If the task record is missing from `index.json`, the indexed file is missing, or the record `id` does not match `TASK-<ID>`, stop with an explicit error.
If the task record has no `tier`, stop with an explicit error. Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.

Приоритет чтения:
1. explicit task record / IMPL-plan поля:
   - `source_artifacts`
   - `normative_inputs`
   - `constraints`
   - `invariants`
   - `verification_targets`
2. feature doc
3. epic / requirements RTM
4. duo docs (`architecture/*`, `guides/*`)
5. related contracts / states / runbooks / testing docs, если они упомянуты или нужны для границ

Важно:
- отсутствие richer fields не является ошибкой
- для classic tasks используй fallback к feature + requirements + duo docs

## 2) Создай протокол выполнения по `task.tier`
Сначала прочитай `tier` из authoritative `.task.json`.

Protocol routing:
- `T0` / `T1`: compact protocol is allowed. Create `.protocols/TASK-<ID>/run.md` and record tier, goal, scope, context used, plan, changes, gates/checks, evidence, and current handoff state. In standalone mode, also record verification summary, MB-SYNC decision, and verdict when local closure is performed. In scheduler mode, leave scheduler-owned closure fields pending for the scheduler.
- `T2` / `T3`: full protocol is required. Create `.protocols/TASK-<ID>/context.md`, `plan.md`, `progress.md`, `verification.md`, and `handoff.md`. Compact-only protocol is invalid. In scheduler mode, `/execute` updates implementation/progress/evidence and leaves verification/closure sections for the scheduler-owned verify/red-verify flow.
- `T3`: before closure, record both exact standalone marker lines in the full protocol: `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.

Если в проекте есть шаблоны протоколов (из `mb-execute`), используй их, иначе создай минимальные файлы вручную.

В scheduler mode (`/autopilot` / `/autonomous`) не меняй task `status` в `.task.json`: за `ready -> in_progress`, `in_progress -> failed/done`, verification closure, MB-SYNC, failure handling, and dependent promotion отвечает scheduler. Только фиксируй protocol/progress/evidence и report result back to scheduler.

В standalone mode `/execute TASK-<ID>` may recommend the next task state and guide follow-up `/verify`, `/red-verify`, and `/mb-sync` as needed. Do not silently claim scheduler-style closure; only explicitly compact standalone `T0` / `T1` paths may record local closure.

В full protocol `plan.md` и `context.md`, а в compact protocol `run.md`, явно зафиксируй:
- task tier and authoritative task record path
- какие richer inputs были найдены
- какой fallback использован, если richer inputs отсутствуют

## 3) Реализация (fan-out опционально)
### 3.1 Изоляция (без конфликтов)
- Разведи зоны по файлам (чтобы сабагенты не трогали одно и то же).
- Если пересечения неизбежны: worktree/branch per agent.

### 3.2 Сабагенты
Если задача нетривиальная:
- запусти до 5–7 сабагентов параллельно
- каждый сабагент работает в fresh context
- артефакты (логи/скрины/диффы/заметки) кладёт в `.tasks/TASK-<ID>/`

Роли (опционально):
- implementer: узкий исполнитель, который меняет только код/тесты в своём scope
- secretary: протоколист, который синхронно ведёт `progress.md` и артефакты

### 3.2.1 Fresh Codex session per TASK (optional, clean context)
Если хочешь максимально “чистый контекст” для реализации, запусти отдельную сессию через shell:

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-<ID>. Read AGENTS.md and the indexed JSON task record. Route only by task.tier. Use compact run.md for T0/T1 or full protocol files for T2/T3. Implement only scoped changes. Write report to .tasks/TASK-<ID>/TASK-<ID>-S-IMPL-final-report-code-01.md.'
```

### 3.2.2 Fresh Claude session per TASK (required when working in Claude Code)
Если ты работаешь в **Claude Code**, для чистого контекста делай так:
1) Оркестратор готовит tier-selected protocol files (`run.md` for T0/T1, full files for T2/T3) и папку `.tasks/TASK-<ID>/`.
2) Запусти новую “чистую” сессию через shell:

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-<ID>. Read AGENTS.md, the indexed JSON task record, tier-selected protocol files, and acceptance criteria docs. Route only by task.tier. Implement only scoped changes. Write report to .tasks/TASK-<ID>/TASK-<ID>-S-IMPL-final-report-code-01.md.'
```

3) Standalone follow-up verification, or scheduler-owned verification after `/execute` returns, uses a separate fresh session:

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-<ID>. Read the indexed JSON task record, tier-selected protocol files, and acceptance criteria. For T0/T1 record verification in run.md; for T2/T3 fill verification.md and store evidence in .tasks/TASK-<ID>/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
```

### 3.3 Gates
После реализации:
- lint/typecheck
- unit tests
- e2e (если применимо)

### 3.4 Параллельно vs последовательно (dependencies)
- Если задачи **независимы** (нет наследования/зависимостей и не трогают одни и те же файлы) — можно запускать в отдельных чистых сессиях параллельно.
- Если есть **наследование** (TASK-B зависит от результатов TASK-A) — standalone mode выполняет TASK-A строго последовательно through implement + verify + mb-sync before TASK-B; scheduler mode reports TASK-A result/evidence and lets the scheduler promote dependent tasks.
- Если есть пересечение по файлам/модулям — считай задачи зависимыми (или изолируй worktree/branch).

## 4) Верификация по `task.tier`
Scheduler mode:
- Do not call `/verify` or `/red-verify`.
- Do not write final verification verdict/status into the JSON task record.
- Record implementation gates/checks and evidence paths in the protocol, then report them to the scheduler.
- If richer fields were absent, include a note that the scheduler/verifier should use classic AC/REQ basis.

Standalone mode:
- `T0`: separate `/verify` is not required; record checks and verdict in compact `run.md`.
- `T1`: separate `/verify` is optional when scope remains local; record local verification in compact `run.md`.
- `T2` / `T3`: pass `TASK-<ID>` to `/verify` (or `mb-verify`) and then `/red-verify`; both are required before closure.
- If richer fields were absent, pass verifier an explicit instruction to use classic AC/REQ basis.
- `T3`: verification package must include critical/security/runtime concerns where relevant plus the exact rollback/recovery marker `ROLLBACK_RECOVERY_NOTE: present`.

## 5) MB-SYNC and closure
Standalone mode: after required verification, hand off an explicit closure recommendation, then run `/mb-sync` only to synchronize that already-made local decision:
- обнови `.memory-bank/` (WHY/WHERE + навигация)
- обнови RTM and task evidence/status only when an explicit standalone closure decision exists
- добавь запись в `.memory-bank/changelog.md`
- если задача failed и есть dependents — recommend `blocked`; do not silently advance/block dependents as if running the scheduler
- для `T2` / `T3` убедись, что closure expectations выполнены; для `T3` не закрывай задачу без exact marker lines `HUMAN_CHECKPOINT: done` и `ROLLBACK_RECOVERY_NOTE: present`

Scheduler mode: do not run `/mb-sync`, do not update JSON task status, and do not close/promote/block tasks. Return a concise report with changed files, gates run, evidence paths, protocol paths, and any blocker/FAIL reason so the scheduler can perform verify/red-verify, MB-SYNC, closure, failure handling, and dependent promotion.
</process>
