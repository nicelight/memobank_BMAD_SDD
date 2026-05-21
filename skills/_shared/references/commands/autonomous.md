---
description: Полный автономный прогон PRD → FT → TASKs → execute/verify/review до terminal state.
status: active
---
# /autonomous — End-to-end autonomous run

<objective>
Запустить **полный автономный цикл** без ожидания пользователя:
- intake PRD / delta
- построение L1–L3
- feature-level clarification gate
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

Если нужен **только JSON task queue executor**, а PRD → FT → TASK уже готовы, используй `/autopilot`.

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

Default pre-queue health check:
- до создания executable JSON task queue запусти `/mb-lint`, затем plain `/mb-doctor` using the repository's documented command or `node scripts/mb-doctor.mjs`
- pre-queue `/mb-doctor` is a health check only and must not require executable task records / ready queue
- не запускай `/mb-doctor --strict` до того, как `/prd-to-tasks --all` создаст queue

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

## 5) Clarification gate перед декомпозицией
Перед `/prd-to-tasks --all` все targeted features должны иметь:

```yaml
clarification_status: complete
```

Для каждой feature с `clarification_status: pending` запусти `/clarify FT-<NNN>` в autonomous mode, используя только evidence из PRD, product, requirements, feature doc и явно linked relevant docs.

Правила:
- не придумывай product decisions
- не создавай task records для pending features
- если `/clarify` требует ответа пользователя или находит blocking ambiguity, запиши blockers в `.protocols/AUTONOMOUS-RUN/status.md`, поставь terminal state `HALT_CLARIFICATION_REQUIRED` и остановись
- если metadata отсутствует, treat as clarification blocker and halt with `HALT_CLARIFICATION_REQUIRED`
- продолжай только когда все targeted features are `clarification_status: complete`

## 6) Декомпозиция всех фич
После clarification gate запусти:
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
  - `tier: T0|T1|T2|T3`
  - `gates`
  - `verify`
  - `docs`
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.

## 6.1) Review gate по JSON task records
Сразу после `/prd-to-tasks --all` и до scheduler execution запусти `/review` именно по task planning surface:
- `.memory-bank/tasks/index.json`
- all indexed `.memory-bank/tasks/*.task.json`
- per-feature implementation plans

Правило:
- если review даёт blocking `REJECT` по task records / waves / gates / dependencies / verify surface → исправь JSON task records и повтори `/review`
- если после 2–3 циклов всё ещё blocking `REJECT` → terminal state `HALT_REVIEW_REJECT`
- scheduler execution разрешён только после `APPROVE` или после явного решения, что оставшиеся non-blocking замечания не мешают запуску

## 6.2) Readiness gate
Перед scheduler execution запусти `/mb-lint`, затем `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`.

Правило:
- strict doctor is a post-queue gate: запускай его только после того, как `/prd-to-tasks --all` создал `.memory-bank/tasks/index.json` и indexed task records
- если doctor command/script отсутствует, падает, или возвращает readiness errors → terminal state `HALT_QUALITY_GATES`
- after task queue exists, required ordering is `mb-lint` + `mb-doctor --strict`; do not replace strict doctor with plain `mb-lint`
- pending/missing feature clarification or tasks linked to unclarified features are readiness errors
- strict doctor должен быть зелёным до первого task selection pass

## 7) Scheduler loop
Работай по `.memory-bank/tasks/index.json` и indexed `.task.json` records.
If JSON task records are missing or empty, set terminal state `HALT_DEPENDENCY_DEADLOCK` with reason `no schema-backed task records`.
If any indexed task record is missing `tier`, set terminal state `HALT_POLICY_VIOLATION` and stop.
Read the task queue and task metadata only from JSON task records.
Before task selection and before progression after each closed task, run `/mb-lint`, then `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`. Treat doctor absence, non-zero exit, or readiness errors as `HALT_QUALITY_GATES`.

### Status ownership

- `/autonomous` is the scheduler for the end-to-end run.
- `/autonomous` owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done`, `in_progress -> failed`, dependent block/unblock decisions, terminal queue state, and final run status.
- `/execute` owns implementation, local gates, progress, and handoff evidence only; it must not close/promote/block tasks in scheduler mode.
- `/verify` owns verification evidence/verdict only; it must not close tasks or block/promote dependents in scheduler mode.
- `/red-verify` owns semantic evidence/verdict only; it must not independently close tasks in scheduler mode.
- `/mb-sync` syncs the scheduler-provided closure/failure/blocking decision after verification; it must not independently advance dependents.

Перед каждым selection pass выполни promotion pass:
- `planned -> ready`, если все `depends_on` уже `done` и нет blockers / blocking review rejects / unresolved semantic-concern
- не продвигай задачу, если upstream failed/blocked, есть open blocking bug или task-level review reject
- запиши promotion в соответствующий `.task.json`

Выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocking review reject

Если после promotion pass `ready` пусто:
- и JSON task queue полностью закрыт → переходи к финальному review/success evaluation
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK` только после фиксации, какие dependencies/blockers/review rejects/semantic-concern помешали promotion

Правила очереди:
- независимые задачи (нет deps и shared files) можно запускать параллельно
- зависимые или shared-file задачи — только последовательно
- follow-up task, добавленная по итогам verify, должна попасть в **следующую итерацию того же run**

## 8) Execution loop per TASK
Для каждого выбранного `TASK-*`:
1) scheduler writes `ready -> in_progress`
2) `/execute TASK-<ID>`
3) verify by `task.tier` from the JSON record:
   - `T0` / `T1`: compact path is allowed; verification may be recorded in `.protocols/TASK-<ID>/run.md`
   - `T2` / `T3`: full protocol path is required; run `/verify TASK-<ID>`
   - `T3`: require exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`; no silent autonomous closure
4) run `/red-verify TASK-<ID>` if required by tier (`T2` / `T3`)
5) scheduler records the closure/failure/blocking decision from verification verdicts, then runs `/mb-sync` to synchronize that decision
6) scheduler writes final closure/failure/blocking status and dependent block/unblock decisions
7) run `/mb-lint`, then `/mb-doctor --strict` before promoting dependents

After `ready -> in_progress`, command order is exactly: `/execute` → `/verify` → `/red-verify` if required → `/mb-sync` → scheduler closure.

Переходы состояния:
- `ready -> in_progress`
- `in_progress -> done` for `T0` / `T1` при verification `VERDICT: PASS`
- `in_progress -> done` for `T2` / `T3` only after `/verify` `VERDICT: PASS` evidence and `/red-verify` `SEMANTIC_VERDICT: semantic-pass`
- `in_progress -> failed` при `VERDICT: FAIL` или `SEMANTIC_VERDICT: semantic-fail`
- `SEMANTIC_VERDICT: semantic-concern` is never normal `done`: set the task/dependents to `blocked` or require human review, and record owner/reason/follow-up evidence
- после `semantic-concern` не закрывай задачу и не продвигай dependents until a subsequent `/red-verify` returns `SEMANTIC_VERDICT: semantic-pass`
- downstream dependents → `blocked`, если upstream failed/blocking

Все переходы записывай в соответствующий `.task.json`. Queue state в `.protocols/AUTONOMOUS-RUN/status.md` должен ссылаться на task record paths, а не дублировать authoritative state.

## 9) Wave review
После завершения каждой wave:
- убедись, что все `semantic-concern` этой wave имеют явное решение (blocked status, human review required, or follow-up); без subsequent `semantic-pass` affected tasks are not closed
- обнови `.protocols/AUTONOMOUS-RUN/status.md`
- запусти `/mb-lint`, затем `/mb-doctor --strict`; если gate падает, не закрывай wave и не переходи к следующей wave
- запусти `/review`

Если доступны **оба** движка:
- prefer engine A for execution
- prefer engine B for final wave/final review
- не ревьюй критичный результат тем же freshest writer-context, если есть альтернатива

Если review после wave даёт blocking `REJECT`:
- исправь и повтори
- если budget исчерпан → `HALT_REVIEW_REJECT`

## 10) Failure budgets
Зафиксируй и соблюдай:
- `max_retries_per_task`
- `max_consecutive_failures`
- `max_open_blockers`
- `max_files_changed_per_task`

При превышении любого лимита:
- terminal state `HALT_FAILURE_BUDGET`

## 11) Terminal states
Финал должен быть **явным** в `.protocols/AUTONOMOUS-RUN/status.md`:

- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_CLARIFICATION_REQUIRED`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`

## 12) Success condition
Считай run завершённым только если:
- в JSON task records не осталось `ready` / `in_progress`
- все обязательные REQ/AC имеют `Lifecycle: verified`
- нет открытых blocking bugs / blockers
- latest `/review` = `APPROVE`
- latest `/mb-lint` + `/mb-doctor --strict` pass without readiness errors
</process>
