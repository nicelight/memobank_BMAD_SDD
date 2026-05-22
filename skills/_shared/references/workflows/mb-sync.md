# MB-SYNC — Memory Bank synchronization workflow

## Когда запускать
- После scheduler-provided closure/failure/blocking decision (`/autopilot` / `/autonomous`) и выполнения required `/verify` / `/red-verify` gates.
- После manual `/verify`, если он изменил durable task/docs state.
- После `/red-verify`, если выполнялась семантическая adversarial-проверка и она изменила или требует reconcile task/docs state.
- После значимых рефакторингов или архитектурных изменений.
- Перед `/review` (чтобы reviewer видел актуальное состояние).
- При ощущении drift между кодом и документацией.

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

## Чеклист

### 1) Concept support consistency
- [ ] Если используется классическая duo-модель, каждый `architecture/<concept>.md` имеет парный `guides/<concept>.md` (и наоборот).
- [ ] Взаимные ссылки между duo docs актуальны, если используется классическая пара.
- [ ] Если используются spec-driven support docs, они явно маршрутизированы через `spec-index.md` и не противоречат `architecture/*`, `guides/*`, `contracts/*`, `states/*`, `runbooks/*`, `testing/*`.

### 2) RTM (traceability)
- [ ] `requirements.md` RTM таблица отражает реальный `Lifecycle` (planned/implemented/verified).
- [ ] Нет REQ без привязки к Epic/Feature.
- [ ] Нет Feature без привязки к REQ.

### 3) Entity lifecycle vs document status
- [ ] У feature/epic **document `status`** остаётся в допустимой таксономии (`draft|active|deprecated|archived`).
- [ ] У feature/epic **`lifecycle`** отражает реальную стадию реализации (`planned|implemented|verified`).
- [ ] Acceptance criteria не расходятся с реализацией.

### 4) Task registry
- [ ] `.memory-bank/tasks/index.json` отражает актуальный набор задач.
- [ ] `.memory-bank/tasks/TASK-*.task.json` records отражают актуальные статусы задач.
- [ ] Новые задачи (из багов, из новых требований) добавлены как schema-backed task records.

### 5) Changelog
- [ ] `.memory-bank/changelog.md` содержит запись о текущей wave/change.
- [ ] Формат: `## [YYYY-MM-DD] Wave N / описание` → список изменений.

### 6) Lint
- [ ] `node scripts/mb-lint.mjs` — 0 errors.
- [ ] Все `.memory-bank/**/*.md` имеют frontmatter.
- [ ] Ссылки не битые.

### 7) Index
- [ ] `.memory-bank/index.md` содержит аннотированные ссылки на все новые/изменённые документы.
- [ ] Router-индексы в папках с >3 документами присутствуют.

## Формат changelog

```markdown
---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [YYYY-MM-DD] Wave N — краткое описание
- Added: ...
- Updated: ...
- Fixed: ...
- Removed: ...
```

## Если что-то не проходит
1. Исправь проблему немедленно (пока контекст свеж).
2. Если исправление нетривиально — создай schema-backed task record и обнови `.memory-bank/tasks/index.json`.
3. В interactive режиме можно отметить partial sync в `changelog.md`.
4. В autonomous режиме partial sync недопустим: остановись с `HALT_QUALITY_GATES`.
