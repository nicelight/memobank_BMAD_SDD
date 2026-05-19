---
description: Синхронизация Memory Bank после изменения: обновить индексы, RTM/backlog и changelog.
status: active
---
# /mb-sync — Memory Bank sync

Используй после любой значимой задачи.

Follow: `.memory-bank/workflows/mb-sync.md`

Минимальный чеклист:
- [ ] Обновить релевантные `.memory-bank/*` (WHY/WHERE, без псевдокода)
- [ ] Обновить `.memory-bank/index.md` и подпапочные роутеры
- [ ] Обновить RTM/REQ lifecycle в `.memory-bank/requirements.md`
- [ ] Если у EP/FT есть `lifecycle`, синхронизировать его отдельно от document `status`
- [ ] Обновить authoritative task records в `.memory-bank/tasks/index.json` и indexed `*.task.json`
- [ ] Refresh `.memory-bank/tasks/backlog.md` only as a readable summary/router
- [ ] Записать changelog `.memory-bank/changelog.md`
- [ ] Для `/autonomous`: lint/link consistency — blocking gate, не optional

Task synchronization rule:
- JSON task records are authoritative for task status, dependencies, risk, gates, verification targets, and evidence markers.
- `backlog.md` must not contain markdown task cards or a separate source-of-truth task state.
- RTM, backlog summary, and changelog should be reconciled from JSON task records.
