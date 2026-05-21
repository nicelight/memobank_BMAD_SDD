---
description: Превращение PRD в Memory Bank — product brief, требования, эпики, фичи, RTM.
status: active
---
# /prd — PRD → Memory Bank

<objective>
Превратить PRD (`prd.md` или текст пользователя) в:
- продуктовый бриф (L1)
- требования (REQ-IDs) + RTM
- эпики (L2)
- фичи (L3) с clarification metadata
- базовую стратегию тестирования
- обновлённый индекс Memory Bank

Важно:
- `/prd` **не создаёт задачи** (TASK-IDs) автоматически.
- Analysis перед PRD optional: если `.memory-bank/analysis/product-brief.md` есть, используй его как primary upstream source.
- Перед генерацией PRD-derived Memory Bank docs прочитай `.memory-bank/constitution.md` и блокируй явные конфликты.
- Deep Questioning в `/prd` остаётся PRD-level discovery.
- Clarification — отдельный feature-level ambiguity gate после создания feature doc.
- Декомпозиция в задачи делается **точечно по фиче** через `/prd-to-tasks FT-<NNN>` (это снижает риск спекулятивной генерации “валом”).
- Канонический planning path: `/prd` → `/clarify FT-<NNN>` → `/prd-to-tasks FT-<NNN>`.
- `/prd-to-tasks` must not run while clarification is pending or missing.
</objective>

<process>

## 0) Протокол
Создай (если нет):
- `.protocols/PRD-BOOTSTRAP/plan.md`
- `.protocols/PRD-BOOTSTRAP/decision-log.md`

Режимы:
- **interactive** (по умолчанию): можно ждать пользователя между раундами вопросов
- **autonomous** (если вызвано из `/autonomous`): non-blocking пробелы оформляй как `Assumption`, blocking пробелы переводят run в `HALT_BLOCKING_QUESTIONS`

## 1) Прочитай PRD
Прочитай доступные upstream inputs:
- `.memory-bank/analysis/product-brief.md`, если есть
- `.memory-bank/constitution.md`, если есть
- `prd.md`, если есть
- текст пользователя, если PRD передан inline
- `.memory-bank/analysis/brainstorming.md` или другой brainstorming artifact только как supporting context, если есть

Правила выбора источника:
- Если `.memory-bank/analysis/product-brief.md` есть, он является **primary upstream source** для `/prd`.
- Если одновременно есть product brief и `prd.md`, сопоставь их и явно зафиксируй противоречия / deltas в `decision-log.md`.
- Если product brief отсутствует, но есть existing PRD (`prd.md` или текст пользователя), продолжай обычный `/prd` flow напрямую.
- Если PRD отсутствует, product brief отсутствует, но brainstorming artifact есть, предупреди: сначала нужен `/brief`; остановись, если пользователь явно не просит продолжить с override.
- Если нет ни PRD, ни product brief, попроси пользователя вставить PRD текст или сначала пройти `/brief` для clear concept / `/analysis` для vague idea.

Constitution gate:
- If `.memory-bank/constitution.md` exists, treat it as governing input for scope, non-goals, task model, verification expectations, and no-speculation rules.
- If the PRD, product brief, or user text conflicts with the Constitution, stop before generating or updating PRD-derived docs.
- Report the conflicting principle(s), the conflicting PRD/source statement, and ask for explicit user resolution or a `/constitution` amendment.
- Do not weaken or reinterpret the Constitution silently during `/prd`.
- Do not invent new domain principles while resolving PRD gaps; record them as questions, assumptions, or blockers unless grounded in evidence.

Blocked brief rule:
- Если product brief помечен как blocked / no-go / not ready / has blocking open questions, остановись и попроси закрыть brief.
- Разрешено продолжить только при явном user override.
- Даже с override все blocking gaps должны быть перенесены в `decision-log.md` и не должны закрываться выдуманными facts.

## 2) Deep Questioning (раундами)
- 3–5 вопросов за раунд.
- После раунда:
  - коротко суммируй
  - обнови `decision-log.md`
  - покажи следующий раунд вопросов.

Если пользователь временно недоступен (ты “ушёл”):
- зафиксируй список `Open questions` в `decision-log.md`,
- в **interactive** режиме — **остановись и жди**
- в **autonomous** режиме:
  - non-blocking gaps → зафиксируй как assumptions и продолжай
  - blocking gaps → остановись с terminal state `HALT_BLOCKING_QUESTIONS`

## 3) Обнови product.md
Заполни `.memory-bank/product.md`:
- what this is
- core value
- audience
- primary user flow
- constraints/non-goals

## 4) Требования и трассируемость
Обнови `.memory-bank/requirements.md`:
- REQ-001…
- Out of scope
- RTM: REQ → Epic → Feature → Test

## 5) Создай epics/
Для каждого эпика:
- `.memory-bank/epics/EP-<NNN>-<slug>.md`
- value, success metrics, acceptance criteria
- optional, if grounded in evidence: `Source artifacts`, `Normative inputs`, `Constraints / invariants`
 - `status: draft` по умолчанию (переводи в active после закрытия Open questions)

## 6) Создай features/
Для каждой фичи:
- `.memory-bank/features/FT-<NNN>-<slug>.md`
- frontmatter:
  - `clarification_status: pending`
  - `last_clarified: null`
  - `clarification_questions: 0`
- use cases
- acceptance criteria
- edge cases & failure modes
- test strategy pointers
- optional, if grounded in evidence: `Source artifacts`, `Normative inputs`, `Constraints / invariants`, `Verification targets`
 - `status: draft` по умолчанию

Новые feature docs всегда начинают с `clarification_status: pending`.
`/prd` не закрывает feature-level ambiguity и не ставит `clarification_status: complete`.
Product Brief override не меняет этот gate и не разрешает переходить сразу к `/prd-to-tasks`.

## 7) Testing index
Обнови `.memory-bank/testing/index.md`:
- quality gates
- unit/integration/e2e
- анти-чит правила

## 8) Index
Обнови `.memory-bank/index.md`:
- добавить аннотированные ссылки

## 9) Gate
Запусти `mb-review` (fresh context).

## 10) Что дальше
- interactive: выбери одну фичу, запусти `/clarify FT-<NNN>`, затем `/prd-to-tasks FT-<NNN>`
- autonomous end-to-end: запусти `/autonomous`

Не рекомендуй `/prd-to-tasks` без `/clarify FT-<NNN>` и `clarification_status: complete`.
</process>
