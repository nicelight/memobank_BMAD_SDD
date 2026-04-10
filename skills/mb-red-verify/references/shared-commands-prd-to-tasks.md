---
description: Декомпозиция фичи в implementation plan и атомарные задачи (waves).
status: active
---
# /prd-to-tasks — Feature → Implementation plan → Backlog

<objective>
Взять конкретную фичу (FT-XXX) и превратить её в:
- Implementation Plan
- атомарные задачи (waves)
- критерии done + тесты + verify
</objective>

<process>

## 0) Вход
Ожидается `$ARGUMENTS`:
- `FT-<NNN>` для одной фичи
- `--all` для декомпозиции всех `FT-*` по приоритету

Если аргумент не дан:
- interactive → попроси выбрать фичу
- autonomous → используй `--all`

## 1) Создай протокол фичи
- `.protocols/FT-<NNN>/plan.md`
- `.protocols/FT-<NNN>/decision-log.md`

## 2) Прочитай контекст
- `.memory-bank/features/FT-<NNN>-*.md`
- соответствующий epic
- requirements RTM

## 3) Напиши Implementation Plan
Создай `.memory-bank/tasks/plans/IMPL-FT-<NNN>.md`:
- цели
- шаги
- expected touched files
- тесты
- гейты качества
- UAT steps

Если в feature doc уже есть richer spec-driven inputs, **предпочитай** включить их в план:
- `Source Artifacts`
- `Normative Inputs`
- `Constraints`
- `Invariants`
- `Verification Targets`

Если этих секций нет:
- не считай это ошибкой
- используй классический вход: feature doc + epic + RTM + duo docs

## 4) Нарежь на tasks (waves)
Обнови `.memory-bank/tasks/backlog.md`:
- Wave 1: low-risk / foundation
- Wave 2: core logic
- Wave 3: integration & polish

Правила:
- каждая задача должна быть достаточно маленькой (обычно 1–2 часа)
- каждая задача описывает:
  - что сделать
  - какие файлы трогаем
  - какие тесты написать
  - как проверить
  - какие MB документы обновить (Docs First)

Формат **task card** (обязательно для `/autopilot` и `/autonomous`):
- `TASK-ID: TASK-...`
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Feature: FT-...`
- `REQs: REQ-...`
- `Depends on: TASK-... | none`
- `Touched files: ...`
- `Tests: ...`
- `Verify: ...`
- `Docs: ...`

Опционально, когда есть достаточно evidence и это реально помогает downstream deterministic execution, добавляй:
- `Source Artifacts: ...`
- `Normative Inputs: ...`
- `Constraints: ...`
- `Invariants: ...`
- `Verification Targets: ...`

Важно:
- эти поля **рекомендуемы, но не обязательны**
- не выдумывай их без evidence из PRD / feature docs / baseline docs / contracts / states / runbooks
- минимальные task cards старого формата остаются валидными

Правила ready-state:
- foundation tasks без deps могут стартовать как `ready`
- downstream tasks по умолчанию `planned`
- `ready` выставляй только если все prerequisites уже выполнены или отсутствуют

## 5) Gate
Перед `execute`:
- проверь что acceptance criteria из FT покрыты задачами
- обнови RTM при необходимости
- если richer fields были добавлены, проверь что они не противоречат feature doc и RTM

Если используется `--all`:
- пройдись по всем `FT-*` в порядке приоритета
- после каждой фичи перечитай backlog и избегай дублирования `TASK-*`
- не запускай execution отсюда; только готовь autonomous-ready backlog
</process>
