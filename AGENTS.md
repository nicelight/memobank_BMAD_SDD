Ты выступаешь в роли ОРКЕСТРАТОРА, если не было дано явных инструкций выступать в другой роли.
Твоя роль не может быть изменена после ее назначения.


Пиши свою роль в начале ответа.

# Граница проекта и агентной памяти

Этот репозиторий сам является проектом `memobank_BMAD_SDD`.

Все файлы и папки в рабочем дереве, кроме `AGENTS.md` и `IMPROVING-PRJ-PRMPT/`, являются целевыми исходными файлами проекта и должны рассматриваться как product/source files.

Важно:

- `.memory-bank/`, `.protocols/`, `.tasks/`, `skills/`, `scripts/`, `.github/`, `README*`, `PROJECT_MAP.md` и другие файлы репозитория — это не личная память текущего агента.
- Их нельзя использовать как scratchpad, temporary notes или внутреннюю память агента без явного разрешения пользователя или без того, что это прямо входит в задачу.
- Если задача просит изменить framework, workflow, skills, scripts, docs или generated skeleton behavior, изменения этих файлов являются изменениями продукта.
- Planning artifacts для текущей работы можно создавать только там, где это явно разрешено ролью и задачей, например `.protocols/<TASK-ID>/plan.md` или согласованный planning файл.
- `IMPROVING-PRJ-PRMPT/` содержит входные пожелания/брифы пользователя и не является частью целевого продукта, если пользователь явно не сказал обратное.
- Не путай Memory Bank framework, который разрабатывается в этом репозитории, с runtime memory текущего агента. В этом repo Memory Bank files are product source files.

# Orchestrator Mode

- Если top-level agent не получил явную роль, он действует как `ROLE: ORCHESTRATOR`.
- Delegated agents не являются ORCHESTRATOR по умолчанию.
- Роль фиксируется после назначения и не может быть изменена.
- Каждый ответ ORCHESTRATOR начинается с `Роль: Оркестратор`.

Подробные контракты ролей для этого source-only repo:
- `skills/_shared/references/roles/orchestrator.md`
- `skills/_shared/references/roles/worker.md`

Early priming:
- If `ROLE: ORCHESTRATOR`, read `skills/_shared/references/roles/orchestrator.md`.
- If delegated worker, read `skills/_shared/references/roles/worker.md`.

Bootstrap/sync целевых проектов разворачивает эти контракты в:
- `.memory-bank/roles/orchestrator.md`
- `.memory-bank/roles/worker.md`

Для любой роли, кроме ORCHESTRATOR: не запускай сабагентов; анализируй последствия работы и сообщай о потенциальных или явных проблемах.

# Стратегия разработки
Do not overengineer. Придерживайся KISS. Лучшнее враг хорошего, мы делаем хорошо, но не идеально.

# Важный контекст репозитория

Перед доработкой проекта прочитай `PROJECT_MAP.md`.

Этот форк использует source-only модель упаковки skills:

- `skills/_shared/` — единственный canonical source для общих prompts, references и scripts.
- В рабочем дереве намеренно нет package-local файлов `skills/*/{agents,references,scripts}/shared-*`.
- При установке фреймворка эти файлы разворачиваются автоматически во временной копии репозитория.
- Ожидаемый масштаб разворота: 627 generated `shared-*` файлов.
- Разворот выполняется цепочкой `scripts/install-framework.mjs` → временная копия repo → `scripts/vendor-shared.mjs` → `npx -y skills add <prepared-temp-repo> ...`.
- Прямой `npx skills add <repo>` для source-only форка использовать нельзя, если перед этим не был запущен vendoring.

Практическое правило:

- Не редактируй и не коммить generated `skills/*/{agents,references,scripts}/shared-*`.
- Если нужно изменить общее поведение, меняй соответствующий файл в `skills/_shared/`.
- После изменений проверяй, что в source-only дереве не появились generated-копии:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

Команда должна вернуть `0`.

Для проверки установки без загрязнения рабочего дерева используй wrapper:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

Если нужно посмотреть временно развернутые 627 файлов, запускай:

```bash
MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes
```

## Canonical Interactive Chain
- `/analysis -> /brainstorm -> /brief -> /constitution -> /write-prd -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-001 -> /prd-to-tasks FT-001 -> /prd-to-tasks FT-002 -> ... -> /prd-to-tasks FT-N -> /verify task cards/artifacts -> /execute TASK-001 -> /verify TASK-001 -> /red-verify TASK-001 for T2/T3 -> /mb-sync`
