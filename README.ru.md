# memobank

![Схема MEMOFLOW](MEMOFLOW.png)

`memobank` - это набор skills и workflow для агентной разработки в Codex CLI, Claude Code, OpenCode и совместимых runtimes.

## 📌 Что это

`memobank` переносит рабочий контекст проекта из истории чата в файлы репозитория. Агент читает эти файлы перед работой, обновляет их после значимых изменений и может продолжать задачу в другой сессии без восстановления контекста вручную.

Основные области:

- `.memory-bank/` - знания и состояние проекта: продукт, требования, epics, features, архитектура, task records, индексы и правила работы.
- `.protocols/` - планы, прогресс и verification по конкретным задачам или features.
- `.tasks/` - runtime evidence, отчеты, handoff-файлы и материалы, которые помогают передавать работу между агентами.
- `.memory-bank/tasks/*.task.json` - task records. Это источник правды для задач.
- `.memory-bank/tasks/index.json` - индекс task records, по которому команды находят и планируют задачи.

## 🗄️ Что дает Memory Bank

Memory Bank помогает вести разработку как повторяемый процесс:

- фиксирует требования, решения и статус задач в репозитории;
- связывает PRD, requirements, epics, features и implementation tasks;
- хранит acceptance criteria, gates, evidence и verification results;
- позволяет выполнять задачи по одной, с явным handoff и проверкой результата;
- поддерживает ручной workflow и автоматические режимы поверх той же task model.

## 🧭 Сценарии использования

- 🌱 **Greenfield**: когда есть идея, черновик или разрозненные требования. Framework помогает довести входные данные до PRD, разложить PRD на requirements, epics, features и tasks, затем пройти реализацию до готового проекта.
- 🏗️ **Brownfield**: когда код уже существует. Framework можно встроить в текущий репозиторий, сначала описать фактическое состояние через `/map-codebase`, а затем планировать изменения через новый PRD или delta к уже описанному baseline.

## 🔄 Классический workflow разработки

Рекомендуемый режим - ручной. В нем проще контролировать входные данные, видеть, какие документы создаются, и проверять каждую задачу отдельно.

```text
идея

  -> Brainstorming       Интервью -> brief.md
  -> Constitution         Принципы проекта и non-negotiables
  -> PRD
  -> SDD spec index       Карта design specs
  -> features            + проработка /clarify
  -> feature design       /spec-design перед tasks
  -> JSON tasks          с градацией сложности и риска 
  -> execute             можно все сразу в авторежиме
  -> verify              + red-verify
  -> sync
  -> следующая task
```

1. `/analysis` или `/brief`

   **Когда:** если входная идея сырая, противоречивая или еще не готова для PRD.

   **Создает/обновляет:** analysis artifacts в `.memory-bank/analysis/`, обычно product brief как вход для `/constitution` и PRD.

   **Дальше:** перейти к `/constitution`, когда достаточно понятно, что нужно строить.

2. `/constitution`

   **Когда:** после product brief или existing PRD context, перед `/write-prd`.

   **Создает/обновляет:** `.memory-bank/constitution.md` с governing principles, Definition of Done, автономностью агентов, human checkpoints и критичными non-negotiables.

   **Дальше:** перейти к `/write-prd`. Если пользователь явно пропускает interview, flow продолжается с `project_principles: framework-default|skipped`, а `/constitution` можно пройти позже.

3. `/write-prd`

   **Когда:** когда есть product brief, черновик требований или уже понятное описание продукта.

   **Создает/обновляет:** PRD с уточненными целями, scope, требованиями, ограничениями и открытыми вопросами.

   **Дальше:** если PRD достаточно ясен, запустить `/spec-init`.

4. `/spec-init`

   **Когда:** после clarified PRD, до `/prd`.

   **Создает/обновляет:** `.memory-bank/spec-index.md` как SDD Design Specs Index: planned/candidate/unknown/not_applicable areas, gaps, expected spec locations. Не создает authoritative architecture/contracts/states/data specs без evidence.

   **Дальше:** запустить `/prd`.

5. `/prd`

   **Когда:** когда PRD готов к разложению на структуру Memory Bank.

   **Создает/обновляет:** `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/epics/`, `.memory-bank/features/` и связанные индексы.

   **Дальше:** выбрать feature для декомпозиции. Если она заблокирована неясностями, сначала использовать `/clarify-feature FT-001`; затем `/spec-design FT-001`.

6. `/clarify-feature FT-001`

   **Когда:** только если конкретная feature содержит blocker, `TBD`, `TODO`, `NEEDS CLARIFICATION` или другой marker, который мешает нарезать задачи.

   **Создает/обновляет:** уточнения по feature и ее clarification status.

   **Дальше:** после снятия blocker запустить `/spec-design FT-001`.

7. `/spec-design FT-001`

   **Когда:** после `/prd` и до `/prd-to-tasks`, для выбранной feature.

   **Создает/обновляет:** только нужные SDD artifacts: feature hub в `tech-specs`, architecture notes, contracts, domains, states, ADR, testing/runbooks. Для простых T0/T1-like features может поставить `spec_design_status: not_required` с кратким rationale.

   **Дальше:** запустить `/prd-to-tasks FT-001`.

8. `/prd-to-tasks FT-001`

   **Когда:** когда feature можно разложить на implementation tasks.

   **Создает/обновляет:** `.protocols/FT-001/plan.md`, `.protocols/FT-001/decision-log.md`, `.memory-bank/tasks/plans/IMPL-FT-001.md`, task records в `.memory-bank/tasks/*.task.json` и индекс `.memory-bank/tasks/index.json`.

   **Дальше:** взять первую готовую задачу и выполнить `/execute TASK-001`.

9. `/execute TASK-001`

   **Когда:** для реализации одной конкретной задачи из task record.

   **Создает/обновляет:** код или документацию по scope задачи, protocol state в `.protocols/TASK-001/`, evidence и handoff в `.tasks/TASK-001/`.

   **Дальше:** запустить `/verify TASK-001`.

10. `/verify TASK-001`

   **Когда:** после реализации задачи.

   **Создает/обновляет:** verification evidence, verdict `PASS` или `FAIL`, task/protocol state по результату проверки.

   **Дальше:** если задача сложная или рискованная, запустить `/red-verify TASK-001`; иначе перейти к `/mb-sync`.

11. `/red-verify TASK-001`

   **Когда:** обязательно для T2/T3 перед финальным закрытием; особенно полезно там, где обычные tests могут пройти, но решение может быть неверным по смыслу.

   **Создает/обновляет:** semantic verification report и semantic verdict.

   **Дальше:** при проблемах вернуть задачу в доработку; при успешной проверке перейти к `/mb-sync`.

12. `/mb-sync`

   **Когда:** после результата задачи, особенно если менялись требования, task status, changelog, RTM или durable Memory Bank docs.

   **Создает/обновляет:** индексы Memory Bank, lifecycle/RTM notes, changelog, task-record consistency и ссылки на evidence.

   **Дальше:** выбрать следующую задачу или feature.

13. Повторять цикл

    **Когда:** пока features и tasks не доведены до нужного состояния.

    **Создает/обновляет:** последовательные изменения в продукте, документах, task records и evidence.

    **Дальше:** продолжать `/prd-to-tasks` для следующих features или `/execute` для следующих tasks.

## 🛠️ Команды вне основного ручного цикла

- `/cold-start` - выбирает стартовый сценарий для нового или существующего репозитория: greenfield, brownfield, skeleton-only.
- `/mb-init` - создает skeleton Memory Bank, `.tasks/`, `.protocols/`, `AGENTS.md` и project command proxies.
- `/map-codebase` - описывает существующий код как as-is baseline в Memory Bank.
- `/review` - запускает fresh-context review Memory Bank и фиксирует найденные gaps.
- `/mb-garden` - обслуживает Memory Bank: lint, чистка, устранение drift, архивирование.
- `/mb-doctor` - deterministic readiness gate для autopilot/autonomous runs.
- `/mb-harness` - помогает настроить чистые сессии, профили и проверочные команды.
- `/autopilot` - автономно проходит уже созданную JSON task queue.
- `/autonomous` - ведет полный unattended flow от PRD до terminal state.
- `/discuss` - проясняет неизвестные и противоречия перед реализацией.
- `/add-tests` - добавляет или расширяет тесты вокруг выбранной области.
- `/find-skills` - ищет релевантные skills среди установленных и доступных.

## 🚀 Установка и запуск

Скачайте этот репозиторий, перейдите в его папку и запустите скрипт автоустановки:

```bash
node scripts/install-framework.mjs
```

Интерактивный installer позволит выбрать нужную папку проекта из списка,
установит команды memobank и создаст или синхронизирует skeleton Memory Bank в
выбранном репозитории.

Если нужно вручную запустить bootstrap из уже установленного skill package:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

После bootstrap используйте `/cold-start` или начните ручной цикл:

```text
/analysis -> /brief -> /constitution -> /write-prd -> /spec-init -> /prd -> /spec-design FT-001 -> /prd-to-tasks FT-001 -> /execute TASK-001 -> /verify TASK-001 -> /mb-sync
```

Автоматические режимы стоит включать после того, как PRD, features и task records уже понятны. `/autopilot` работает по готовой JSON task queue, а `/autonomous` берет на себя более длинный unattended flow.

## 📚 Подробная механика

Подробное описание установки, source-only packaging, структуры Memory Bank, task model, tier policy, command reference и проверок находится в [howItWorks.md](howItWorks.md).
