# memobank

`memobank` — это набор skills для Codex CLI, Claude Code, OpenCode и похожих agent runtimes.

Он превращает репозиторий в рабочее пространство для AI-first разработки с тремя постоянными слоями:
- `.memory-bank/` для долговременного знания о проекте
- `.protocols/` для возобновляемых планов, прогресса и состояния верификации
- `.tasks/` для runtime-артефактов, которые производят агенты и сабагенты

Практическая цель проста: агент должен уметь работать долго без потери контекста, а человек должен уметь понять, что произошло, по файлам, а не по истории чата.

## Что изменилось в текущем проекте

Текущий `memobank` больше не является только duo-doc системой вокруг `architecture/ + guides/`.
Теперь он использует многослойную модель со строгим JSON task state:
- классические duo docs остаются валидными и поддерживаемыми
- `.memory-bank/constitution.md` задаёт короткие project governing principles для решений агентов
- явный нормативный слой может быть задан через `spec-index.md`, `glossary.md`, `invariants.md`, `contracts/*`, `states/*`, `runbooks/*` и `testing/*`
- более богатые planning и verification inputs поддерживаются, если они есть
- task execution state хранится только в JSON: `tasks/index.json` плюс индексированные `TASK-*.task.json` records
- каждый task record использует обязательное `tier: T0|T1|T2|T3`

Модель документации остаётся additive. Модель задач намеренно строгая и machine-readable.

## Базовая модель

Текущая структура Memory Bank организована в три слоя.

### Layer A: классические concept docs
- `.memory-bank/architecture/` для WHAT и WHY
- `.memory-bank/guides/` для HOW

### Layer B: явные нормативные docs
- `.memory-bank/constitution.md`
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
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-*.task.json`
- `.protocols/`
- `.tasks/`

Ключевое правило простое: richer docs усиливают source-of-truth routing, но не делают рабочие duo docs невалидными.
Constitution — это документ governing principles проекта. `/constitution` создаёт или обновляет его, агенты читают его рано во время priming, и он не заменяет `invariants.md`, `contracts/*` или `spec-index.md`.
Сгенерированный `AGENTS.md` — это только bootstrap и command router для агентов. Он направляет агентов к Constitution и файлам Memory Bank; сам он не является Constitution.

## Что входит в набор

### Package skills
- `cold-start` — all-in-one bootstrap для greenfield и brownfield репозиториев
- `mb-init` — только skeleton и генерация команд
- `mb-analysis` — optional upstream discovery: роутинг идеи, brainstorming и product brief перед PRD
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
- `/analysis`
- `/brainstorm`
- `/brief`
- `/constitution`
- `/prd`
- `/mb-from-prd`
- `/clarify`
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
- `/mb-doctor`
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

Сгенерированный `AGENTS.md` содержит Orchestrator Mode. Если top-level агенту не задана другая явная роль, он действует как orchestrator: планирует, проверяет scope и риски, делегирует implementation и verification, и маршрутизирует работу через Memory Bank, а не через историю чата как source of truth.

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

Также создаются базовые routing files, такие как `.memory-bank/index.md`, `.memory-bank/constitution.md`, `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md`, `.memory-bank/glossary.md`, `.memory-bank/invariants.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/testing/index.md`, `.memory-bank/workflows/tier-policy.md`, `.memory-bank/schemas/task.schema.json` и `.memory-bank/tasks/index.json`.

Fresh skeleton bootstrap не создает runnable task records. По умолчанию `.memory-bank/tasks/index.json` стартует как `{ "version": 1, "tasks": [] }`; `/prd-to-tasks` создает индексированные `.memory-bank/tasks/TASK-*.task.json` records после появления PRD/features.
Markdown task list не генерируется: tooling читает JSON registry и task records напрямую.

### 2. Роутинг в нужный workflow
`cold-start` — главный entry point, который выбирает правильный путь:
- Idea-only: при необходимости `/analysis`, затем `/brainstorm` и `/brief` перед `/prd`
- Clear concept: при необходимости `/brief`, затем `/prd`
- Existing PRD: старт от `prd.md` или requirements text и запуск `/prd`
- Brownfield: сначала маппинг текущего codebase в as-is docs
- Skeleton-only: инициализация структуры и остановка до следующего planning step

Analysis — optional discovery перед PRD. Он помогает превратить сырую идею или понятный концепт в лучший вход для PRD, но не заменяет `/clarify`: после `/prd` каждая feature всё равно проходит `/clarify FT-<NNN>` перед `/prd-to-tasks FT-<NNN>`.

### 3. Планирование по feature, а не гигантской task queue одним проходом
Нормальный planning loop выглядит так:
- `/prd`
- `/clarify FT-001`
- `/prd-to-tasks FT-001`
- `/execute TASK-001`
- `/verify TASK-001`
- `/red-verify TASK-001` для задач T2/T3
- `/mb-sync`
- `/review` при необходимости

Для существующих codebase brownfield entry выглядит так:
- `/map-codebase`
- затем PRD delta или change-planning work

Планирование теперь богаче, но механически строгое:
- если есть structured inputs, такие как source artifacts, normative inputs, constraints, invariants или verification targets, planner может их использовать
- если их нет, классический минимальный feature и requirements flow остаётся валидным
- task state хранится в schema-backed JSON records `.memory-bank/tasks/*.task.json`, индексированных через `.memory-bank/tasks/index.json`; fresh skeleton стартует с пустого индекса до создания records через `/prd-to-tasks`
- каждый task record должен содержать `tier: T0|T1|T2|T3`; execution routing authoritative только через `task.tier`
- `.memory-bank/tasks/backlog.md` и markdown task cards являются obsolete и не поддерживаются как workflow artifacts
- старая модель `risk` / `risk.level` удалена и невалидна
- `/prd` по-прежнему не должен бездумно выпускать всю implementation task queue за один проход
- `/prd-to-tasks` остаётся шагом per-feature decomposition и отвечает за создание task records

### 4. Исполнение через возобновляемые file protocols
У каждой задачи может быть protocol folder вроде `.protocols/TASK-123/`, содержащий:
- `context.md`
- `plan.md`
- `progress.md`
- `verification.md`
- `handoff.md`

Это делает исполнение задач возобновляемым между fresh sessions, разными engines и review passes.
T0/T1 задачи могут использовать compact `.protocols/TASK-123/run.md`; T2/T3 требуют полный protocol files. T3 также требует human-aware checkpoint и rollback/recovery note.

Execution и verification теперь следуют явной fallback-модели:
1. richer structured inputs, если они есть
2. классическая база feature, requirements и RTM
3. duo docs
4. связанные normative docs, если нужно

Это значит, что richer fields поддерживаются, но не становятся скрыто обязательными.
Authoritative task state хранится в JSON task records, которые создаются через `/prd-to-tasks`, а не PRD-less bootstrap.

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

Политика закрытия:
- `semantic-pass` разрешает обычное закрытие, если `/verify` тоже прошёл
- `semantic-fail` переводит задачу в failed
- `semantic-concern` не является normal done; он блокирует закрытие или требует human review и follow-up до продвижения dependents

Практическое место в loop:
- `/execute TASK-123`
- `/verify TASK-123`
- `/red-verify TASK-123` для задач T2/T3
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
npx github:<owner>/<repo> --skill mb-analysis --global --yes
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
- или `mb-init` плюс `mb-analysis`, `mb-from-prd` и `mb-map-codebase` для modular workflow

## Быстрый старт

### Новый репозиторий с PRD
Запусти `cold-start`, затем следуй обычному циклу:

```text
/prd
/clarify FT-001
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/red-verify TASK-001   # обязательно для задач T2/T3
/mb-sync
```

### Минимальные flows
Используй только путь, который соответствует стартовой точке:

```text
Idea-only:
/analysis
/brainstorm
/brief
/prd
/clarify FT-001
/prd-to-tasks FT-001

Clear concept:
/brief
/prd
/clarify FT-001
/prd-to-tasks FT-001

Existing PRD:
/prd
/clarify FT-001
/prd-to-tasks FT-001

Brownfield:
/map-codebase
/brief --delta or /prd --delta
/clarify FT-001
/prd-to-tasks FT-001
```

Analysis-команды optional и находятся upstream от PRD. Они не создают implementation task records и не обходят feature clarification.

Если JSON task queue / task records уже подготовлены и репозиторий готов к batch execution:

```text
/autopilot
```

Если нужен полный unattended run от PRD до terminal state:

```text
/autonomous
```

Запускай deterministic readiness gates на правильной фазе:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs          # pre-queue / fresh skeleton health check
node scripts/mb-doctor.mjs --strict # после /prd-to-tasks, перед scheduler/autopilot execution
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
Агент должен прочитать `AGENTS.md`, indexed JSON task record и protocol path, выбранный по `task.tier`:
- `T0` / `T1`: можно использовать compact `.protocols/TASK-123/run.md`
- `T2` / `T3`: полный `.protocols/TASK-123/{context,plan,progress,verification,handoff}.md`

### Codex
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/tasks/TASK-123.task.json, and the tier-selected protocol path. Implement only scoped changes.'
```

### Claude
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/tasks/TASK-123.task.json, and the tier-selected protocol path. Implement only scoped changes.'
```

Независимые задачи можно запускать параллельно. Задачи с зависимостями или пересекающимися файлами должны идти последовательно.

## Сопровождение Memory Bank

`memobank` включает deterministic maintenance path:
- `/mb-sync` для выравнивания Memory Bank с завершённой работой
- `/mb-garden` для lint и cleanup структуры Memory Bank
- `skills/mb-garden/assets/mb-lint.mjs` для структуры и mechanical hygiene: required files, frontmatter, metadata, task registry consistency, tier rules, protocol evidence и broken links
- `skills/mb-garden/assets/mb-doctor.mjs` для workflow и autonomous readiness: можно ли продолжать по JSON task queue с учетом dependencies, tier policy, evidence и obsolete artifacts

`mb-lint` отвечает на вопрос "Memory Bank механически валиден?" `mb-doctor` отвечает на вопрос "репозиторий готов к autonomous или autopilot execution?" Default `mb-doctor` подходит для pre-queue health checks и fresh skeletons. Запускай `mb-doctor --strict` только после появления JSON task queue: после `/prd-to-tasks`, перед scheduler execution внутри `/autonomous` или перед `/autopilot`, когда queue уже подготовлена.

Task state является JSON-only. Поддерживаемый registry: `.memory-bank/tasks/index.json` плюс индексированные `.memory-bank/tasks/TASK-*.task.json` records. `backlog.md`, markdown task cards и старая модель `risk` / `risk.level` не поддерживаются.

Модель сопровождения намеренно file-based и audit-friendly.

## Shared assets и vendoring

`skills/_shared/` — источник истины для shared prompts, references и scripts.

Перед релизом `scripts/vendor-shared.mjs` вендорит эти shared assets в каждый installable package skill как плоские companion files, например:
- `agents/shared-*.md`
- `references/shared-*.md`
- `scripts/shared-*.js`

Это делает top-level skills self-contained для `skills add`, сохраняя единый shared source внутри репозитория.

В source-only модели репозитория эти `shared-*` файлы считаются generated artifacts и не должны коммититься. CI генерирует их перед smoke-тестом установки package skills.

Source-only hygiene check:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

В source tree команда должна печатать `0`. Если нужно изменить общее поведение, редактируй `skills/_shared/`, а не generated package-local копии `shared-*`.

## Структура репозитория

```text
skills/
  _shared/
  cold-start/
  mb-init/
  mb-analysis/
  mb-from-prd/
  mb-map-codebase/
  mb-execute/
  mb-verify/
  mb-red-verify/
  mb-review/
  mb-garden/
  mb-harness/
scripts/
  install-framework.mjs
  vendor-shared.mjs
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
- `skills/mb-garden/assets/mb-doctor.mjs` - deterministic autonomous readiness check
- `scripts/install-framework.mjs` - source-only installer wrapper
- `scripts/vendor-shared.mjs` - vendoring pipeline для package skills

## License

MIT - см. `LICENSE`.
