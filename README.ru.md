# memobank

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
  -> PRD
  -> features
  -> JSON tasks
  -> execute
  -> verify
  -> sync
  -> следующая feature/task
```

1. `/analysis` или `/brief`

   **Когда:** если входная идея сырая, противоречивая или еще не готова для PRD.

   **Создает/обновляет:** analysis artifacts в `.memory-bank/analysis/`, обычно product brief как вход для PRD.

   **Дальше:** перейти к `/write-prd`, когда достаточно понятно, что нужно строить.

2. `/write-prd`

   **Когда:** когда есть product brief, черновик требований или уже понятное описание продукта.

   **Создает/обновляет:** PRD с уточненными целями, scope, требованиями, ограничениями и открытыми вопросами.

   **Дальше:** если PRD достаточно ясен, запустить `/prd`.

3. `/prd`

   **Когда:** когда PRD готов к разложению на структуру Memory Bank.

   **Создает/обновляет:** `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/epics/`, `.memory-bank/features/` и связанные индексы.

   **Дальше:** выбрать feature для декомпозиции. Если она заблокирована неясностями, сначала использовать `/clarify-feature FT-001`.

4. `/clarify-feature FT-001`

   **Когда:** только если конкретная feature содержит blocker, `TBD`, `TODO`, `NEEDS CLARIFICATION` или другой marker, который мешает нарезать задачи.

   **Создает/обновляет:** уточнения по feature и ее clarification status.

   **Дальше:** после снятия blocker запустить `/prd-to-tasks FT-001`.

5. `/prd-to-tasks FT-001`

   **Когда:** когда feature можно разложить на implementation tasks.

   **Создает/обновляет:** `.protocols/FT-001/plan.md`, `.protocols/FT-001/decision-log.md`, `.memory-bank/tasks/plans/IMPL-FT-001.md`, task records в `.memory-bank/tasks/*.task.json` и индекс `.memory-bank/tasks/index.json`.

   **Дальше:** взять первую готовую задачу и выполнить `/execute TASK-001`.

6. `/execute TASK-001`

   **Когда:** для реализации одной конкретной задачи из task record.

   **Создает/обновляет:** код или документацию по scope задачи, protocol state в `.protocols/TASK-001/`, evidence и handoff в `.tasks/TASK-001/`.

   **Дальше:** запустить `/verify TASK-001`.

7. `/verify TASK-001`

   **Когда:** после реализации задачи.

   **Создает/обновляет:** verification evidence, verdict `PASS` или `FAIL`, task/protocol state по результату проверки.

   **Дальше:** если задача сложная или рискованная, запустить `/red-verify TASK-001`; иначе перейти к `/mb-sync`.

8. `/red-verify TASK-001`

   **Когда:** опционально в ручном workflow; особенно полезно для T2/T3 задач, где обычные tests могут пройти, но решение может быть неверным по смыслу.

   **Создает/обновляет:** semantic verification report и semantic verdict.

   **Дальше:** при проблемах вернуть задачу в доработку; при успешной проверке перейти к `/mb-sync`.

9. `/mb-sync`

   **Когда:** после результата задачи, особенно если менялись требования, task status, changelog, RTM или durable Memory Bank docs.

   **Создает/обновляет:** индексы Memory Bank, lifecycle/RTM notes, changelog, task-record consistency и ссылки на evidence.

   **Дальше:** выбрать следующую задачу или feature.

10. Повторять цикл

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

В этом форке используйте installer wrapper. Прямой `npx skills add <repo>` для source-only дерева не подходит.

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

После установки в целевом репозитории создайте skeleton Memory Bank:

```text
/mb-init
```

Если project command proxies еще недоступны, можно запустить bootstrap script из установленного skill package:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

После bootstrap используйте `/cold-start` или начните ручной цикл:

```text
/analysis -> /write-prd -> /prd -> /prd-to-tasks FT-001 -> /execute TASK-001 -> /verify TASK-001 -> /mb-sync
```

Автоматические режимы стоит включать после того, как PRD, features и task records уже понятны. `/autopilot` работает по готовой JSON task queue, а `/autonomous` берет на себя более длинный unattended flow.

## 📚 Подробная механика

Подробное описание установки, source-only packaging, структуры Memory Bank, task model, tier policy, command reference и проверок находится в [howItWorks.md](howItWorks.md).
