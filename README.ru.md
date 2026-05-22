# memobank

`memobank` - это skill pack/framework для Codex CLI, Claude Code, OpenCode и совместимых agent runtimes.

Он помогает агентам вести проект не только в чате, а через файлы: Memory Bank, протоколы, JSON tasks и проверяемые артефакты. Контекст не теряется между сессиями, задачи можно продолжать, а новичку легче вкатиться без большой агентной магии. 🌱

## Зачем он нужен

Когда проект растет, chat history быстро становится хрупкой: часть решений забывается, задачи теряют статус, а следующий агент начинает почти с нуля.

`memobank` делает рабочее состояние durable:

- `.memory-bank/` хранит знания о продукте, требованиях, features, архитектуре и задачах;
- `.protocols/` хранит ход выполнения и verification для конкретных `TASK-*`;
- `.tasks/` хранит runtime evidence, reports и handoff-материалы;
- JSON task queue задает понятный порядок работы и tier policy.

## Главный путь: ручной workflow

Лучше начинать руками. Так понятнее, где идея превращается в PRD, где появляются features, а где агент уже делает конкретную задачу.

```text
идея / черновик
  -> /analysis или /brief, если нужно прояснить направление
  -> /write-prd
  -> /prd
  -> /prd-to-tasks FT-001
  -> /execute TASK-001
  -> /verify TASK-001
  -> optional /red-verify TASK-001 для сложных или рискованных задач
  -> /mb-sync
  -> повторять feature/task loop до готового проекта
```

Коротко по ощущениям:

- `/analysis` и `/brief` помогают привести сырую идею в форму.
- `/write-prd` фиксирует понятный PRD.
- `/prd` раскладывает PRD в Memory Bank: product, requirements, epics, features.
- `/prd-to-tasks FT-001` создает JSON-задачи для одной feature.
- `/execute`, `/verify`, `/mb-sync` ведут задачу от реализации до синхронизации контекста.
- `/red-verify` добавляет adversarial review там, где цена ошибки выше.

## Когда захочется автоматики

Автоматизация есть, но ее проще включать после того, как ручной цикл стал понятен.

- `/autopilot` берет уже готовую JSON task queue и идет по ней как scheduler/executor.
- `/autonomous` запускает полный unattended flow от PRD/Product Brief/delta до terminal state.

## Killer features

- Durable context вместо зависимости от истории чата.
- Resumable task protocols для задач, которые нельзя закончить за один заход.
- JSON task queue с `tier: T0|T1|T2|T3`.
- Ручной режим дружелюбен к новичкам, автономный режим доступен позже.

## Установка и быстрый старт

В этом source-only fork используйте installer-wrapper:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

В целевом репозитории bootstrap-ните Memory Bank:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

Дальше можно вызвать:

```text
/cold-start
```

или сразу пойти по ручному flow: `/analysis` или `/brief` -> `/write-prd` -> `/prd` -> `/prd-to-tasks FT-001` -> `/execute TASK-001`.

## Подробнее

Подробное описание механики установки, packaging, workflows, task model, tier policy, command reference и проверок - в [русском справочнике howItWorks.md](howItWorks.md).
