# EN

`memobank_BMAD_SDD` is a memory-based agentic workflow system for AI-first development. It includes greenfield and brownfield workflows, a persistent project memory model, and a skill pack for agents as Codex CLI, Claude Code, OpenCode, etc.

It turns a repository into an agent-friendly workspace with:
- `.memory-bank/` for durable project knowledge
- `.protocols/` for resumable execution state
- `.tasks/` for runtime artifacts

Install this source-only fork through its wrapper, not through `npx skills add` directly:

```bash
npx github:<owner>/<repo> --skill '*' --global --yes
```

During installation the wrapper prepares a temporary copy, generates the missing `shared-*` package files there, runs `skills add` against that prepared copy, and leaves this repository source-only.

[Full documentation here](README.en.md)

---

# RU

`memobank_BMAD_SDD` — это система агентной разработки с памятью для AI-first подхода. Она включает старт с нуля(greenfield) или внедрение в текущий проект(brownfield), постоянную модель памяти проекта и skill pack для таких агентных рантаймов, как Codex CLI, Claude Code, OpenCode и другие.

Он превращает репозиторий в удобное для агентов рабочее пространство с:
- `.memory-bank/` для долговременного знания о проекте
- `.protocols/` для возобновляемого состояния выполнения
- `.tasks/` для runtime-артефактов

Устанавливай этот source-only форк через wrapper, а не через прямой `npx skills add`:

```bash
npx github:<owner>/<repo> --skill '*' --global --yes
```

Во время установки wrapper создаёт временную копию, генерирует в ней недостающие package-файлы `shared-*`, запускает `skills add` по подготовленной копии и оставляет этот репозиторий source-only.

[Полная документация тут](README.ru.md)
