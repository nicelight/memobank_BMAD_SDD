---
description: Create or update a concise Product Brief as the PRD input contract.
status: active
---
# /brief - Product Brief input contract

<objective>
Create or update `.memory-bank/analysis/product-brief.md` as a concise Product Brief before `/prd`.

Product Brief is the input contract for `/prd`. It is not a PRD, backlog, marketing document, research report, or task plan.
</objective>

<process>

## 0) Scope
Use `/brief` when the concept is clear enough to summarize, or after `/brainstorm`.

Allowed outputs:
- `.memory-bank/analysis/index.md`
- `.memory-bank/analysis/product-brief.md`

Do not create:
- feature docs
- task records
- implementation plans
- research reports
- PRFAQ
- `.memory-bank/analysis/assumptions.md`
- command aliases

## 1) Inputs
Read, when present:
- latest relevant `.memory-bank/analysis/brainstorming/BR-*.md`
- existing `.memory-bank/analysis/product-brief.md`
- user-provided concept, notes, or PRD-like text

If brainstorming exists, include it in `Source artifacts`. If no brainstorming exists, a brief may still be created directly from user input.

## 2) Create or update Product Brief
Create `.memory-bank/analysis/product-brief.md` with a concise 1-2 page target.

When creating `.memory-bank/analysis/index.md`, include:

```yaml
---
description: Analysis artifact index.
status: active
---
```

Required structure:

```md
---
description: Product Brief input contract for PRD.
status: draft
type: product-brief
---
# Product Brief

## Metadata
- Status: draft
- Decision: proceed|blocked
- Source artifacts:
  - .memory-bank/analysis/brainstorming/BR-<NNN>.md

## 1. One-liner

## 2. Target Users

## 3. Problem

## 4. Current Alternatives

## 5. Value Proposition

## 6. Product Concept

## 7. MVP Scope

## 8. Non-goals

## 9. Success Metrics

## 10. Constraints

## 11. Assumptions

## 12. Risks

## 13. Open Questions

## 14. PRD Input Summary

## 15. Decision
proceed|blocked
```

The Product Brief frontmatter is required. `type` must be `product-brief`, and `status` should match the current brief state, starting as `draft`.

KISS decision values:
- `proceed`
- `blocked`

Do not add `no-go`.

## 3) Decision rules
Set `Decision: proceed` only when the brief is clear enough for `/prd`.

Set `Decision: blocked` when open questions block PRD quality. If blocked:
- do not continue to `/prd` unless the user explicitly overrides
- explain the blocking open questions

If the user explicitly overrides a blocked brief, `/prd` may continue, but that override never bypasses feature clarification before task decomposition.

## 4) Clarification dependency
The next planning chain is:

```text
/brief -> /prd -> /clarify FT-<NNN> -> /prd-to-tasks FT-<NNN>
```

Do not recommend `/prd-to-tasks` directly from `/brief`.

## 5) Update index and finish
Update `.memory-bank/analysis/index.md` with:
- product brief status
- source artifacts
- decision
- recommended next step

Recommended next step:
- if `Decision: proceed`: `/prd`, then `/clarify FT-<NNN>`
- if `Decision: blocked`: answer blocking questions, then rerun `/brief`
</process>
