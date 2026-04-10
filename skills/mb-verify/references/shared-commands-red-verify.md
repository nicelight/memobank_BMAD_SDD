---
description: Adversarial semantic verification задачи (TASK-XXX) для поиска "дисциплинированно, но по существу неверно".
status: active
---
# /red-verify — Adversarial semantic verification

<objective>
Проверить, что реализованная задача правильна **по существу**, а не только по process/evidence surface.

Этот проход должен ловить ситуации:
- acceptance criteria формально выполнены, но решена не та проблема
- локально всё выглядит корректно, но решение вредит системе целиком
- реализация переоптимизирована под task card и игнорирует соседние ограничения
- появляются drift, state inconsistency, operational risks или скрытая стоимость сопровождения

Разделение ролей:
- `/verify` → "выполнено ли по AC/REQ и есть ли evidence?"
- `/review` → "достаточно ли качественен сам Memory Bank / planning surface?"
- `/red-verify` → "это вообще хорошее и правильное решение в substance?"
</objective>

<when-to-use>
Особенно полезно, если:
- менялись `contracts/*`, `states/*`, миграции, схемы, data behavior
- задача затрагивает несколько feature/module boundaries
- меняется runtime/API behavior
- задача доменно-нагруженная или business-rule-heavy
- AC можно выполнить узко и при этом промахнуться мимо true intent
- изменение архитектурно рискованное или может создать скрытую future cost
</when-to-use>

<when-not-to-use>
Обычно не нужно для:
- typo-only изменений
- formatting-only изменений
- изолированных механических рефакторингов без behavioral impact
</when-not-to-use>

<process>

0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

1) Не anchor слишком рано на full spec surface
Сначала прочитай в таком порядке:
- task intent из `.memory-bank/tasks/backlog.md`, linked FT/REQ и `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- `.protocols/TASK-<ID>/verification.md`, если уже есть
- реальный change surface:
  - изменённые файлы / diff
  - тесты
  - логи, screenshots, traces и другие artifacts в `.tasks/TASK-<ID>/`

Только после этого подтягивай:
- релевантные `contracts/*`
- `states/*`
- `runbooks/*`
- `invariants.md`
- `requirements.md`
- другие spec docs, если они нужны для reconciliation

Важно:
- не начинай с предположения, что task card и verify verdict уже доказывают correctness
- сначала сформируй независимую hostile модель риска
- затем сравни её со specs и кодом

2) Построй hostile hypothesis list
Проверь как минимум:
- решена ли реальная задача, а не её удобная локальная интерпретация
- нет ли local optimization с системным вредом
- не нарушены ли implicit boundaries, invariants, contracts, state transitions
- не стал ли код хрупче, сложнее или дороже в сопровождении без достаточной причины
- не создаёт ли решение ложную уверенность за счёт слишком узких тестов/AC

3) Проверь cross-boundary substance
Отдельно оцени:
- cross-feature/module impact
- architectural drift
- state/data consistency
- operational behavior (retries, observability, migrations, failure modes)
- future maintenance cost

4) Заполни `.protocols/TASK-<ID>/red-verification.md`
Используй шаблон проекта, если он есть.
Отчёт должен быть коротким, но содержать:
- semantic verdict
- top substance risks
- hidden assumptions
- cross-boundary impact
- architectural concerns
- state/data consistency concerns
- operational concerns
- future maintenance cost
- "how this could still be wrong"
- counterproposal / escalation path

5) Сохрани короткий артефакт в `.tasks/TASK-<ID>/`
Например:
- `.tasks/TASK-<ID>/<TASK_ID>-S-RED-VERIFY-final-report-docs-01.md`

6) Вердикт
- `semantic-pass`:
  - substantive concerns не обнаружены
  - можно завершать loop через `/mb-sync`

- `semantic-concern`:
  - есть серьёзные сомнения или hidden assumptions, но не доказан прямой semantic break
  - создай follow-up task или подними human escalation
  - не закрывай wave как "надежно завершённую" без явного решения по риску

- `semantic-fail`:
  - решение по существу неверно, вредно или слишком рискованно
  - заведи bug doc в `.memory-bank/bugs/BUG-<short>.md`
  - добавь follow-up task в backlog
  - текущую задачу пометь `failed` или верни в `blocked` по контексту репозитория
  - downstream dependents не продвигай

7) Место в normal loop
Рекомендуемый порядок:
- `/execute TASK-<ID>`
- `/verify TASK-<ID>`
- `/red-verify TASK-<ID>` для рискованных задач
- `/mb-sync`

</process>
