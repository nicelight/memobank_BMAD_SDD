---
description: Template for .protocols/TASK-XXX/plan.md (execution plan + MB-SYNC).
status: active
---
# Plan — <TASK_ID>

## Goal

## Non-goals

## Inputs / source specs
- Task record: `.memory-bank/tasks/<TASK_ID>.task.json`
- Task index: `.memory-bank/tasks/index.json`
- Feature/Epic: ...
- REQ IDs: ...

## Richer execution inputs (optional)
- Source Artifacts: ...
- Normative Inputs: ...
- Verification Targets: ...

## Fallback basis
- If richer inputs are absent, record the classic basis used for execution:
  - feature doc
  - requirements / RTM
  - duo docs
  - related contracts / states / runbooks / testing docs (if needed)

## Constraints / invariants (MUST / NEVER)
- MUST: ...
- NEVER: ...

## Scope
### In scope

### Out of scope

## Proposed changes
### Touched areas (hypotheses OK)
- `path/to/file` — why

## Quality gates
- [ ] lint/typecheck: `<cmd>`
- [ ] unit tests: `<cmd>`
- [ ] integration tests: `<cmd>`
- [ ] e2e/UAT: `<cmd>`

## Fan-out plan (if needed)
- Worker A: scope ...
- Worker B: scope ...

## MB-SYNC (required)
Follow: `.memory-bank/workflows/mb-sync.md`

Checklist:
- [ ] Update `.memory-bank/` docs (WHY/WHERE, no pseudocode)
- [ ] Update `.memory-bank/index.md` routers (if needed)
- [ ] Update RTM in `.memory-bank/requirements.md`
- [ ] Update task record and `.memory-bank/tasks/index.json` if task state changed
- [ ] Append entry to `.memory-bank/changelog.md`

## Definition of done
- ...

