---
name: mb-from-prd
description: >
  Turn a PRD into a traceable Memory Bank with product, requirements, epics, and features.
---

# mb-from-prd — PRD → Memory Bank (greenfield)

- **What it does:** converts a PRD into structured project knowledge and traceable planning artifacts.
- **Use it when:** the project is greenfield and `prd.md` or equivalent requirements already exist.
- **Input:** `prd.md` or user-provided PRD text plus an initialized `.memory-bank/`.
- **Output:** product brief, RTM, epics, features, and concept docs ready for `/clarify FT-<NNN>` before `/prd-to-tasks`.

## Preconditions
- You are in the repo root.
- `prd.md` exists (or the user provides PRD text).
- Optional Analysis artifacts such as a product brief may exist; use them as upstream PRD input, but do not require them.
- `.memory-bank/` exists. If not, run `mb-init` first (or create the skeleton manually).

## Process

### 1) Load and sanity-check PRD
1. Read `prd.md`.
2. If an Analysis product brief exists, use it as the primary upstream context for PRD interpretation.
3. Identify missing information and contradictions.
4. Start a task protocol folder:
   - `.protocols/PRD-BOOTSTRAP/`
   - `plan.md` (steps)
   - `decision-log.md` (Q/A and choices)

### 2) Skills / tooling discovery (optional but recommended)
If the PRD mentions “use skills / tools / CLIs”:
- run `/find-skills` (project-installed first; marketplace second)
- propose a minimal set of relevant skills to use (do not install without confirmation)

### 3) Deep Questioning (rounds)
Use `./references/shared-deep-questioning.md`.
- Ask questions in rounds of 3–5.
- After each round: summarize, update `decision-log.md`, and ask the next round.
- If user is temporarily unavailable: record `Open questions` in `decision-log.md` and **stop**. Do not proceed by inventing facts.

Deep Questioning is PRD-level discovery. Clarification is the later feature-level ambiguity gate run with `/clarify FT-<NNN>`.
Optional Analysis (`/analysis`, `/brainstorm`, `/brief`) is also PRD-level discovery. It improves PRD input and does not replace `/clarify`.

If the target mode is **full autonomous**:
- non-blocking gaps may be recorded as explicit `Assumptions`
- blocking gaps (security/compliance/external contracts/data-loss risks) must halt the run

### 4) Write L1 Product brief
Update `.memory-bank/product.md` (use the user’s wording).

### 5) Requirements + RTM
Update `.memory-bank/requirements.md`:
- Enumerate REQ-IDs.
- Define “out of scope”.
- Fill RTM: REQ → Epic → Feature → Test.

### 6) Create Epics (L2, draft-first)
For each epic:
- Create `.memory-bank/epics/EP-<NNN>-<slug>.md`
- Use `references/epic-template.md`.
- Ensure business value + success metrics.
- Fill optional sections such as `Source artifacts`, `Normative inputs`, and `Constraints / invariants` only when they are grounded in evidence.
- Default `status: draft` until open questions are resolved.

### 7) Create Features (L3, draft-first)
For each feature:
- Create `.memory-bank/features/FT-<NNN>-<slug>.md`
- Use `references/feature-template.md`.
- Ensure autonomy and explicit acceptance criteria.
- Add clarification metadata starting as `clarification_status: pending`; `mb-from-prd` must not mark feature clarification complete.
- Fill optional sections such as `Source artifacts`, `Normative inputs`, `Constraints / invariants`, and `Verification targets` only when they are grounded in evidence.
- Default `status: draft` until acceptance criteria + verification plan are solid.

### 8) Tasks planning (per-feature, no “everything at once”)
Do **not** generate a full task queue “в лоб” for all features in one pass.

Instead:
1) Ensure `.memory-bank/schemas/task.schema.json` and `.memory-bank/tasks/index.json` exist. A fresh skeleton may have `{ "version": 1, "tasks": [] }`.
2) For each selected feature, run `/clarify FT-<NNN>` first; task planning starts only after that feature-level ambiguity gate is complete.
3) Then run `/prd-to-tasks FT-<NNN>` to produce:
   - `.memory-bank/tasks/plans/IMPL-FT-<NNN>.md`
   - atomic `.memory-bank/tasks/TASK-*.task.json` records grouped by `wave`, each with mandatory `tier: T0|T1|T2|T3`

When enough structured evidence exists, those feature-level plans and task records may include optional richer fields such as `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, and `verification_targets`.
Task routing is authoritative only through `task.tier`; the old `risk` / `risk.level` model is invalid.
Canonical planning path is `/prd` → `/clarify FT-<NNN>` → `/prd-to-tasks FT-<NNN>`; `/prd-to-tasks` must not run while clarification is pending or missing.

This keeps planning accurate and avoids speculative task explosions.

### 9) Support docs for key concepts
For every concept that would otherwise require “reading many files” to understand later, create support docs.

Compatibility/default path:
- `.memory-bank/architecture/<concept>.md` (WHAT/WHY)
- `.memory-bank/guides/<concept>.md` (HOW)

Optional richer support docs:
- `.memory-bank/contracts/...`
- `.memory-bank/states/...`
- `.memory-bank/runbooks/...`
- `.memory-bank/testing/...`

Rules:
- classic duo docs remain valid and useful
- richer docs are additive and should be grounded in evidence
- if richer docs exist, route them from `.memory-bank/spec-index.md` and relevant feature/concept docs

### 10) Update index
Update `.memory-bank/index.md` with annotated links to everything new.

### 11) Review gate
Run a fresh-context review (preferably `mb-review`).

### 12) Autonomous handoff (optional)
If the goal is “PRD → done without more user interaction”:
- do not execute tasks from here manually
- hand off to generated project command `/autonomous`

## Definition of done
- product.md + requirements.md are coherent.
- Every REQ maps to an Epic/Feature in RTM.
- Epics and features exist with acceptance criteria.
- schema-backed task records are indexed in `.memory-bank/tasks/index.json`; every task has `tier`.
- index.md is updated.
