# memobank

`memobank` is a skill pack for Codex CLI, Claude Code, OpenCode, and similar agent runtimes.

It turns a repository into an agent-friendly workspace with three persistent layers:
- `.memory-bank/` for durable project knowledge
- `.protocols/` for resumable plans, progress, and verification state
- `.tasks/` for runtime artifacts produced by agents and subagents

The goal is practical: let agents work for a long time without losing project context, and let humans audit the work from files instead of reconstructing a chat log.

## What changed in the current project

Current `memobank` is no longer only a duo-doc system built around `architecture/ + guides/`.
It now uses a layered, backward-compatible model:
- classic duo docs remain valid and supported
- an explicit normative layer can be added through `spec-index.md`, `glossary.md`, `invariants.md`, `contracts/*`, `states/*`, `runbooks/*`, and `testing/*`
- richer planning and verification inputs are supported when present
- old repositories using the classic minimal model should still continue to work

This is an additive evolution, not a destructive rewrite.
The repo is meant to support both:
- older duo-doc-first Memory Banks
- newer richer spec-driven Memory Banks

## Core model

The current Memory Bank structure is organized into three layers.

### Layer A: classic concept docs
- `.memory-bank/architecture/` for WHAT and WHY
- `.memory-bank/guides/` for HOW

### Layer B: explicit normative docs
- `.memory-bank/spec-index.md`
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/contracts/`
- `.memory-bank/states/`
- `.memory-bank/runbooks/`
- `.memory-bank/testing/`

### Layer C: planning and execution state
- `.memory-bank/epics/`
- `.memory-bank/features/`
- `.memory-bank/tasks/`
- `.protocols/`
- `.tasks/`

The important rule is simple: richer docs strengthen source-of-truth routing, but they do not invalidate working duo docs.

## What the pack includes

### Package skills
- `cold-start` - all-in-one bootstrap for greenfield and brownfield repositories
- `mb-init` - skeleton and command generation only
- `mb-from-prd` - PRD-driven planning into product, requirements, epics, and features
- `mb-map-codebase` - map an existing repository into as-is Memory Bank docs
- `mb-execute` - execute one `TASK-*` with a resumable protocol
- `mb-verify` - verify one `TASK-*` against acceptance criteria and evidence
- `mb-red-verify` - adversarial semantic verification for one `TASK-*`
- `mb-review` - fresh-context review with specialized reviewer prompts
- `mb-garden` - lint and maintain Memory Bank consistency
- `mb-harness` - document deterministic gates, worktrees, and agent-safe workflows

### Generated project commands
After `cold-start` or `mb-init` runs inside a target repository, `memobank` generates command specs in `.memory-bank/commands/` and exposes them through runtime-native proxy skills.

Current command set:
- `/cold-start`
- `/mb`
- `/mb-init`
- `/prd`
- `/mb-from-prd`
- `/prd-to-tasks`
- `/execute`
- `/mb-execute`
- `/verify`
- `/mb-verify`
- `/red-verify`
- `/mb-red-verify`
- `/review`
- `/mb-review`
- `/map-codebase`
- `/mb-map-codebase`
- `/mb-sync`
- `/mb-garden`
- `/mb-harness`
- `/autopilot`
- `/autonomous`
- `/discuss`
- `/add-tests`
- `/find-skills`
- `/find-skill`

## How it works

### 1. Bootstrap the repository
`skills/_shared/scripts/init-mb.js` initializes a repo by creating:
- `.memory-bank/`
- `.tasks/`
- `.protocols/`
- `AGENTS.md`
- `CLAUDE.md` and `GEMINI.md` as symlink-or-copy companions
- `.memory-bank/commands/*.md`
- `.claude/skills/*` proxy skills
- `.agents/skills/*` proxy skills

The generated Memory Bank skeleton includes the current layered structure:
- `architecture/`
- `guides/`
- `adrs/`
- `tech-specs/`
- `domains/`
- `contracts/`
- `states/`
- `runbooks/`
- `workflows/`
- `quality/`
- `testing/`
- `skills/`
- `epics/`
- `features/`
- `tasks/`
- `commands/`
- `agents/`
- `archive/`
- `bugs/`

It also seeds core routing files such as `.memory-bank/index.md`, `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md`, `.memory-bank/glossary.md`, `.memory-bank/invariants.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/testing/index.md`, and `.memory-bank/tasks/backlog.md`.

### 2. Route into the correct workflow
`cold-start` is the main entry point and chooses the right path:
- Greenfield: start from `prd.md` or requirements text
- Brownfield: map the existing codebase into as-is docs first
- Skeleton-only: initialize the structure and stop for later planning

### 3. Plan by feature, not by a giant upfront backlog
The intended planning loop is:
- `/prd`
- `/prd-to-tasks FT-001`
- `/execute TASK-001`
- `/verify TASK-001`
- `/red-verify TASK-001` for risky semantic changes
- `/mb-sync`
- `/review` when needed

For existing codebases, the brownfield entry is:
- `/map-codebase`
- then PRD delta or change-planning work

Planning is now richer, but still backward-compatible:
- if structured inputs such as source artifacts, normative inputs, constraints, invariants, or verification targets are present, the planner can use them
- if they are absent, the classic minimal feature and task-card flow is still valid
- `/prd` still should not emit the entire implementation backlog blindly in one shot
- `/prd-to-tasks` remains the per-feature decomposition step

### 4. Execute with resumable file protocols
Each task may have a protocol folder such as `.protocols/TASK-123/` containing:
- `context.md`
- `plan.md`
- `progress.md`
- `verification.md`
- `handoff.md`

This makes task execution resumable across fresh sessions, engines, and review passes.

Execution and verification now follow an explicit fallback model:
1. richer structured inputs if present
2. classic feature, requirements, and RTM basis
3. duo docs
4. related normative docs when needed

That means richer fields are supported, but not silently mandatory.
Old task cards should continue to work.

### 4.1. Adversarial semantic verification
In addition to normal `/verify`, `memobank` now includes a separate semantic pass:
- `/red-verify TASK-123`
- `/mb-red-verify TASK-123`

Its purpose is not to repeat process checks, but to catch cases where "everything passes on paper, yet the solution is still wrong in substance."

This pass is especially useful when:
- acceptance criteria can be satisfied narrowly while still missing the true intent
- the change affects `contracts/*`, `states/*`, migrations, schemas, or data behavior
- the task crosses feature or module boundaries
- runtime or API behavior changes
- the implementation may be locally correct but systemically harmful
- there is a risk of architectural drift or hidden future maintenance cost

Division of responsibility:
- `/verify` checks task completion against AC/REQ and evidence
- `/review` checks the Memory Bank, planning surface, and fresh-context review gate
- `/red-verify` asks the hostile question: "is this solution actually right in substance?"

`/red-verify` is intentionally designed to start not from the full spec surface, but from:
1. task intent
2. the real diff / code changes / behavior changes
3. tests and runtime evidence
4. only then reconciliation against specs

This reduces the risk of shallow confirmation, where the verifier over-trusts the same assumptions as the implementer.

The semantic-pass result is recorded separately, typically in:
- `.protocols/TASK-123/red-verification.md`

Recommended verdicts:
- `semantic-pass`
- `semantic-concern`
- `semantic-fail`

Recommended place in the loop:
- `/execute TASK-123`
- `/verify TASK-123`
- `/red-verify TASK-123` for risky tasks
- `/mb-sync`

### 5. Review and maintenance
The current review and garden policy is concept-coverage driven, not pair-only.

A concept is considered acceptably documented when one of these is true:
- it has the classic `architecture + guides` support
- it has equivalent support through the richer spec-driven layer
- it has both

This matters because `review`, `mb-sync`, and `mb-garden` should not reject a repository only because it does not follow a strict duo-only surface.

## Supported runtimes

- Codex CLI reads project skills from `.agents/skills/`
- Claude Code reads project skills from `.claude/skills/`
- OpenCode can consume both

`.codex/` is for Codex project configuration. It is not a skills directory.

## Install from skill.sh

Install only what you need:

```bash
npx skills add mrvladd-d/memobank --skill cold-start --global --yes
npx skills add mrvladd-d/memobank --skill mb-init --global --yes
npx skills add mrvladd-d/memobank --skill mb-from-prd --global --yes
```

Install the full set:

```bash
npx skills add mrvladd-d/memobank --skill '*' --global --yes
```

In practice, most users start with:
- `cold-start` for the all-in-one entry point
- or `mb-init` plus `mb-from-prd` and `mb-map-codebase` for a modular workflow

## Quick start

### New repository with a PRD
Run `cold-start`, then follow the normal loop:

```text
/prd
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/red-verify TASK-001   # optional, recommended for risky/cross-boundary changes
/mb-sync
```

If the backlog is already prepared and the repo is ready for batch execution:

```text
/autopilot
```

If you want a full unattended run from PRD toward terminal state:

```text
/autonomous
```

### Existing repository without a PRD
Run `cold-start` and route into brownfield mapping:

```text
/map-codebase
```

This produces as-is Memory Bank documentation first, then stops at the right point for PRD delta or change-request planning.

## Interactive vs autonomous operation

### Interactive mode
Use this when you want explicit checkpoints:
- one feature at a time
- one task at a time
- review between waves

### Autonomous mode
Use this when you want one run to continue until it reaches a clear terminal state.

`/autonomous` is expected to:
- read the PRD
- record assumptions and open questions explicitly
- stop on blocking gaps
- build L1-L3 Memory Bank docs
- decompose work into tasks
- execute and verify task waves
- keep the Memory Bank synchronized as the run progresses

## Clean-session task execution

Each `TASK-*` can run in a fresh CLI session.

### Codex
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

### Claude
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

Independent tasks may run in parallel. Tasks with dependencies or overlapping files should run sequentially.

## Memory Bank maintenance

`memobank` includes a deterministic maintenance path:
- `/mb-sync` to keep the Memory Bank aligned with completed work
- `/mb-garden` to lint and clean Memory Bank structure
- `skills/mb-garden/assets/mb-lint.mjs` for mechanical checks such as required files, frontmatter, metadata hygiene, and broken links

The maintenance model is deliberately file-based and auditable.

## Shared assets and vendoring

`skills/_shared/` is the source of truth for shared prompts, references, and scripts.

Before release, `scripts/vendor-shared.mjs` vendors those shared assets into every installable package skill as flat companion files such as:
- `agents/shared-*.md`
- `references/shared-*.md`
- `scripts/shared-*.js`

This keeps top-level skills self-contained for `skills add` installs while preserving a single shared authoring source inside the repository.

## Repository structure

```text
skills/
  _shared/
  cold-start/
  mb-init/
  mb-from-prd/
  mb-map-codebase/
  mb-execute/
  mb-verify/
  mb-red-verify/
  mb-review/
  mb-garden/
  mb-harness/
scripts/
  vendor-shared.mjs
.tmp.changes/
  changes.md
```

## Bootstrap script usage

```bash
node skills/_shared/scripts/init-mb.js
node skills/_shared/scripts/init-mb.js --sync
```

`--sync` refreshes generated command specs and proxy skills in an already initialized repository without overwriting the rest of the Memory Bank.

## Documentation pointers

- `skills/_shared/references/structure-template.md` - generated skeleton structure and core templates
- `skills/_shared/references/commands/*.md` - command specs used as the source of truth
- `skills/_shared/scripts/init-mb.js` - bootstrap and sync logic
- `skills/mb-garden/assets/mb-lint.mjs` - deterministic Memory Bank lint
- `scripts/vendor-shared.mjs` - vendoring pipeline for package skills
- `.tmp.changes/changes.md` - high-level record of the additive architecture transition

## License

MIT - see `LICENSE`.
