# memobank

`memobank` - source-only skill pack/framework для Codex CLI, Claude Code, OpenCode и совместимых agent runtimes.

Он устанавливает package skills в runtime, а затем bootstrap-ит целевой репозиторий в Memory Bank workspace: `.memory-bank/` для durable knowledge, `.protocols/` для возобновляемых протоколов, `.tasks/` для runtime evidence и reports. Цель - чтобы агент мог работать по файлам и проверяемым состояниям, а не по хрупкой истории чата.

## Что важно знать сразу

- Этот репозиторий сам является source-only pack: canonical shared source лежит в `skills/_shared/`.
- Package-local `skills/*/{agents,references,scripts}/shared-*` не коммитятся.
- Установка skills и CI smoke сначала делают временную vendored copy, где `shared-*` файлы генерируются, и только потом вызывают `skills add`.
- Целевой репозиторий bootstrap-ится отдельным шагом через installed или source `shared-init-mb.js` / `init-mb.js`.
- Task model теперь JSON-only: `.memory-bank/tasks/index.json` индексирует `.memory-bank/tasks/TASK-*.task.json`.
- Каждый task record обязан иметь `tier: T0|T1|T2|T3`; старые `risk` и `risk.level` невалидны.
- Fresh bootstrap создает пустой task index и не создает runnable task records.

## Две разные стадии

### 1. Установка package skills

Для этого source-only форка не используйте прямой:

```bash
npx skills add <repo>
```

Правильная точка входа - wrapper:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

Можно передавать обычные options для `skills add`, например:

```bash
node scripts/install-framework.mjs --skill cold-start --global --yes
```

Что делает wrapper:

1. Копирует текущий repo во временную директорию.
2. Запускает там `scripts/vendor-shared.mjs`.
3. Генерирует package-local `shared-*` assets для каждого installable skill.
4. Вызывает `npx -y skills add <prepared-temp-repo> ...`.
5. Удаляет temporary repo, если не задан `MEMOBANK_KEEP_INSTALL_TMP=1`.

### 2. Bootstrap целевого репозитория

После установки package skills целевой repo инициализируется скриптом из installed skill:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

Если вы работаете прямо из source checkout этого проекта, можно bootstrap-ить target repo source script-ом:

```bash
node /path/to/memobank_BMAD_SDD/skills/_shared/scripts/init-mb.js
```

Для обновления generated command specs, proxy skills и runtime scripts в уже bootstrap-нутом target repo:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js --sync
```

`--force` сейчас эквивалентен `--sync`.

## Source-only packaging

Canonical shared assets:

```text
skills/_shared/agents/*
skills/_shared/references/commands/*
skills/_shared/references/workflows/*
skills/_shared/references/protocols/*
skills/_shared/scripts/init-mb.js
```

Generated package-local assets:

```text
skills/<skill>/agents/shared-*
skills/<skill>/references/shared-*
skills/<skill>/scripts/shared-*
```

В source tree generated `shared-*` отсутствуют намеренно. Если `SKILL.md` или command docs визуально ссылаются на `shared-*` файлы, в source-only tree эти ссылки могут казаться отсутствующими. Они становятся валидными после vendoring/install, когда wrapper подготовит временную installable copy.

Правило для разработки framework:

- меняйте shared behavior только в `skills/_shared/`;
- не редактируйте и не коммитьте generated package-local `shared-*`;
- перед release/source check убедитесь, что source tree чистый:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

Ожидаемый результат в source repo: `0`.

## Что bootstrap создает в target repo

`skills/_shared/scripts/init-mb.js` создает или обновляет Memory Bank workspace. По умолчанию он не перезаписывает существующие файлы; `--sync` обновляет generated command specs, proxy skills и runtime scripts.

Фактически генерируемые артефакты:

```text
.memory-bank/
  adrs/ADR-000-template.md
  agents/
  archive/
  architecture/
  bugs/
  commands/*.md
  commands/index.md
  constitution.md
  contracts/
  domains/
  epics/
  features/
  glossary.md
  guides/
  index.md
  invariants.md
  mbb/index.md
  product.md
  quality/
  requirements.md
  runbooks/
  schemas/task.schema.json
  skills/index.md
  spec-index.md
  states/
  tasks/index.json
  tasks/plans/
  tech-specs/
  testing/index.md
  workflows/autonomy-policy.md
  workflows/execute-loop.md
  workflows/mb-sync.md
  workflows/tier-policy.md
  changelog.md
.tasks/
.protocols/
scripts/mb-lint.mjs
scripts/mb-doctor.mjs
AGENTS.md
CLAUDE.md
GEMINI.md
.claude/skills/<command>/SKILL.md
.agents/skills/<command>/SKILL.md
```

`.memory-bank/commands/*.md` - source of truth для generated slash commands. `.claude/skills/*` и `.agents/skills/*` - thin proxy skills, которые говорят runtime прочитать соответствующий command spec.

## Package skills

- `cold-start` - all-in-one bootstrap router для greenfield, idea-only и brownfield проектов.
- `mb-init` - skeleton generation и command/proxy creation.
- `mb-analysis` - optional discovery перед PRD: `/analysis`, `/brainstorm`, `/brief`.
- `mb-from-prd` - clarified PRD -> product, requirements, epics, features.
- `mb-map-codebase` - as-is mapping существующего codebase без roadmap speculation.
- `mb-execute` - implementation handoff для одной `TASK-*`.
- `mb-verify` - functional verification по AC/REQ и evidence.
- `mb-red-verify` - adversarial semantic verification.
- `mb-review` - fresh-context Memory Bank review.
- `mb-garden` - lint, doctor и maintenance assets.
- `mb-harness` - deterministic commands, clean sessions, worktree guidance.

## Основные workflow

### Idea/raw discovery

Когда идея сырая или направление нестабильно:

```text
/analysis -> /brainstorm -> /brief -> /write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

`/analysis` только маршрутизирует. `/brainstorm` создает brainstorming report. `/brief` создает Product Brief как input contract для `/write-prd`. Ни один из этих шагов не создает task records.

### Clear PRD или concept

Если есть понятный concept, но нет PRD:

```text
/brief -> /write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

Если есть внешний PRD или PRD-like text:

```text
/write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

`/write-prd` нормализует вход в `.memory-bank/prd.md` с `type: prd`, `clarification_status: complete` и `constitution_checked: true`. `/prd` decomposes PRD в L1-L3: product, requirements, epics, features. `/prd-to-tasks` создает tasks только после feature docs.

### Brownfield

Для существующего codebase сначала строится as-is baseline:

```text
/map-codebase -> /write-prd --delta -> /prd -> /prd-to-tasks FT-<NNN>
```

Можно использовать `/brief` для формирования delta input, но route не должен обходить `/write-prd`. Brownfield rule: без PRD/delta нельзя создавать roadmap epics, features или runnable task records. `/map-codebase` документирует существующую систему, а не придумывает план развития.

### Manual task loop

Интерактивный режим для одной задачи:

```text
/execute TASK-001 -> /verify TASK-001 -> optional /red-verify TASK-001 -> /mb-sync
```

`/red-verify` в manual mode опционален после `/verify PASS` и нужен для risky/substantive tasks. Если он находит semantic issue, он может reopen/block/fail задачу или создать bug/follow-up task.

### `/autopilot`

`/autopilot` - scheduler/executor только для уже существующей JSON task queue.

Preconditions:

- `.memory-bank/tasks/index.json` содержит indexed task records;
- каждая task имеет mandatory `tier`;
- последний `/review` дал `APPROVE`;
- `node scripts/mb-doctor.mjs --strict` проходит;
- нет pending/blocked feature clarification для task-linked features.

`/autopilot` не запускает `/write-prd`, `/prd`, `/prd-to-tasks` и не создает task queue.

### `/autonomous`

`/autonomous` - full unattended flow:

```text
PRD/Product Brief/delta
-> /write-prd
-> /prd
-> /review
-> /prd-to-tasks --all
-> task-planning review
-> strict doctor
-> scheduler loop
-> wave reviews
-> terminal state
```

Он строит L1-L3, создает all-feature JSON task queue, запускает scheduler loop, выполняет verification/red-verification по tier policy, делает `/mb-sync`, review gates и завершает явным terminal state: `SUCCESS`, `HALT_BLOCKING_QUESTIONS`, `HALT_CLARIFICATION_REQUIRED`, `HALT_REVIEW_REJECT`, `HALT_FAILURE_BUDGET`, `HALT_DEPENDENCY_DEADLOCK`, `HALT_POLICY_VIOLATION`, `HALT_QUALITY_GATES` или `HALT_BUDGET_EXCEEDED`.

## Task model

Task registry строго JSON-only:

```text
.memory-bank/tasks/index.json
.memory-bank/tasks/TASK-001.task.json
.memory-bank/schemas/task.schema.json
```

Fresh bootstrap:

```json
{
  "version": 1,
  "tasks": []
}
```

Fresh bootstrap не создает `.memory-bank/tasks/TASK-001.task.json` и не создает runnable task records. Task records появляются через `/prd-to-tasks FT-<NNN>` или `/prd-to-tasks --all`.

Минимальная форма task record:

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
  "tier": "T1",
  "gates": [],
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

Allowed `status`: `planned`, `ready`, `in_progress`, `blocked`, `done`, `failed`.

Allowed `tier`: `T0`, `T1`, `T2`, `T3`.

Legacy `risk` и `risk.level` удалены. Execution, verification, red-verification, scheduler routing и doctor checks должны использовать только `task.tier`.

## Manual mode vs scheduler mode

Status ownership различается по режиму.

Manual mode:

- `/execute` реализует задачу и записывает evidence/handoff.
- `/verify PASS` может закрыть задачу, включая T2/T3.
- `/red-verify` после PASS optional и risk-based; он может reopen/block/fail, если решение неверно по существу.
- `/mb-sync` синхронизирует Memory Bank, RTM, changelog и task records после explicit closure decision.

Scheduler mode (`/autopilot`, `/autonomous`):

- scheduler owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done|failed`, dependent block/unblock и terminal state;
- `/execute` не закрывает tasks;
- `/verify` не закрывает, не fail-ит, не promotes dependents;
- `/red-verify` не закрывает, не fail-ит, не promotes dependents;
- `/mb-sync` только records/reconciles scheduler-provided decision и не принимает closure decision самостоятельно.

Не смешивайте manual и scheduler mode внутри одного task run.

## Tier policy

| Tier | Когда использовать | Protocol | Verification | Scheduler closure |
|---|---|---|---|---|
| `T0` | typo, links, formatting, safe docs-only | compact `.protocols/TASK/run.md` allowed | separate `/verify` обычно не нужен | compact evidence / functional PASS достаточно |
| `T1` | local code/local behavior с низким blast radius | compact allowed | local gates; `/verify` optional | compact evidence / functional PASS достаточно |
| `T2` | API, contracts, schema/state/data/domain, cross-module | full protocol required | `/verify` required; `/red-verify` required in scheduler | `VERDICT: PASS` + `SEMANTIC_VERDICT: semantic-pass` |
| `T3` | auth, security, secrets, prod/deploy, irreversible/data-loss, payments, compliance | full protocol required | `/verify` + `/red-verify` + human/recovery evidence | T2 requirements + exact `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present` |

Если scope вырос, поднимите tier до передачи задачи дальше. Если сомневаетесь между двумя tiers, выбирайте более высокий.

## Generated command reference

| Command | Purpose | Creates/updates | Does not do | Next step |
|---|---|---|---|---|
| `/cold-start` | Scenario router после skeleton creation | routing decision, next command recommendation | не создает EP/FT/TASK без PRD; не обходит `/write-prd` | `/analysis`, `/brief`, `/write-prd`, `/map-codebase` или stop |
| `/mb` | Prime agent context from Memory Bank | usually no writes; may create `.protocols/<TASK>/plan.md` for unknowns | не выполняет implementation | выбранный task/workflow command |
| `/mb-init` | Initialize Memory Bank skeleton | `.memory-bank/`, `.tasks/`, `.protocols/`, agent files, proxy skills | не планирует roadmap/tasks | `/cold-start` |
| `/analysis` | Optional discovery router | `.memory-bank/analysis/index.md` | не создает brief, PRD, tasks, research | `/brainstorm`, `/brief`, `/write-prd`, `/map-codebase`, `/clarify-feature` |
| `/brainstorm` | Facilitated ideation | `.memory-bank/analysis/brainstorming/BR-*.md`, analysis index | не создает PRD, Product Brief, tasks | `/brief` |
| `/brief` | Product Brief input contract | `.memory-bank/analysis/product-brief.md`, analysis index | не создает features/tasks; не заменяет PRD | `/write-prd` |
| `/constitution` | Create/read/minimally amend governing principles | `.memory-bank/constitution.md` | не добавляет governance engines или command aliases | `/write-prd`, `/prd-to-tasks` или текущий workflow |
| `/write-prd` | Product Brief/context -> clarified PRD | `.memory-bank/prd.md` | не создает EP/FT/TASK; не bypass Constitution conflicts | `/prd` |
| `/prd` | Clarified PRD -> L1-L3 Memory Bank | product, requirements, epics, features, testing/index | не создает full task queue blindly | `/clarify-feature` if blocked, else `/prd-to-tasks FT-*` |
| `/clarify-feature` | Resolve feature-level blockers | target `.memory-bank/features/FT-*.md` clarification metadata/answers | не назначает tier; не создает task records | `/prd-to-tasks FT-*` |
| `/prd-to-tasks` | Feature -> implementation plan + JSON tasks | `.memory-bank/tasks/plans/IMPL-FT-*.md`, indexed `TASK-*.task.json` | не запускает execution; не работает при pending blockers | `/execute` manually или `/review`/`/autopilot` |
| `/execute` | Implement one scoped task | `.protocols/<TASK>/...`, `.tasks/<TASK>/...`, code/docs in task scope | не закрывает task; не запускает verify/red-verify/mb-sync | `/verify` |
| `/verify` | Functional acceptance/evidence verification | verification protocol/evidence, task `verify` entries, possible bugs/follow-ups | в scheduler mode не закрывает/fail/promote | manual close or `/red-verify`/scheduler decision |
| `/red-verify` | Adversarial semantic verification | `.protocols/<TASK>/red-verification.md`, `.tasks/<TASK>/...`, bugs/follow-ups if needed | не дублирует `/verify`; в scheduler mode не закрывает | `/mb-sync` or scheduler decision |
| `/review` | Fresh-context Memory Bank/planning review | `.tasks/TASK-MB-REVIEW/*`, fix list/verdict | не является per-task semantic verification | fix issues, `/prd-to-tasks`, `/autopilot`, or continue |
| `/map-codebase` | Brownfield as-is mapping | `.memory-bank/*` baseline docs, `.tasks/TASK-MB-MAP/*` | не создает roadmap/tasks без PRD | `/write-prd --delta` then `/prd` |
| `/mb-sync` | Synchronize durable docs and task consistency | indexes, RTM/lifecycle, changelog, task consistency | не принимает scheduler closure/promotion decision | `mb-doctor`, review, next task |
| `/mb-garden` | Maintain Memory Bank hygiene | lint findings, cleanup/archive recommendations | не меняет product scope | fix docs or rerun checks |
| `/mb-doctor` | Deterministic readiness gate over `mb-lint` | report only; optional JSON output | не заменяет `/review`, `/verify`, `/red-verify`; no markdown task-card fallback | fix findings or proceed to scheduler |
| `/mb-harness` | Setup deterministic agent-safe workflows | harness docs/config guidance, gates/worktree guidance | не реализует product tasks | run chosen workflow with gates |
| `/autopilot` | Execute existing JSON task queue | task statuses, protocols, evidence, sync/review loop | не создает PRD/FT/TASK queue | terminal state or follow-up fixes |
| `/autonomous` | Full unattended PRD -> done flow | PRD/L1-L3/tasks/protocols/reviews/status | не asks user mid-run except terminal halt; не bypass hard stops | terminal state |
| `/discuss` | Clarify unknowns/contradictions before implementation | decision log/protocol notes when useful | не implements; не creates tasks by itself | resolved command such as `/write-prd`, `/execute` |
| `/add-tests` | Add useful unit/integration/e2e coverage | tests, `.memory-bank/testing/index.md`, evidence under `.tasks/` | не adds decorative/flaky tests | run tests, `/mb-sync` |
| `/find-skills` | Find relevant installed/marketplace skills | recommendation list | не installs marketplace skills without confirmation | use/install selected skills |

## Checks

Framework/source repo checks:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
```

The `find` command should print `0`.

Optional installer debugging:

```bash
MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes
```

Target repo checks after bootstrap:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs
```

Use strict doctor only after a real executable task queue exists:

```bash
node scripts/mb-doctor.mjs --strict
```

In a fresh skeleton, empty `.memory-bank/tasks/index.json` is valid in default doctor mode and invalid in strict mode because there is no executable queue.

## Repository map for this framework

```text
skills/_shared/                 canonical shared source
skills/*/SKILL.md               installable package skill entrypoints
skills/*/assets|references      skill-specific non-shared assets
scripts/install-framework.mjs   source-only installer wrapper
scripts/vendor-shared.mjs       temp-copy shared asset vendoring
.github/workflows/release-check.yml
                                 source hygiene, syntax, install/bootstrap smoke
README.ru.md / README.en.md     full documentation
README.md                       short bilingual entrypoint
PROJECT_MAP.md                  agent-facing repository map
```

## Documentation caveats

`PROJECT_MAP.md` currently references `HANDOFF.md` and `Optimisation.md` as planning/context docs, but those files are absent in the current tree. This README intentionally does not link to them as existing documentation.

## License

MIT
