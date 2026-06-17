# Handoff: KISS-внедрение Purpose + Boundary Cards в memobank_BMAD_SDD

## 1. Намерение

Цель этого улучшения — добавить в `memobank_BMAD_SDD` легкий слой управления автономными AI-агентами, который поможет агентам лучше понимать цель задачи, границы изменения и критерии успешности, не превращая framework в тяжелую enterprise-систему с обязательными контрактами на каждый модуль.

Мы не внедряем полный GRACE-подход с обязательными XML-артефактами, жесткими `MODULE_CONTRACT` для каждого модуля и разметкой всего кода. Вместо этого берем полезное ядро:

- цель важнее пошаговой инструкции;
- агенту нужны понятные границы автономии;
- для критичных зон нужна легкая карта ответственности;
- execution context должен быть компактным и проверяемым;
- после багов и verification failures нужно улучшать не только код, но и гайды/правила работы агентов.

Функционал внедряется в стиле KISS: минимально, постепенно, без ломки текущего workflow.

---

## 2. Почему этот функционал нужен

Текущий `memobank_BMAD_SDD` уже хорошо решает проблему долговременной памяти, task records, verification, red-verification и sync. Но при AI-first разработке остается типовая проблема: агент может формально выполнить задачу, но сделать это не в том месте, не в той архитектурной зоне или с нарушением скрытого системного смысла.

Пример:

> Задача: "Добавить обязательный телефон при оплате".

Без явных границ агент может полезть в регистрацию, модель пользователя, корзину, payment provider, frontend checkout, backend checkout, миграции БД и middleware. Часть этих изменений может быть рабочей, но архитектурно лишней.

Нам нужен легкий механизм, который перед выполнением задачи отвечает агенту на вопросы:

- зачем существует задача;
- какой outcome считается успехом;
- где агент имеет право менять код;
- куда агенту нельзя лезть;
- какие границы модуля нельзя ломать;
- когда нужно остановиться и запросить replan;
- чем подтверждается корректность изменения.

Это не должно стать бюрократией. Это должно быть коротким навигационным слоем для агентов.

---

## 3. Ключевое решение

Не внедрять тяжелые `Module Contracts`.

Вместо них внедрить легкие:

```text
Module Boundary Cards
```

или кратко:

```text
Boundary Cards
```

Boundary Card — это не строгий контракт реализации. Это карточка ответственности для агента.

Она отвечает:

```text
Зачем существует эта зона системы?
Чем она владеет?
Чем она не владеет?
Какая у нее публичная поверхность?
Какие изменения агент может делать свободно?
Когда агент должен остановиться?
Как проверить, что изменение безопасно?
```

---

## 4. Что НЕ делать

Не надо внедрять полный GRACE.

Не надо:

- переводить Memory Bank в XML;
- требовать `MODULE_CONTRACT` на каждый файл;
- размечать каждую функцию semantic anchors;
- создавать graph для всех мелких helpers;
- заставлять агента править shared graph после каждой мелкой правки;
- добавлять сложный CLI до стабилизации формата;
- делать отдельную сущность для каждого UI-компонента;
- блокировать разработку из-за отсутствия Boundary Card для T0/T1 задач.

---

## 5. Что внедрить в KISS-варианте

### 5.1. Добавить Purpose-поля в task record

Расширить `TASK-*.task.json` минимальными полями:

```json
{
  "purpose": "Зачем существует эта задача",
  "success_outcome": "Какой наблюдаемый результат должен появиться",
  "anti_goals": [
    "Что нельзя делать ради закрытия задачи"
  ],
  "allowed_change_scope": [
    "src/checkout/**",
    "tests/checkout/**"
  ],
  "stop_conditions": [
    "нужно менять внешний контракт",
    "неясна бизнес-цель",
    "нужно менять auth/payment/db boundary"
  ],
  "boundary_refs": [
    "B-CHECKOUT"
  ]
}
```

Обязательность:

```text
T0: не обязательно
T1: желательно только purpose + success_outcome
T2: желательно purpose + success_outcome + allowed_change_scope + stop_conditions
T3: обязательно все поля
```

---

### 5.2. Добавить директорию Boundary Cards

Добавить:

```text
.memory-bank/boundaries/
  index.md
  B-CHECKOUT.md
  B-AUTH.md
  B-PAYMENT.md
  B-ORDER.md
```

Не нужно создавать десятки карточек сразу. На старте достаточно 3–7 ключевых зон проекта.

Рекомендуемые первые boundary cards:

```text
B-AUTH
B-CHECKOUT
B-PAYMENT
B-ORDER
B-DATABASE
B-EXTERNAL-INTEGRATIONS
```

---

### 5.3. Формат Boundary Card

Минимальный шаблон:

```md
# B-CHECKOUT — Checkout Boundary

## Goal
Провести пользователя от корзины к оплате/созданию заказа без потери состояния и с проверкой обязательных данных.

## Owns
- checkout flow
- checkout state
- required customer fields before payment
- payment-session trigger

## Does not own
- user registration
- catalog pricing
- delivery provider internals
- payment provider webhook processing

## Public surface
- checkout routes/API
- checkout UI flow
- payment-session creation call

## Allowed agent freedom
- may refactor internal validation
- may add local tests
- may improve error messages
- may update checkout-specific types

## Must stop and replan when
- payment provider contract must change
- auth/session model must change
- database schema change affects other boundaries
- task requires moving responsibility to another boundary

## Verification
- anonymous cart survives until checkout
- phone is required before payment
- registered user checkout still works
- payment session is not created with missing required fields
```

---

### 5.4. Добавить Execution Brief вместо тяжелого Execution Packet

Полный GRACE execution packet может быть слишком тяжелым. В KISS-варианте вводим:

```text
Execution Brief
```

Он может быть временным runtime artifact внутри `.protocols/<TASK_ID>/execution-brief.md`.

Шаблон:

```md
# Execution Brief: TASK-XXX

## Task
TASK-XXX — short title

## Purpose
...

## Success Outcome
...

## Relevant Boundary
- B-CHECKOUT

## Allowed Change Scope
- src/checkout/**
- tests/checkout/**

## Do Not Touch
- src/auth/**
- src/payment/webhooks/**
- database migrations unless explicitly approved

## Recommended Strategy
1. Inspect current checkout flow.
2. Add validation close to checkout/payment-session boundary.
3. Add or update local tests.
4. Run scoped verification.

## Stop Conditions
- Need to change payment provider contract.
- Need to change auth/session model.
- Existing checkout flow contradicts the task purpose.

## Evidence Required
- changed files list
- tests run
- verification result
- notes about boundary compliance
```

Правило:

```text
Для T2/T3 execute должен начинаться с Execution Brief.
Для T0/T1 Execution Brief можно не создавать.
```

---

### 5.5. Добавить Agent Guides, но только 2–3 штуки

Не делать библиотеку гайдов сразу. Начать с трех:

```text
.memory-bank/guides/
  implementation-guide.md
  verification-guide.md
  bug-fix-guide.md
```

Гайды должны быть рекомендательными, не пошаговыми скриптами.

Пример структуры:

```md
# Implementation Guide

## Goal
Реализовать задачу так, чтобы был достигнут product/system outcome, а не просто закрыт checklist.

## Recommended Strategy
- Сначала понять purpose задачи.
- Потом найти relevant boundary.
- Потом определить минимальный safe change scope.
- Затем внести изменение.
- После этого собрать evidence.

## Agent Freedom
Агент может менять порядок шагов, если это лучше ведет к цели.

## Hard Rules
- Не выходить за allowed_change_scope без replan.
- Не менять чужой boundary без явной причины.
- Не считать задачу выполненной без verification evidence.
- Если цель задачи противоречит boundary — остановиться.

## Output
Implementation handoff:
- changed files
- tests run
- evidence
- boundary notes
- follow-up risks
```

---

## 6. Изменения в существующих skills

### 6.1. `mb-init`

Добавить создание директорий:

```text
.memory-bank/boundaries/
.memory-bank/guides/
```

Добавить файлы:

```text
.memory-bank/boundaries/index.md
.memory-bank/guides/implementation-guide.md
.memory-bank/guides/verification-guide.md
.memory-bank/guides/bug-fix-guide.md
```

Не создавать конкретные boundary cards автоматически, кроме placeholder-примера `B-EXAMPLE.md`, если это удобно.

---

### 6.2. `prd-to-tasks`

При генерации задач для T2/T3 добавлять поля:

```json
{
  "purpose": "",
  "success_outcome": "",
  "anti_goals": [],
  "allowed_change_scope": [],
  "stop_conditions": [],
  "boundary_refs": []
}
```

Если boundary cards еще не существуют, агент должен предложить их создать, но не блокировать task slicing.

---

### 6.3. `execute`

Перед выполнением T2/T3 задачи:

1. Прочитать `purpose`.
2. Прочитать `success_outcome`.
3. Прочитать `boundary_refs`.
4. Сформировать краткий `Execution Brief`.
5. Проверить `allowed_change_scope`.
6. Выполнить задачу.
7. В handoff добавить `Boundary Compliance Notes`.

Пример handoff-секции:

```md
## Boundary Compliance Notes
- Used boundary: B-CHECKOUT
- Stayed inside allowed scope: yes
- Public surface changed: no
- Other boundaries touched: no
- Stop conditions triggered: no
```

---

### 6.4. `verify`

Добавить проверку:

```text
- достигнут ли success_outcome;
- не нарушены ли anti_goals;
- изменения не вышли за allowed_change_scope;
- boundary_refs соблюдены;
- evidence достаточно для следующего агента.
```

---

### 6.5. `red-verify`

Добавить semantic questions:

```text
- Не был ли выполнен checklist без достижения настоящей цели?
- Не переложил ли агент ответственность на другой boundary?
- Не создал ли агент скрытый архитектурный долг?
- Не требуется ли обновить Boundary Card или Guide?
```

---

### 6.6. `mb-sync`

После завершения T2/T3 задачи проверять:

```text
- нужно ли обновить boundary card;
- нужно ли добавить новый stop condition;
- нужно ли обновить guide;
- нужно ли создать follow-up task.
```

---

## 7. Новый optional skill: `mb-boundary`

Добавить не сразу, а после ручного обкатывания формата.

Назначение:

```text
/mb-boundary create B-CHECKOUT
/mb-boundary update B-CHECKOUT
/mb-boundary review B-CHECKOUT
```

MVP можно реализовать как command spec без CLI.

Поведение:

```text
Создай или обнови Boundary Card.
Держи формат коротким.
Не описывай внутреннюю реализацию.
Фокусируйся на goal, owns, does not own, public surface, stop conditions, verification.
```

---

## 8. Tier policy

Рекомендуемая политика:

| Tier | Boundary Card | Purpose fields | Execution Brief |
|---|---|---|---|
| T0 | не нужно | не нужно | не нужно |
| T1 | редко | purpose + success_outcome желательно | не нужно |
| T2 | желательно | обязательно | желательно |
| T3 | обязательно | обязательно | обязательно |

---

## 9. Как это связано с PCAM

PCAM говорит:

```text
Цель важнее инструкции.
Агенту нужен гайд, а не жесткий план.
Жесткость нужна в протоколах, tools и границах ответственности.
Агент должен уметь адаптироваться и самоисправляться.
Результаты сбоев должны улучшать гайды и инструменты.
```

Boundary Cards и Execution Brief реализуют это практически:

```text
Purpose → зачем задача нужна
Boundary → где агент имеет право действовать
Guide → как думать и действовать
Stop Conditions → когда нельзя импровизировать
Evidence → чем доказать успех
Sync/Feedback → как улучшить систему после выполнения
```

---

## 10. Как это связано с GRACE

Из GRACE берем не тяжелую форму, а полезное ядро:

```text
GRACE Module Contract      → KISS Boundary Card
GRACE Execution Packet     → KISS Execution Brief
GRACE Verification Plan    → task.verify + verification-guide
GRACE Knowledge Graph      → boundaries/index.md + boundary_refs
GRACE Refresh              → mb-sync boundary/guide update checks
```

---

## 11. Acceptance Criteria

Внедрение можно считать успешным, если:

1. В skeleton Memory Bank появились `boundaries/` и `guides/`.
2. Для T2/T3 task records можно указать `purpose`, `success_outcome`, `allowed_change_scope`, `stop_conditions`, `boundary_refs`.
3. `/execute` для T2/T3 создает или использует Execution Brief.
4. `/verify` проверяет не только acceptance criteria, но и success outcome / scope / boundary compliance.
5. `/red-verify` умеет ловить “ложный успех”, когда задача выполнена формально, но нарушает системную цель.
6. `/mb-sync` может рекомендовать обновление Boundary Card или Guide после выполнения задачи.
7. Framework не требует Boundary Cards для мелких T0/T1 задач.
8. Внутренняя реализация модулей остается гибкой и не блокируется карточками ответственности.

---

## 12. Recommended Implementation Order

### Phase 1 — Documentation-only MVP

1. Добавить директории:
   - `.memory-bank/boundaries/`
   - `.memory-bank/guides/`

2. Добавить шаблоны:
   - `boundaries/B-EXAMPLE.md`
   - `guides/implementation-guide.md`
   - `guides/verification-guide.md`
   - `guides/bug-fix-guide.md`

3. Обновить README/howItWorks:
   - описать Boundary Cards;
   - объяснить, что они optional и tier-based;
   - показать пример.

---

### Phase 2 — Task Schema Lite

Добавить в task schema optional fields:

```json
{
  "purpose": "string",
  "success_outcome": "string",
  "anti_goals": ["string"],
  "allowed_change_scope": ["string"],
  "stop_conditions": ["string"],
  "boundary_refs": ["string"]
}
```

Все поля optional на уровне schema, но обязательность регулируется tier policy.

---

### Phase 3 — Execute/Verify Integration

Обновить:

```text
mb-execute
mb-verify
mb-red-verify
mb-sync
```

Минимальные изменения:

- `execute` читает purpose/boundary и пишет Boundary Compliance Notes;
- `verify` проверяет outcome/scope/boundary;
- `red-verify` проверяет ложный успех;
- `mb-sync` предлагает обновления для guides/boundaries.

---

### Phase 4 — Optional `mb-boundary`

После ручной проверки формата добавить skill:

```text
mb-boundary
```

Не делать раньше, чтобы не заморозить плохой формат.

---

## 13. Final Recommendation

Внедрять это нужно как легкий слой поверх текущей системы, а не как архитектурную революцию.

Главная формула:

```text
Boundary Card не говорит агенту, как писать код.
Boundary Card говорит агенту, где находится ответственность и где нельзя импровизировать.
```

KISS-цель:

```text
Добавить агентам больше понимания цели и границ,
не увеличивая бюрократию для человека и не ограничивая развитие продукта.
```

Итоговый workflow должен выглядеть так:

```text
Task Purpose
→ Relevant Boundary
→ Execution Brief
→ Scoped Execute
→ Outcome/Boundary Verify
→ Red Verify for false success
→ Sync Guides/Boundaries if needed
```

Это даст практическую пользу PCAM/GRACE-подходов без тяжелой цены полного GRACE.
