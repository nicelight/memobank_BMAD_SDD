---
description: Полный автономный прогон PRD → FT → TASKs → execute/verify/review до terminal state.
status: active
---
# /autonomous — End-to-end autonomous run

<objective>
Запустить **полный автономный цикл** без ожидания пользователя:
- intake PRD / delta
- построение L1–L3
- декомпозиция всех FT в schema-backed JSON TASK records
- execution + verification + MB-SYNC
- промежуточные и финальные review-гейты
- завершение в явном terminal state
</objective>

<process>

## 0) Когда использовать
Используй эту команду, когда:
- есть `prd.md` или явный PRD-текст пользователя,
- нужен режим “запустил и ушёл”,
- разрешены автономные code-edit сессии через Codex / Claude CLI,
- не требуется ручной выбор одной фичи за раз.

Если нужен **только backlog executor**, а PRD → FT → TASK уже готовы, используй `/autopilot`.

## 1) Протокол автономного запуска
Создай:
- `.protocols/AUTONOMOUS-RUN/plan.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/decision-log.md`
- `.tasks/TASK-AUTONOMOUS/`

`status.md` должен содержать минимум:
- run metadata
- review gate
- blocking questions / assumptions
- queue state (`ready`, `in_progress`, `blocked`, `done`, `failed`)
- failure budget
- terminal state + reason

## 2) Preflight (не пропускай)
Проверь:
- `.memory-bank/` существует; если нет — сначала `/mb-init`
- доступен `prd.md` или PRD-текст
- есть хотя бы один исполнитель (`codex` или `claude`)
- есть policy-гейт: `.memory-bank/workflows/autonomy-policy.md`

Если в репозитории уже есть существенный код:
- сначала построй/обнови baseline через `/map-codebase`
- только потом накладывай PRD delta

Запреты по умолчанию:
- не устанавливай новые skills из marketplace без явного подтверждения
- не делай deploy / prod writes / secret reads
- не трогай инфраструктуру вне репозитория без явного allowlist

## 3) Intake PRD в автономном режиме
1) Если PRD упоминает tools / skills / CLIs:
   - запусти `/find-skills`
   - **автоиспользуй только уже установленные project skills**
   - отсутствующие skills только зафиксируй как рекомендацию
2) Построй L1–L3 через `/prd`.
3) Если есть пробелы:
   - **non-blocking** → зафиксируй в `.protocols/AUTONOMOUS-RUN/decision-log.md` как `Assumption`
   - **blocking** (security/compliance/payments/external contract/data loss) → поставь terminal state `HALT_BLOCKING_QUESTIONS` и остановись

## 4) Review gate после PRD
Сразу после L1–L3 запусти `/review`.

Правило:
- если есть `REJECT` с P0/P1 → исправь и повтори review
- если после 2–3 циклов всё ещё `REJECT` → terminal state `HALT_REVIEW_REJECT`
- batch execution разрешён **только после `APPROVE`**

## 5) Декомпозиция всех фич
Запусти:
- `/prd-to-tasks --all`

Требование:
- `.memory-bank/tasks/index.json` must list schema-backed task records
- each indexed `.memory-bank/tasks/TASK-<NNN>.task.json` must contain:
  - `id`
  - `title`
  - `status: planned|ready|in_progress|blocked|done|failed`
  - `wave`
  - `feature`
  - `reqs`
  - `depends_on`
  - `touched_files`
  - `risk.level: low|medium|high`
  - `gates`
  - `verify`
  - `docs`
- `.memory-bank/tasks/backlog.md` may be refreshed as a readable summary/router only

## 6) Scheduler loop
Работай по `.memory-bank/tasks/index.json` и indexed `.task.json` records.
Do not regex-scrape markdown task cards from `.memory-bank/tasks/backlog.md`.
If JSON task records are missing or empty, set terminal state `HALT_DEPENDENCY_DEADLOCK` with reason `no schema-backed task records`.

Выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocking review reject

Правила очереди:
- независимые задачи (нет deps и shared files) можно запускать параллельно
- зависимые или shared-file задачи — только последовательно
- follow-up task, добавленная по итогам verify, должна попасть в **следующую итерацию того же run**

## 7) Execution loop per TASK
Для каждого выбранного `TASK-*`:
1) `/execute TASK-<ID>`
2) `/verify TASK-<ID>`
3) `/red-verify TASK-<ID>` для рискованных по существу задач
4) `/mb-sync`

Переходы состояния:
- `ready -> in_progress`
- `in_progress -> done` при `VERDICT: PASS` и отсутствии `semantic-fail`
- `in_progress -> failed` при `VERDICT: FAIL` или `SEMANTIC_VERDICT: semantic-fail`
- downstream dependents → `blocked`, если upstream failed/blocking

Все переходы записывай в соответствующий `.task.json`. Queue state в `.protocols/AUTONOMOUS-RUN/status.md` должен ссылаться на task record paths, а не дублировать authoritative state.

## 8) Wave review
После завершения каждой wave:
- обнови `.protocols/AUTONOMOUS-RUN/status.md`
- запусти `/review`

Если доступны **оба** движка:
- prefer engine A for execution
- prefer engine B for final wave/final review
- не ревьюй критичный результат тем же freshest writer-context, если есть альтернатива

Если review после wave даёт blocking `REJECT`:
- исправь и повтори
- если budget исчерпан → `HALT_REVIEW_REJECT`

## 9) Failure budgets
Зафиксируй и соблюдай:
- `max_retries_per_task`
- `max_consecutive_failures`
- `max_open_blockers`
- `max_files_changed_per_task`

При превышении любого лимита:
- terminal state `HALT_FAILURE_BUDGET`

## 10) Terminal states
Финал должен быть **явным** в `.protocols/AUTONOMOUS-RUN/status.md`:

- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`

## 11) Success condition
Считай run завершённым только если:
- в JSON task records не осталось `ready` / `in_progress`
- все обязательные REQ/AC имеют `Lifecycle: verified`
- нет открытых blocking bugs / blockers
- последний `review` = `APPROVE`
</process>
