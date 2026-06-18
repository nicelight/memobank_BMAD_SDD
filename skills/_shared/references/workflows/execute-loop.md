---
description: Workflow: PRD → FT → TASK loop (interactive or autonomous).
status: active
---
# Execute loop (PRD → Feature → Tasks)

## Principle: no task explosion
- `/prd` creates L1–L3 only (product/requirements/epics/features/testing/index).
- `/write-prd` = PRD-level ambiguity closure. `/clarify-feature` = optional feature-level ambiguity pass.
- `/spec-init` creates the lightweight SDD route map after `/write-prd` and before `/prd`.
- `/spec-design` is mandatory after `/prd`; it records a minimal backbone for simple T0/T1 projects or full shared backbone for shared/T2/T3 concerns, may create one first foundation task when a minimum executable baseline is needed, and does not replace per-feature `/spec-improve`.
- `/spec-improve FT-<NNN>` completes or marks unnecessary feature-level design before task decomposition.
- Feature tasks are created via `/prd-to-tasks FT-<NNN>` after `/prd` creates clear feature docs and SDD design status is ready. The only earlier task exception is a first foundation task from `/spec-design` when a minimum executable baseline is needed. After the full FT-* set is decomposed, run `/verify` on the generated JSON task records/artifacts, then start `/execute`.

## Interactive mode (you stay)
1) `/analysis -> /brief` when idea discovery is needed; use `/brainstorm` before `/brief` only for raw ideas
2) `/constitution` for contextual governing principles when `.memory-bank/constitution.md` is missing or `project_principles` is framework-default|skipped|missing; if principles are already ratified/partial, continue to `/write-prd`; if explicitly skipped, continue with framework-default/skipped principles
3) `/write-prd` (creates clarified .memory-bank/prd.md)
4) `/spec-init` (updates .memory-bank/spec-backbone.md framing and .memory-bank/spec-index.md registry)
5) `/prd` (fills L1–L3)
6) `/spec-design` (mandatory; minimal is valid for simple T0/T1-only scope)
7) Pick one top feature; use `/clarify-feature FT-001` only for explicit feature blockers
8) `/spec-improve FT-001` (updates only needed SDD specs or marks not_required)
9) `/prd-to-tasks FT-001` (creates IMPL plan + TASK-* for this feature)
10) Run `/mb-doctor` when task records change; use `/mb-doctor --strict` before autonomous handoff
11) Execute tasks from `.memory-bank/tasks/index.json` and indexed `*.task.json` records one-by-one:
   - `/verify generated JSON task records/artifacts -> /execute first indexed TASK -> /verify same TASK -> /red-verify same TASK for T3 (optional for T2 task closure) -> /mb-sync`
   - after all tasks for a T2 feature are implemented, run `/red-verify --feature FT-<ID>` before treating the feature as complete
   - start `/execute` only after all targeted FT-* have been decomposed and the pre-execution `/verify` gate has passed
   - for T2/T3, validate canonical `.memory-bank/packets/TASK-XXX.packet.json` before `/execute`; for T0/T1, validate a packet only when `task.runtime_context.packet_required === true`
12) After each wave: `/review` (fresh context)

## Autonomous end-to-end mode (start and leave)
1) `/autonomous`
2) command runs `/write-prd -> /spec-auto --init -> /prd -> /spec-design --all -> /spec-auto --all -> /prd-to-tasks --all`, then schedules ready TASKs
3) run `/mb-doctor --strict` before scheduler execution; T2/T3 tasks without SDD spec links are blockers
4) before `/execute`, scheduler checks required packets for every T2/T3 task and explicit T0/T1 packet requirement; missing/blocked/stale/invalid packets stop execution and require `/mb-packet TASK-XXX` or blocker resolution
5) each TASK runs in **fresh CLI sessions**
6) after each `/mb-sync`, run `/mb-doctor --strict` before promoting dependents
7) after each wave: `/review`
8) final success only if last review = `APPROVE`, `/mb-doctor --strict` passes, and no blocking tasks remain

## Autonomous executor only
If JSON task records already exist and review gate already passed, use:
- `/autopilot`

`/autopilot` must run `/mb-doctor --strict` before each task selection pass and after each `/mb-sync` before promotion.

Codex (implement, then verify when the tier requires a separate verifier):
~~~bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/commands/execute.md, the indexed task record, and .memory-bank/workflows/tier-policy.md. For T2/T3, read and validate .memory-bank/packets/TASK-123.packet.json before implementation; for T0/T1, do that only when task.runtime_context.packet_required is true. Stop on missing/blocked/stale/invalid required packet. Use tier-appropriate .protocols/TASK-123/ state. Implement only scoped changes. Record evidence. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. For T2/T3 only: read AGENTS.md, .memory-bank/commands/verify.md, the indexed task record, .memory-bank/workflows/tier-policy.md, full protocol, and acceptance criteria. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL.'
~~~

Claude (implement, then verify when the tier requires a separate verifier):
~~~bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/commands/execute.md, the indexed task record, and .memory-bank/workflows/tier-policy.md. For T2/T3, read and validate .memory-bank/packets/TASK-123.packet.json before implementation; for T0/T1, do that only when task.runtime_context.packet_required is true. Stop on missing/blocked/stale/invalid required packet. Use tier-appropriate .protocols/TASK-123/ state. Implement only scoped changes. Record evidence. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. For T2/T3 only: read AGENTS.md, .memory-bank/commands/verify.md, the indexed task record, .memory-bank/workflows/tier-policy.md, full protocol, and acceptance criteria. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
~~~

## Parallel vs sequential
- Independent tasks (no shared files) MAY run in parallel (separate sessions).
- Dependent or shared-file tasks MUST run sequentially: TASK-A (execute→tier-appropriate verify→red-verify if required by tier→mb-sync) → TASK-B.
