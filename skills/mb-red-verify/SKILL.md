---
name: mb-red-verify
description: >
  Adversarial semantic verification for one TASK-* so teams can catch solutions that pass process checks but are still wrong in substance.
---

# mb-red-verify — Adversarial semantic verification

- **What it does:** pressure-tests one completed `TASK-*` for semantic correctness, hidden failure modes, and systemic harm.
- **Use it when:** a task may be locally correct yet still wrong in product/domain/architectural/operational reality.
- **Input:** `TASK_ID`, task intent, actual change surface, tests/evidence, and only then relevant spec reconciliation.
- **Output:** `red-verification.md`, a concise semantic-risk report, and follow-up bugs/tasks when concerns are serious.

## Goal
Catch changes that are "disciplined but wrong":
- pass acceptance criteria but solve the wrong problem
- work locally but damage system integrity
- overfit to the task record and ignore neighboring constraints
- introduce architectural drift, state inconsistency, or hidden maintenance cost
- create false confidence because the evidence surface is too narrow

## This is intentionally different from existing commands
- `mb-verify` checks acceptance criteria and evidence-backed task completion.
- `mb-review` reviews Memory Bank quality, planning, and discipline in fresh context.
- `mb-red-verify` asks: "Is this solution actually right in substance?"

## Preconditions
- Implementation exists.
- Quality gates were already run (or failures were recorded).
- For non-trivial tasks, `mb-verify` should usually run first.

## Required outputs
Create or update:
- `.protocols/<TASK_ID>/red-verification.md`

Store a concise report in:
- `.tasks/<TASK_ID>/<TASK_ID>-S-RED-VERIFY-final-report-docs-01.md`

If concerns are material:
- `.memory-bank/bugs/BUG-<short>.md`
- follow-up `.task.json` records indexed in `.memory-bank/tasks/index.json`

Use:
- `./references/shared-protocols-red-verification-template.md`
- `./agents/red-verifier.md`

## Input priority
Do **not** start by over-trusting the same full spec context the implementer used.

Prime in this order:
1. task intent and expected real-world outcome
2. actual code changes / diff / touched runtime behavior
3. tests, logs, screenshots, traces, and other evidence
4. neighboring constraints (`contracts/*`, `states/*`, `runbooks/*`, invariants)
5. broader spec reconciliation

This keeps the verifier from merely confirming the workflow surface.

## When to use it
Use `mb-red-verify` when:
- contracts, states, migrations, or data behavior changed
- the task crosses boundaries between modules/features
- runtime or API behavior changed
- business rules or domain semantics matter heavily
- acceptance criteria can be satisfied in a narrow but misleading way
- the change is risky, architectural, or likely to create hidden future cost

## When not to use it
Usually skip it for:
- typo-only edits
- formatting-only changes
- isolated mechanical refactors with no behavioral impact

## Process

### 1) Start from task intent and reality, not paperwork
Read only what you need:
- `.protocols/<TASK_ID>/plan.md`
- `.protocols/<TASK_ID>/progress.md`
- `.protocols/<TASK_ID>/verification.md` if it exists
- linked task record, feature, and requirement docs for intent
- the real diff / changed files / tests / runtime artifacts

### 2) Build a hostile hypothesis list
Challenge the solution from multiple angles:
- wrong problem solved
- local optimization with systemic harm
- hidden assumptions
- cross-boundary regression risk
- architectural drift
- state/data inconsistency
- operational weakness
- future maintenance burden

### 3) Reconcile with specs only after forming independent concerns
Then inspect the smallest sufficient spec subset:
- relevant `contracts/*`
- `states/*`
- `runbooks/*`
- `requirements.md`
- `invariants.md`
- related feature/epic docs

If code and specs disagree, record the drift explicitly rather than silently choosing one side.

### 4) Produce a hard-to-game report
The output must be concise and high-signal. Include:
- semantic verdict
- top substance risks
- hidden assumptions
- cross-boundary impact
- architectural concerns
- state/data consistency concerns
- operational concerns
- future maintenance cost
- how the change could still be wrong
- counterproposal or escalation path

### 5) Take action from the verdict
- `semantic-pass`: no substantive concerns found
- `semantic-concern`: not proven wrong, but not trustworthy enough for autonomous closure without follow-up or human review
- `semantic-fail`: substantively wrong, systemically harmful, or too risky to accept

For `semantic-concern`, create follow-up work or escalate explicitly.
For `semantic-fail`, file a bug, add follow-up tasks, and stop downstream progression.

## Definition of done
- `red-verification.md` exists and is substance-focused.
- The report is concise, skeptical, and not just a rephrased `/verify`.
- Serious concerns result in explicit bugs/tasks/escalation.
