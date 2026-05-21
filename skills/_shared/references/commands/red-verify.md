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
- реализация переоптимизирована под локальную task interpretation и игнорирует соседние ограничения
- появляются drift, state inconsistency, operational risks или скрытая стоимость сопровождения

Разделение ролей:
- `/verify` → "выполнено ли по AC/REQ и есть ли evidence?"
- `/review` → "достаточно ли качественен сам Memory Bank / planning surface?"
- `/red-verify` → "это вообще хорошее и правильное решение в substance?"
</objective>

<when-to-use>
Required by tier:
- `T2` and `T3` tasks must run `/red-verify` before closure.
- `T0` and `T1` tasks usually do not need `/red-verify` unless their real scope grew beyond the recorded tier; in that case update `task.tier` first.

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
- task intent из `.memory-bank/tasks/TASK-<ID>.task.json` через `.memory-bank/tasks/index.json`
- linked FT/REQ и `.protocols/TASK-<ID>/plan.md`
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
- if the task record has no `tier`, stop with an explicit error
- authoritative red-verification routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used
- не начинай с предположения, что task record и verify verdict уже доказывают correctness
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

Для `T3` обязательно добавь отдельную проверку:
- critical/security concerns
- deploy/runtime/production failure modes
- irreversible/data-loss, compliance, payments, or secrets exposure concerns when relevant
- rollback/recovery note is present and credible
- human-aware checkpoint is present before autonomous closure

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
  - closure-eligible for normal `done` when `/verify` also has `PASS`
  - можно завершать loop через `/mb-sync`

- `semantic-concern`:
  - есть серьёзные сомнения или hidden assumptions, но не доказан прямой semantic break
  - not closure-eligible for normal `done`
  - до продолжения wave требуется явное решение: block task/dependents или оставить task `in_progress` pending human review
  - если human review принимает concern, зафиксируй owner/reason, обнови work/evidence as needed и повтори `/red-verify`; normal `done` разрешён только после `semantic-pass`
  - если выбран follow-up, добавь его как JSON task record и обнови `tasks/index.json`
  - не продвигай dependents, пока задача не получила `semantic-pass`

- `semantic-fail`:
  - решение по существу неверно, вредно или слишком рискованно
  - заведи bug doc в `.memory-bank/bugs/BUG-<short>.md`
  - добавь follow-up task как JSON task record и обнови `tasks/index.json`
  - текущую задачу пометь `failed`
  - downstream dependents не продвигай

7) Место в normal loop
Рекомендуемый порядок:
- `/execute TASK-<ID>`
- `/verify TASK-<ID>`
- `/red-verify TASK-<ID>` для `T2` / `T3`
- `/mb-sync`

</process>
