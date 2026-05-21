---
description: Optional Analysis router before PRD; recommends brainstorm, brief, PRD, mapping, or clarification.
status: active
---
# /analysis - Analysis router

<objective>
Route the project to the next discovery or planning step without generating PRD content, task records, research, PRFAQ, or requirements.

Analysis is optional. Use it when the product idea is vague, product direction is unstable, or the user asks what should happen before `/prd`.
</objective>

<process>

## 0) Scope
`/analysis` is a router only.

Allowed outputs:
- create `.memory-bank/analysis/index.md` if it does not exist
- update `.memory-bank/analysis/index.md` with current state and the recommended next step
- report the next command to the user

Do not create:
- `.memory-bank/analysis/product-brief.md`
- `.memory-bank/analysis/brainstorming/BR-*.md`
- `.memory-bank/tasks/*.task.json`
- `.memory-bank/tasks/plans/*`
- `.memory-bank/analysis/assumptions.md`
- research reports
- PRFAQ artifacts
- command aliases

## 1) Inspect state
Check only what is needed:
- `prd.md`
- `.memory-bank/analysis/index.md`
- `.memory-bank/analysis/product-brief.md`
- `.memory-bank/analysis/brainstorming/BR-*.md`
- `.memory-bank/features/FT-*.md`
- clear brownfield signals such as source code, `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, or existing app folders

Do not infer a roadmap from a brownfield codebase before mapping it.

## 2) Ensure index when useful
If `.memory-bank/analysis/index.md` is missing and Analysis is the selected path, create it with:
- YAML frontmatter:
  - `description: Analysis artifact index.`
  - `status: active`
- current state
- artifact links
- recommended next step
- open routing questions

Use this frontmatter:

```yaml
---
description: Analysis artifact index.
status: active
---
```

Do not create `.memory-bank/analysis/` in a clean skeleton unless `/analysis`, `/brainstorm`, or `/brief` is actually being used.

## 3) Routing table
Use this table:

| State | Next step |
|---|---|
| PRD exists, but feature docs are not created | `/prd` or current PRD ingestion flow |
| Feature docs exist with `clarification_status: pending` | `/clarify FT-<NNN>` |
| Feature docs exist with `clarification_status: complete` | `/prd-to-tasks FT-<NNN>` |
| Approved product brief exists | `/prd`, then `/clarify FT-<NNN>` |
| Draft product brief exists | finish `/brief`, then `/prd`, then `/clarify FT-<NNN>` |
| Brainstorming report exists, but no brief exists | `/brief` |
| Idea is raw or vague | `/brainstorm` |
| Concept is understandable and no PRD exists | `/brief` |
| Brownfield project without PRD | `/map-codebase`, then `/brief --delta` or `/prd --delta`, then `/clarify FT-<NNN>` |
| Not enough data | create/update index and give one explicit next step |

Brownfield rule:

```text
Brownfield as-is mapping comes first. Do not invent roadmap from analysis before /map-codebase.
```

## 4) Clarification dependency
Never recommend `/prd-to-tasks` for a feature unless the feature frontmatter has:

```yaml
clarification_status: complete
```

If the feature has `clarification_status: pending`, missing clarification metadata, or unresolved blocking markers in behavior, acceptance, data, contracts, security, UX, operations, or verification sections, recommend:

```text
/clarify FT-<NNN>
```

## 5) Response
Return:
- current state
- evidence checked
- recommended next step
- why other tempting routes were not selected, if relevant

Keep the answer short. This command should move the user to the right next command, not perform discovery itself.
</process>
