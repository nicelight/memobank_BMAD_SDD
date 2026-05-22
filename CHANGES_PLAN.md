---
description: Coordination plan for PRD clarification workflow refactor.
status: draft
---
# PRD Workflow Refactor Plan

## Intent
- Move PRD-level ambiguity handling before decomposition.
- Make `/write-prd` responsible for turning Product Brief + Constitution + optional context into clarified `.memory-bank/prd.md`.
- Make `/prd` a decomposition-only command from clarified PRD to Memory Bank L1-L3.
- Replace mandatory `/clarify FT-*` gating with optional/manual `/clarify-feature FT-*` for exceptional feature-level ambiguity.

## Target Workflow
```text
/analysis
/brainstorm
/brief
/write-prd
/prd
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/red-verify TASK-001   # T2/T3 only
/mb-sync
```

Optional:
```text
/clarify-feature FT-001
```

## Scope
- Shared command specs in `skills/_shared/references/commands/`.
- Generated skeleton text and proxy command lists in `skills/_shared/scripts/init-mb.js`.
- Skill entrypoints and templates that describe the PRD/feature planning flow.
- Mechanical validators and CI smoke coverage for the new command surface.
- README documentation in both languages.

## Non-Goals
- No generated package-local `skills/*/{agents,references,scripts}/shared-*` files.
- No change to JSON task record schema beyond feature-clarification gating behavior.
- No task execution implementation changes beyond workflow documentation and readiness gates.

## Delegation
- Worker implementer owns the refactor patch across the scoped product files.
- Separate verifier/reviewer owns syntax/install/source-only checks and semantic review after implementation.
