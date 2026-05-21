---
description: Create or maintain the Project Constitution governing layer.
status: active
---
# /constitution — Project Constitution

<objective>
Maintain `.memory-bank/constitution.md` as the short, top-level governing layer for AI-first project work.

The Constitution defines principles and non-negotiables. It does not replace `mbb/index.md`, `spec-index.md`, `invariants.md`, contracts, states, testing docs, workflow policies, or the tier policy.
</objective>

<process>

## 1) Load governing context
Read:
- `.memory-bank/constitution.md`, if it exists
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/invariants.md`, if it exists
- `.memory-bank/workflows/*`, especially tier policy if present
- `AGENTS.md`

If `.memory-bank/constitution.md` is missing, create it from the current framework skeleton/template before amending it.

Minimum skeleton requirements:
- frontmatter: `description`, `status: active`, `version: 1`, `ratified`, `last_updated`
- title: `# Project Constitution`
- short sections for Purpose, Core Principles, and Governance
- no project-specific domain principles unless grounded in the loaded context or user instruction
- no contradiction with the current `tier: T0|T1|T2|T3` model

## 2) Decide whether to amend
Update the Constitution only when the user asks to create, amend, clarify, or reconcile governing principles.

Do not invent domain-specific principles. A principle needs evidence from user instruction, existing Memory Bank docs, AGENTS.md, invariants, contracts, state docs, workflow policies, or explicit project decisions.

## 3) Keep it short
- Remove vague placeholders.
- Keep concrete project rules in `.memory-bank/invariants.md`, `.memory-bank/contracts/*`, `.memory-bank/states/*`, or `.memory-bank/workflows/*`.
- Use Constitution only for durable principles, precedence, governance, and non-negotiables.

## 4) Consistency gate
Before saving, check that the Constitution does not contradict:
- MBB rules
- `spec-index.md` routing
- invariants
- contracts/states/testing docs when relevant
- workflow policies
- the current tier model (`tier: T0|T1|T2|T3`)

Do not introduce aliases, legacy task formats, old `risk.level` routing, or separate governance/process machinery.

If dependent docs need updates, list the affected docs and update only the minimal affected docs required by the requested amendment.

## 5) Output
Report:
- whether the Constitution was created or amended
- which evidence sources justified the change
- any contradictions found and whether they were fixed or remain blocking
- any follow-up docs that need explicit user approval
</process>
