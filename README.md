# EN

`memobank_BMAD_SDD` is a memory-based agentic workflow system for AI-first development. It includes greenfield and brownfield workflows, a persistent project memory model, and a skill pack for agents as Codex CLI, Claude Code, OpenCode, etc.

It turns a repository into an agent-friendly workspace with:
- `.memory-bank/` for durable project knowledge
- `.protocols/` for resumable execution state
- `.tasks/` for runtime artifacts

Generated Memory Banks include `.memory-bank/constitution.md` for short project governing principles. The `/constitution` command creates or updates it; agents read it early during priming, and it does not replace invariants, contracts, or `spec-index.md`.

Install this source-only fork through its wrapper, not through `npx skills add` directly:

```bash
npx github:<owner>/<repo>
```

The wrapper starts an interactive installer. It prepares a temporary copy, generates the missing `shared-*` package files there, runs `skills add` against that prepared copy, bootstraps the target repository, and leaves this repository source-only.

[Full documentation here](README.en.md)

---

# RU

`memobank_BMAD_SDD` — это система агентной разработки с памятью для AI-first подхода. Она включает старт с нуля(greenfield) или внедрение в текущий проект(brownfield), постоянную модель памяти проекта и skill pack для таких агентных рантаймов, как Codex CLI, Claude Code, OpenCode и другие.

Он превращает репозиторий в удобное для агентов рабочее пространство с:
- `.memory-bank/` для долговременного знания о проекте
- `.protocols/` для возобновляемого состояния выполнения
- `.tasks/` для runtime-артефактов

Сгенерированный Memory Bank включает `.memory-bank/constitution.md` для коротких governing principles проекта. Команда `/constitution` создаёт или обновляет его; агенты читают его рано во время priming, и он не заменяет invariants, contracts или `spec-index.md`.

Устанавливай этот source-only форк через wrapper, а не через прямой `npx skills add`:

```bash
npx github:<owner>/<repo>
```

Wrapper запускает интерактивный installer. Во время установки он создаёт временную копию, генерирует в ней недостающие package-файлы `shared-*`, запускает `skills add` по подготовленной копии, bootstrap-ит целевой репозиторий и оставляет этот репозиторий source-only.

[Полная документация тут](README.ru.md)
