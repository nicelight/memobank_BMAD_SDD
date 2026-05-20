# Промпт для отдельного AI-агента

Твоя задача: вдумчиво, последовательно и без лишнего расширения scope реализовать изменение:

**«Перевести task cards из markdown в строгую schema-backed модель».**

## Контекст

Сейчас task planning использует `.memory-bank/tasks/backlog.md` и markdown task cards. Это плохо для AI-only разработки, потому что scheduler, `/autopilot` и `/autonomous` должны работать не по markdown-скрейпингу, а по строгим machine-readable task records.

## Цель

Заменить markdown task cards машинно проверяемыми JSON task records.

Главное правило: новая source-of-truth для задач должна быть не markdown, а структурированные task-файлы + schema.

## Предпочтительная модель

- `.memory-bank/tasks/index.json` — индекс задач.
- `.memory-bank/tasks/TASK-001.task.json` — отдельный task record.
- `.memory-bank/schemas/task.schema.json` — JSON Schema задачи.
- `.memory-bank/tasks/backlog.md` — только human-readable summary/router, не source-of-truth для scheduler.

## Почему JSON, а не YAML

- JSON можно валидировать без внешних зависимостей.
- Меньше риска неоднозначного парсинга.
- Лучше подходит для AI-only autonomous scheduler.

Не добавляй внешние npm-зависимости без крайней необходимости.

## Перед изменениями прочитай минимум

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

---

# Фаза 1 — дизайн и план

1. Опиши короткий implementation plan.
2. Явно зафиксируй:
   - какие файлы будут изменены;
   - какая структура task schema будет введена;
   - как будет убрана зависимость от markdown task cards и task-state в `backlog.md`;
   - какие проверки появятся в lint/CI;
   - что НЕ входит в scope.

3. Проанализируй план на возможные подводные камни и потенциальные проблемы во время реализации.
4. Можешь проконсультироваться со мной, чтобы закрыть возникшие highlights.

Не начинай массовые изменения, пока план не записан в:

`CHANGING_plan.md`

---

# Фаза 2 — schema и generated skeleton

Добавь в generated Memory Bank skeleton:

- `.memory-bank/schemas/task.schema.json`
- `.memory-bank/tasks/index.json`
- обновлённый `.memory-bank/tasks/backlog.md`

Минимальная структура `task.schema.json` должна описывать:

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

Обязательные enum:

- `status`: `planned | ready | in_progress | blocked | done | failed`
- `risk.level`: `low | medium | high`

`index.json` не должен дублировать всю задачу. Только ссылки:

    {
      "version": 1,
      "tasks": [
        {
          "id": "TASK-001",
          "file": "TASK-001.task.json"
        }
      ]
    }

---

# Фаза 3 — обновить command specs

Обнови инструкции команд так, чтобы они использовали новую модель.

## 1. `/prd-to-tasks`

Должна:

- создавать `.task.json` файлы;
- обновлять `index.json`;
- обновлять `backlog.md` только как readable summary;
- не делать markdown task card source-of-truth.

## 2. `/autopilot`

Должна:

- читать `tasks/index.json` и `.task.json`;
- если JSON-задач нет, останавливать scheduler с явной ошибкой;
- не полагаться на regex parsing markdown в новом режиме.

## 3. `/autonomous`

Должна:

- после `/prd-to-tasks --all` ожидать schema-backed tasks;
- terminal state и queue state должны ссылаться на JSON task records.

## 4. `/execute`

Должна:

- сначала читать `.task.json`;
- если task record отсутствует, останавливать выполнение с явной ошибкой;
- protocol files должны ссылаться на task record.

## 5. `/verify`

Должна:

- синхронизировать verdict/evidence с task record;
- PASS/FAIL должен обновлять `status` в `.task.json`.

## 6. `/mb-sync`

Должна:

- синхронизировать RTM, backlog и changelog с JSON task records.

---

# Фаза 4 — обновить `mb-lint`

Расширь:

`skills/mb-garden/assets/mb-lint.mjs`

Минимальные новые проверки:

- `.memory-bank/tasks/index.json` существует и является валидным JSON;
- все task files из `index.json` существуют;
- каждый `.task.json` валиден как JSON;
- каждый task имеет обязательные поля;
- `status` входит в допустимый enum;
- `risk.level` входит в допустимый enum;
- все `depends_on` ссылаются на существующие task IDs;
- нет dependency cycles;
- `done` task должен иметь хотя бы один verification/evidence marker;
- high-risk task должен иметь `risk.red_verify_required: true`;
- markdown task cards не должны использоваться как task records.

Не подключай JSON Schema validator package. Сделай lightweight structural validation в самом `mb-lint.mjs`.

---

# Фаза 5 — CI и smoke tests

Обнови:

`.github/workflows/release-check.yml`

Smoke test должен проверять:

- после `init-mb.js` есть `.memory-bank/schemas/task.schema.json`;
- есть `.memory-bank/tasks/index.json`;
- `node scripts/mb-lint.mjs` проходит;
- package install smoke test проходит.

---

# Фаза 6 — vendoring

После изменений в `_shared` проверь install-time vendoring через wrapper:

    node scripts/install-framework.mjs --skill '*' --yes

Рабочее дерево должно оставаться source-only: не оставляй generated `skills/*/{agents,references,scripts}/shared-*`.

`scripts/vendor-shared.mjs` запускается только внутри temporary/prepared copy. Если по ошибке запускаешь его локально, удали generated outputs и верни source-only hygiene к `0`.

---

# Фаза 7 — документация

Обнови user-facing docs кратко:

- `README.en.md`
- `README.ru.md`
- relevant `SKILL.md` files, если они явно говорят про markdown task cards.

Не переписывай весь README. Только точечно добавь, что:

- task records теперь schema-backed;
- `backlog.md` остаётся readable summary/router и не хранит task state;
- markdown task cards заменяются JSON task records.

---

# Фаза 8 — проверка

В конце обязательно выполни:

    node scripts/install-framework.mjs --skill '*' --yes
    find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
    git diff --exit-code || true
    node -c skills/_shared/scripts/init-mb.js
    node --check skills/mb-garden/assets/mb-lint.mjs

`find ... | wc -l` должен вернуть `0`. Если нужен ручной осмотр vendored outputs, используй temp install smoke (`MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes`) и проверяй prepared temporary copy, а не рабочее дерево.

Также сделай dry bootstrap в temp directory:

    TMP_DIR="$(mktemp -d)"
    cd "$TMP_DIR"
    node /path/to/repo/skills/_shared/scripts/init-mb.js
    mkdir -p scripts
    cp /path/to/repo/skills/mb-garden/assets/mb-lint.mjs scripts/mb-lint.mjs
    node scripts/mb-lint.mjs

Если test падает — исправь.

---

# Ограничения

- Не меняй общую архитектуру фреймворка сверх этой задачи.
- Не добавляй новые большие команды типа `mb-doctor`; это отдельная будущая задача.
- Не меняй license.
- Не устанавливай marketplace skills.
- Не делай deploy/publish.

---

# Definition of done

Готово только если:

- Generated repo получает `.memory-bank/schemas/task.schema.json`.
- Generated repo получает `.memory-bank/tasks/index.json`.
- `/prd-to-tasks` описывает создание `.task.json`.
- `/autopilot` и `/autonomous` описывают scheduler через JSON task records.
- `/execute` и `/verify` читают task record как primary source.
- `mb-lint` проверяет task records, dependencies и базовую consistency.
- CI smoke test обновлён.
- Vendored copies синхронизированы.
- `backlog.md` используется только как readable summary/router и не хранит task state.
- Markdown task cards не используются как формат задачи.

---

# Формат финального отчёта

В конце выдай отчёт:

1. Что изменено.
2. Какие файлы изменены.
3. Как теперь выглядит task schema.
4. Какие проверки добавлены.
5. Какие команды/тесты запущены и результат.
6. Риски и follow-up задачи.
