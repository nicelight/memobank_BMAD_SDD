---
description: Единая точка входа — выбрать сценарий и запустить правильный флоу (analysis / PRD / map-codebase / skeleton-only).
status: active
---
# /cold-start — Bootstrap router (choose the right flow)

<objective>
Дать одну удобную команду “с чего начать”, которая:
- определяет сценарий (greenfield / brownfield / skeleton-only)
- запускает правильный следующий шаг
- не генерирует EP/FT/TASK без PRD
  - не обходит PRD-level clarification перед task decomposition
</objective>

<process>

## 0) Предусловия
Эта команда предполагает, что skeleton уже создан (есть `.memory-bank/`).
Если `.memory-bank/` отсутствует — сначала создай skeleton (например, запусти `init-mb.js`), затем вернись сюда.

## 1) Определи сценарий (не угадывай)
Проверь:
- Есть ли `prd.md`?
- Есть ли `.memory-bank/analysis/product-brief.md`?
- Есть ли `.memory-bank/analysis/brainstorming.md` или другой durable brainstorming artifact?
- Есть ли существенный код (например: `src/`, `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`)?
- Насколько вход пользователя ясен: vague idea / clear concept / existing PRD?

Выбор:
- **Если есть код** → это **brownfield** → сначала запусти `/map-codebase` для as-is baseline.
- **Если есть и код, и PRD / product brief / clear delta** → сначала `/map-codebase`, потом `/write-prd` и `/prd` как delta.
- **Если кода почти нет и есть PRD** → это **greenfield with existing PRD** → перенеси/нормализуй PRD через `/write-prd`, затем запусти `/prd`.
- **Если кода почти нет и есть `.memory-bank/analysis/product-brief.md`** → запусти `/write-prd`, затем `/prd`.
- **Если кода почти нет и концепт ясен, но PRD нет** → запусти `/brief`, затем `/write-prd`, затем `/prd`.
- **Если кода почти нет и идея сырая / направление нестабильно** → запусти `/analysis`; `/analysis` должен направить в `/brainstorm` или `/brief`.
- **Если есть brainstorming artifact, но нет product brief и PRD** → запусти `/brief` перед `/prd`.
- **Если нет кода и нет PRD / clear concept / analysis artifacts** → это **skeleton-only**: попроси пользователя предоставить PRD, product brief или хотя бы требования текстом и остановись.

## 2) Правила (важно)
- Если **нет PRD**, ты **НЕ** создаёшь/заполняешь:
  - `.memory-bank/epics/*`
  - `.memory-bank/features/*`
  - `.memory-bank/tasks/*.task.json` реальными задачами
  - `.memory-bank/tasks/index.json` ссылками на реальные TASK-IDs
- Пустой skeleton допустим:
  - папки/файлы могут существовать после `mb-init` / `init-mb.js`
  - но roadmap-сущности, реальные TASK-IDs и task records без PRD не создаются
- Если PRD есть, но пользователь временно недоступен:
  - фиксируй `Open questions` в `.protocols/PRD-BOOTSTRAP/decision-log.md`
  - **останавливайся и жди** (не выдумывай факты).
- Analysis artifacts живут в `.memory-bank/analysis/` и являются durable Memory Bank artifacts, но Analysis не обязателен для каждого проекта.
- Product Brief — upstream input contract для `/prd`, а не PRD, backlog или task plan.
- `/cold-start` никогда не рекомендует `/prd-to-tasks` напрямую. Канонический downstream: `/write-prd` → `/prd` → `/prd-to-tasks FT-<NNN>`.
- `/prd-to-tasks` must not run while PRD clarification is pending/blocked or a targeted feature is explicitly pending/blocked.

## 3) После запуска флоу
После `/prd` или `/map-codebase`:
- запусти `/review` (fresh context)
- interactive: выбери фичу, при необходимости пройди `/clarify-feature FT-<NNN>`, затем `/prd-to-tasks FT-<NNN>` и выполняй задачи через `/execute` → `/verify` → `/red-verify` (если задача T2/T3) → `/mb-sync`
- JSON task queue unattended: используй `/autopilot`
- full unattended (`PRD → done`): используй `/autonomous`
</process>
