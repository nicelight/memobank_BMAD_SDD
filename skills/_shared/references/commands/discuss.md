---
description: Прояснение неизвестных и противоречий перед реализацией — вопросы и decision log.
status: active
---
# /discuss — Clarify before coding

<objective>
Снизить риск неправильной реализации: выявить неизвестные, противоречия и скрытые требования.
</objective>

<process>

1) Прочитай релевантные документы Memory Bank + PRD.
2) Составь список:
- ambiguities
- decisions needed
- risks
3) Задай пользователю вопросы (раунд 3–5).
4) Зафиксируй ответы в `.protocols/<ID>/decision-log.md`.
5) Обнови `requirements.md`/`feature.md` при необходимости.

Если после обсуждения всё ясно:
- предложи `/prd`, `/brief` или `/clarify FT-<NNN>` по текущему состоянию материалов;
- предлагай `/prd-to-tasks FT-<NNN>` только если feature doc уже содержит явное `clarification_status: complete`;
- предлагай `/execute TASK-<ID>` только для существующего JSON task record `.memory-bank/tasks/TASK-<ID>.task.json`, проиндексированного в `.memory-bank/tasks/index.json`.
</process>
