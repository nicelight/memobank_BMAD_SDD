---
description: Синхронизация Memory Bank после изменения: обновить индексы, RTM/task records и changelog.
status: active
---
# /mb-sync — Memory Bank sync

Используй после любой значимой задачи.

Follow: `.memory-bank/workflows/mb-sync.md`

Минимальный чеклист:
- [ ] Обновить релевантные `.memory-bank/*` (WHY/WHERE, без псевдокода)
- [ ] Если есть `.memory-bank/analysis/*`, синхронизировать durable Analysis artifacts как часть Memory Bank; если их нет, не создавать их автоматически
- [ ] Обновить `.memory-bank/index.md` и подпапочные роутеры
- [ ] Если менялись governance/workflow/routing/agent instructions/tier policy, проверить consistency с `.memory-bank/constitution.md`
- [ ] Обновить RTM/REQ lifecycle в `.memory-bank/requirements.md`
- [ ] Если у EP/FT есть `lifecycle`, синхронизировать его отдельно от document `status`
- [ ] Проверить, что task records ссылаются только на features с `clarification_status: complete`
- [ ] Обновить authoritative task records в `.memory-bank/tasks/index.json` и indexed `*.task.json`
- [ ] Записать changelog `.memory-bank/changelog.md`
- [ ] Для `/autonomous` и `/autopilot`: `/mb-doctor --strict` после sync — blocking gate, не optional

Task synchronization rule:
- Analysis artifacts in `.memory-bank/analysis/` are durable Memory Bank artifacts, but optional.
- If `.memory-bank/analysis/product-brief.md` exists, keep downstream docs consistent with it or record explicit deltas / override notes.
- If brainstorming artifacts exist without a product brief, preserve them and warn that `/brief` is the expected bridge before `/prd` unless an existing PRD was intentionally used.
- When governance, workflow, routing, AGENTS.md, MBB, spec-index, invariants, task schema, or tier policy changes, compare affected docs with `.memory-bank/constitution.md`.
- If the change contradicts the Constitution, stop sync and require either a minimal doc correction or explicit `/constitution` amendment.
- Do not use `/mb-sync` to invent new governing principles; only reconcile documented changes and evidence.
- JSON task records are authoritative for task status, dependencies, tier, gates, verification targets, and evidence markers.
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.
- RTM and changelog should be reconciled from JSON task records.
- During sync, apply explicit promotion `planned -> ready` for tasks whose `depends_on` are all `done` and that have no blockers / blocking review rejects / unresolved semantic-concern.
- Do not promote tasks whose `feature` points to missing clarification metadata or `clarification_status: pending`.
- Do not promote tasks with failed/blocked upstream dependencies, open blocking bugs, or unresolved semantic concern decisions.
- `T2` / `T3` tasks may close only when full protocol closure expectations are present. `T2` requires `/verify` and `/red-verify`; `T3` also requires a human-aware checkpoint and rollback/recovery note.
- `mb-doctor` is the readiness gate over `mb-lint`; in autonomous/autopilot runs, dependents may be promoted only after strict doctor passes.
