---
description: Декомпозиция фичи в implementation plan и атомарные задачи (waves).
status: active
---
# /prd-to-tasks — Feature → Implementation plan → JSON tasks

<objective>
Взять конкретную фичу (FT-XXX) и превратить её в:
- Implementation Plan
- schema-backed JSON task records (waves)
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

## 4) Нарежь на schema-backed tasks (waves)
JSON task records are the source of truth:
- `.memory-bank/schemas/task.schema.json`
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-<NNN>.task.json`

Создай или обнови отдельные `.task.json` файлы:
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

Минимальный JSON record (обязательно для `/autopilot` и `/autonomous`):
```json
{
  "id": "TASK-001",
  "title": "Short task title",
  "status": "planned",
  "wave": "W1",
  "feature": "FT-001",
  "reqs": ["REQ-001"],
  "depends_on": [],
  "touched_files": [],
  "risk": {
    "level": "low",
    "reasons": [],
    "red_verify_required": false
  },
  "gates": [
    {
      "name": "unit tests",
      "command": "npm test",
      "required": true
    }
  ],
  "verify": [],
  "docs": [],
  "evidence_required": [],
  "source_artifacts": [],
  "normative_inputs": [],
  "constraints": [],
  "invariants": [],
  "verification_targets": []
}
```

Required enums:
- `status`: `planned|ready|in_progress|blocked|done|failed`
- `risk.level`: `low|medium|high`

Эти ключи обязательны в task records; когда есть достаточно evidence и это реально помогает downstream deterministic execution, заполняй их содержимым:
- `source_artifacts`
- `normative_inputs`
- `constraints`
- `invariants`
- `verification_targets`

Важно:
- ключи обязательны, но значения могут быть пустыми массивами, если evidence нет
- не выдумывай содержимое без evidence из PRD / feature docs / baseline docs / contracts / states / runbooks
- markdown task cards are no longer source-of-truth task records

Обнови `.memory-bank/tasks/index.json` только ссылками:
```json
{
  "version": 1,
  "tasks": [
    {
      "id": "TASK-001",
      "file": "TASK-001.task.json"
    }
  ]
}
```

Затем обнови `.memory-bank/tasks/backlog.md` только как readable summary/router:
- таблица task id / title / status / wave / feature / record link
- без markdown task cards и без отдельного task-state

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
- после каждой фичи перечитай `tasks/index.json` и избегай дублирования `TASK-*`
- не запускай execution отсюда; только готовь autonomous-ready JSON task queue
</process>
