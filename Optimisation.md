Твоя задача: вдумчиво, последовательно и без лишнего расширения scope реализовать изменение:

“Перевести task cards из markdown в строгую schema-backed модель”.

## Контекст:
Сейчас workflow использует `.memory-bank/tasks/backlog.md` и markdown task cards. Это плохо для AI-only разработки, потому что scheduler/autopilot/autonomous должны работать не по markdown-скрейпингу, а по строгим machine-readable task records.

## Цель:
Сделать task cards машинно проверяемыми, сохранив обратную совместимость со старым markdown backlog.

Главное правило:
Новая source-of-truth для задач должна быть не markdown, а структурированные task-файлы + schema.

Предпочтительная модель:
- `.memory-bank/tasks/index.json` — индекс задач
- `.memory-bank/tasks/TASK-001.task.json` — отдельный task record
- `.memory-bank/schemas/task.schema.json` — JSON Schema задачи
- `.memory-bank/tasks/backlog.md` — только human-readable summary/router, не source-of-truth для scheduler

Почему JSON, а не YAML:
- JSON можно валидировать без внешних зависимостей
- меньше риска неоднозначного парсинга
- лучше подходит для AI-only autonomous scheduler

Не добавляй внешние npm-зависимости без крайней необходимости.

Перед изменениями прочитай минимум:
- `README.md`
- `README.en.md`
- `README.ru.md`
- `skills/_shared/scripts/init-mb.js`
- `skills/_shared/references/structure-template.md`
- `skills/_shared/references/commands/prd-to-tasks.md`
- `skills/_shared/references/commands/autopilot.md`
- `skills/_shared/references/commands/autonomous.md`
- `skills/_shared/references/commands/execute.md`
- `skills/_shared/references/commands/verify.md`
- `skills/_shared/references/commands/mb-sync.md`
- `skills/mb-garden/assets/mb-lint.mjs`
- `scripts/vendor-shared.mjs`
- `.github/workflows/release-check.yml`

Работай по фазам.

Фаза 1 — дизайн и план
1. Опиши короткий implementation plan.
2. Явно зафиксируй:
   - какие файлы будут изменены;
   - какая структура task schema будет введена;
   - как сохранится backward compatibility;
   - какие проверки появятся в lint/CI;
   - что НЕ входит в scope.

Не начинай массовые изменения, пока план не записан в `.protocols/TASK-TASK-SCHEMA/plan.md`.

Фаза 2 — schema и generated skeleton
Добавь в generated Memory Bank skeleton:
- `.memory-bank/schemas/task.schema.json`
- `.memory-bank/tasks/index.json`
- обновлённый `.memory-bank/tasks/backlog.md`

Минимальная структура `task.schema.json` должна поддерживать:

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
