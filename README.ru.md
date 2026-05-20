# memobank

`memobank` — это набор skills для Codex CLI, Claude Code, OpenCode и похожих agent runtimes.

Он превращает репозиторий в рабочее пространство для AI-first разработки с тремя постоянными слоями:
- `.memory-bank/` для долговременного знания о проекте
- `.protocols/` для возобновляемых планов, прогресса и состояния верификации
- `.tasks/` для runtime-артефактов, которые производят агенты и сабагенты

Практическая цель проста: агент должен уметь работать долго без потери контекста, а человек должен уметь понять, что произошло, по файлам, а не по истории чата.

## Что изменилось в текущем проекте

Текущий `memobank` больше не является только duo-doc системой вокруг `architecture/ + guides/`.
Теперь он использует многослойную и обратно совместимую модель:
- классические duo docs остаются валидными и поддерживаемыми
- явный нормативный слой может быть задан через `spec-index.md`, `glossary.md`, `invariants.md`, `contracts/*`, `states/*`, `runbooks/*` и `testing/*`
- более богатые planning и verification inputs поддерживаются, если они есть
- старые репозитории с классической минимальной моделью должны продолжать работать

Это additive-эволюция, а не разрушительный rewrite.
Репозиторий должен поддерживать оба варианта:
- старые duo-doc-first Memory Bank
- новые richer spec-driven Memory Bank

## Базовая модель

Текущая структура Memory Bank организована в три слоя.

### Layer A: классические concept docs
- `.memory-bank/architecture/` для WHAT и WHY
- `.memory-bank/guides/` для HOW

### Layer B: явные нормативные docs
- `.memory-bank/spec-index.md`
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/contracts/`
- `.memory-bank/states/`
- `.memory-bank/runbooks/`
- `.memory-bank/testing/`

### Layer C: planning и execution state
- `.memory-bank/epics/`
- `.memory-bank/features/`
- `.memory-bank/tasks/`
- `.protocols/`
- `.tasks/`

Ключевое правило простое: richer docs усиливают source-of-truth routing, но не делают рабочие duo docs невалидными.

## Что входит в набор

### Package skills
- `cold-start` — all-in-one bootstrap для greenfield и brownfield репозиториев
- `mb-init` — только skeleton и генерация команд
- `mb-from-prd` — PRD-driven planning в product, requirements, epics и features
- `mb-map-codebase` — маппинг существующего репозитория в as-is docs Memory Bank
- `mb-execute` — исполнение одной `TASK-*` через возобновляемый протокол
- `mb-verify` — проверка одной `TASK-*` по acceptance criteria и evidence
- `mb-red-verify` — adversarial semantic verification одной `TASK-*`
- `mb-review` — fresh-context review со специализированными reviewer prompts
- `mb-garden` — lint и сопровождение консистентности Memory Bank
- `mb-harness` — документация для deterministic gates, worktrees и agent-safe workflows

### Генерируемые project commands
После запуска `cold-start` или `mb-init` внутри целевого репозитория `memobank` создаёт command specs в `.memory-bank/commands/` и публикует их через runtime-native proxy skills.

Текущий набор команд:
- `/cold-start`
- `/mb`
- `/mb-init`
- `/prd`
- `/mb-from-prd`
- `/prd-to-tasks`
- `/execute`
- `/mb-execute`
- `/verify`
- `/mb-verify`
- `/red-verify`
- `/mb-red-verify`
- `/review`
- `/mb-review`
- `/map-codebase`
- `/mb-map-codebase`
- `/mb-sync`
- `/mb-garden`
- `/mb-harness`
- `/autopilot`
- `/autonomous`
- `/discuss`
- `/add-tests`
- `/find-skills`
- `/find-skill`

## Как это работает

### 1. Bootstrap репозитория
`skills/_shared/scripts/init-mb.js` инициализирует репозиторий и создаёт:
- `.memory-bank/`
- `.tasks/`
- `.protocols/`
- `AGENTS.md`
- `CLAUDE.md` и `GEMINI.md` как symlink-or-copy companions
- `.memory-bank/commands/*.md`
- `.claude/skills/*` proxy skills
- `.agents/skills/*` proxy skills

Сгенерированный skeleton Memory Bank включает текущую layered structure:
- `architecture/`
- `guides/`
- `adrs/`
- `tech-specs/`
- `domains/`
- `contracts/`
- `states/`
- `runbooks/`
- `workflows/`
- `quality/`
- `testing/`
- `skills/`
- `epics/`
- `features/`
- `schemas/`
- `tasks/`
- `commands/`
- `agents/`
- `archive/`
- `bugs/`

Также создаются базовые routing files, такие как `.memory-bank/index.md`, `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md`, `.memory-bank/glossary.md`, `.memory-bank/invariants.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/testing/index.md`, `.memory-bank/schemas/task.schema.json`, `.memory-bank/tasks/index.json` и `.memory-bank/tasks/backlog.md`.

Fresh skeleton bootstrap не создает runnable task records. По умолчанию `.memory-bank/tasks/index.json` стартует как `{ "version": 1, "tasks": [] }`; `/prd-to-tasks` создает индексированные `.memory-bank/tasks/TASK-*.task.json` records после появления PRD/features.

### 2. Роутинг в нужный workflow
`cold-start` — главный entry point, который выбирает правильный путь:
- Greenfield: старт от `prd.md` или requirements text
- Brownfield: сначала маппинг текущего codebase в as-is docs
- Skeleton-only: инициализация структуры и остановка до следующего planning step

### 3. Планирование по feature, а не гигантским backlog одним проходом
Нормальный planning loop выглядит так:
- `/prd`
- `/prd-to-tasks FT-001`
- `/execute TASK-001`
- `/verify TASK-001`
- `/red-verify TASK-001` для рискованных семантических изменений
- `/mb-sync`
- `/review` при необходимости

Для существующих codebase brownfield entry выглядит так:
- `/map-codebase`
- затем PRD delta или change-planning work

Планирование теперь богаче, но по-прежнему обратно совместимо:
- если есть structured inputs, такие как source artifacts, normative inputs, constraints, invariants или verification targets, planner может их использовать
- если их нет, классический минимальный feature и requirements flow остаётся валидным
- task state хранится в schema-backed JSON records `.memory-bank/tasks/*.task.json`, индексированных через `.memory-bank/tasks/index.json`; fresh skeleton стартует с пустого индекса до создания records через `/prd-to-tasks`
- `.memory-bank/tasks/backlog.md` является только human-readable summary/router и не должен использоваться как scheduler state
- `/prd` по-прежнему не должен бездумно выпускать весь implementation backlog за один проход
- `/prd-to-tasks` остаётся шагом per-feature decomposition и отвечает за создание task records

### 4. Исполнение через возобновляемые file protocols
У каждой задачи может быть protocol folder вроде `.protocols/TASK-123/`, содержащий:
- `context.md`
- `plan.md`
- `progress.md`
- `verification.md`
- `handoff.md`

Это делает исполнение задач возобновляемым между fresh sessions, разными engines и review passes.

Execution и verification теперь следуют явной fallback-модели:
1. richer structured inputs, если они есть
2. классическая база feature, requirements и RTM
3. duo docs
4. связанные normative docs, если нужно

Это значит, что richer fields поддерживаются, но не становятся скрыто обязательными.
Markdown task cards заменены JSON task records для authoritative task state. Эти records создаются через `/prd-to-tasks`, а не PRD-less bootstrap.

### 4.1. Adversarial semantic verification
Помимо обычного `/verify`, в `memobank` теперь есть отдельный semantic-pass:
- `/red-verify TASK-123`
- `/mb-red-verify TASK-123`

Его задача — не повторять process checks, а ловить случаи "формально всё прошло, но решение по существу неверно".

Этот проход нужен, когда:
- acceptance criteria можно закрыть узко и при этом промахнуться мимо реального intent
- изменение задевает `contracts/*`, `states/*`, миграции, схемы, data behavior
- задача пересекает feature/module boundaries
- меняется runtime или API behavior
- решение может быть локально корректным, но системно вредным
- есть риск architectural drift или скрытой future maintenance cost

Разделение ответственности:
- `/verify` проверяет task completion по AC/REQ и evidence
- `/review` проверяет Memory Bank, planning surface и fresh-context quality gate
- `/red-verify` задаёт hostile вопрос: "это решение действительно правильно по существу?"

`/red-verify` намеренно стартует не с полного spec surface, а с:
1. task intent
2. реального diff / code changes / behavior changes
3. tests и runtime evidence
4. только потом — reconciliation со specs

Это снижает риск shallow confirmation, когда verifier слишком доверяет тем же assumptions, что и implementer.

Результат semantic-pass фиксируется отдельно, обычно в:
- `.protocols/TASK-123/red-verification.md`

Рекомендуемые verdicts:
- `semantic-pass`
- `semantic-concern`
- `semantic-fail`

Практическое место в loop:
- `/execute TASK-123`
- `/verify TASK-123`
- `/red-verify TASK-123` для рискованных задач
- `/mb-sync`

### 5. Review и maintenance
Текущая политика review и garden опирается на concept coverage, а не только на pair-only model.

Концепт считается документированным приемлемо, если выполняется одно из условий:
- у него есть классическая поддержка `architecture + guides`
- у него есть эквивалентное покрытие через richer spec-driven layer
- есть оба слоя одновременно

Это важно, потому что `review`, `mb-sync` и `mb-garden` не должны отклонять репозиторий только из-за отсутствия строгой duo-only surface.

## Поддерживаемые runtimes

- Codex CLI читает project skills из `.agents/skills/`
- Claude Code читает project skills из `.claude/skills/`
- OpenCode может использовать оба варианта

`.codex/` предназначен для project configuration Codex. Это не каталог skills.

## Установка из source-only форка

Важно: для этого форка не используй `npx skills add <repo>` напрямую. Репозиторий хранится в source-only виде, поэтому правильная точка входа — installer wrapper из этого пакета.

Устанавливай только то, что нужно:

```bash
npx github:<owner>/<repo> --skill cold-start --global --yes
npx github:<owner>/<repo> --skill mb-init --global --yes
npx github:<owner>/<repo> --skill mb-from-prd --global --yes
```

Установка полного набора:

```bash
npx github:<owner>/<repo> --skill '*' --global --yes
```

Для локального клона:

```bash
node scripts/install-framework.mjs --skill '*' --global --yes
```

Инсталлятор сохраняет репозиторий source-only: он генерирует vendored `shared-*` файлы во временной копии и передает эту подготовленную копию в `skills add`.

Что происходит во время установки:
- создаётся временная копия репозитория;
- во временной копии запускается `scripts/vendor-shared.mjs`;
- недостающие `agents/shared-*`, `references/shared-*`, `scripts/shared-*` раскладываются внутрь каждого package skill;
- затем wrapper вызывает `npx -y skills add <prepared-temp-repo> ...`;
- после установки временная копия удаляется;
- рабочий репозиторий остаётся source-only, без закоммиченных generated `shared-*` файлов.

На практике большинство пользователей начинают с:
- `cold-start` как all-in-one entry point
- или `mb-init` плюс `mb-from-prd` и `mb-map-codebase` для modular workflow

## Быстрый старт

### Новый репозиторий с PRD
Запусти `cold-start`, затем следуй обычному циклу:

```text
/prd
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/red-verify TASK-001   # опционально, но рекомендуется для рискованных/cross-boundary изменений
/mb-sync
```

Если JSON task queue / task records уже подготовлены и репозиторий готов к batch execution:

```text
/autopilot
```

Если нужен полный unattended run от PRD до terminal state:

```text
/autonomous
```

### Существующий репозиторий без PRD
Запусти `cold-start` и перейди в brownfield mapping:

```text
/map-codebase
```

Это сначала создаёт as-is Memory Bank documentation, а потом останавливается в правильной точке для PRD delta или change-request planning.

## Interactive vs autonomous режимы

### Interactive mode
Используй этот режим, если нужны явные checkpoints:
- по одной feature за раз
- по одной task за раз
- review между волнами

### Autonomous mode
Используй этот режим, если хочешь, чтобы один запуск продолжался до ясного terminal state.

Ожидается, что `/autonomous`:
- читает PRD
- явно фиксирует assumptions и open questions
- останавливается на blocking gaps
- строит L1-L3 docs Memory Bank
- декомпозирует работу в tasks
- исполняет и верифицирует task waves
- синхронизирует Memory Bank по мере выполнения

## Clean-session task execution

Каждая `TASK-*` может исполняться в свежей CLI session.

### Codex
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

### Claude
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

Независимые задачи можно запускать параллельно. Задачи с зависимостями или пересекающимися файлами должны идти последовательно.

## Сопровождение Memory Bank

`memobank` включает deterministic maintenance path:
- `/mb-sync` для выравнивания Memory Bank с завершённой работой
- `/mb-garden` для lint и cleanup структуры Memory Bank
- `skills/mb-garden/assets/mb-lint.mjs` для механических проверок вроде required files, frontmatter, metadata hygiene и broken links

Модель сопровождения намеренно file-based и audit-friendly.

## Shared assets и vendoring

`skills/_shared/` — источник истины для shared prompts, references и scripts.

Перед релизом `scripts/vendor-shared.mjs` вендорит эти shared assets в каждый installable package skill как плоские companion files, например:
- `agents/shared-*.md`
- `references/shared-*.md`
- `scripts/shared-*.js`

Это делает top-level skills self-contained для `skills add`, сохраняя единый shared source внутри репозитория.

В source-only модели репозитория эти `shared-*` файлы считаются generated artifacts и не должны коммититься. CI генерирует их перед smoke-тестом установки package skills.

## Структура репозитория

```text
skills/
  _shared/
  cold-start/
  mb-init/
  mb-from-prd/
  mb-map-codebase/
  mb-execute/
  mb-verify/
  mb-red-verify/
  mb-review/
  mb-garden/
  mb-harness/
scripts/
  vendor-shared.mjs
.tmp.changes/
  changes.md
```

## Использование bootstrap script

```bash
node skills/_shared/scripts/init-mb.js
node skills/_shared/scripts/init-mb.js --sync
```

`--sync` обновляет сгенерированные command specs и proxy skills в уже инициализированном репозитории, не перезаписывая остальную часть Memory Bank.

## Полезные указатели по документации

- `skills/_shared/references/structure-template.md` - generated skeleton structure и core templates
- `skills/_shared/references/commands/*.md` - command specs как source of truth
- `skills/_shared/scripts/init-mb.js` - bootstrap и sync logic
- `skills/mb-garden/assets/mb-lint.mjs` - deterministic Memory Bank lint
- `scripts/vendor-shared.mjs` - vendoring pipeline для package skills
- `.tmp.changes/changes.md` - high-level record additive transition архитектуры

## License

MIT - см. `LICENSE`.
