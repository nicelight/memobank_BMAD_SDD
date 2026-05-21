# memobank

`memobank` is a skill pack for Codex CLI, Claude Code, OpenCode, and similar agent runtimes.

It turns a repository into an agent-friendly workspace with three persistent layers:
- `.memory-bank/` for durable project knowledge
- `.protocols/` for resumable plans, progress, and verification state
- `.tasks/` for runtime artifacts produced by agents and subagents

The goal is practical: let agents work for a long time without losing project context, and let humans audit the work from files instead of reconstructing a chat log.

## What changed in the current project

Current `memobank` is no longer only a duo-doc system built around `architecture/ + guides/`.
It now uses a layered model with strict JSON task state:
- classic duo docs remain valid and supported
- `.memory-bank/constitution.md` defines short project governing principles for agent decisions
- an explicit normative layer can be added through `spec-index.md`, `glossary.md`, `invariants.md`, `contracts/*`, `states/*`, `runbooks/*`, and `testing/*`
- richer planning and verification inputs are supported when present
- task execution state is JSON-only: `tasks/index.json` plus indexed `TASK-*.task.json` records
- every task record uses mandatory `tier: T0|T1|T2|T3`

The documentation model remains additive. The task model is intentionally strict and machine-readable.

## Core model

The current Memory Bank structure is organized into three layers.

### Layer A: classic concept docs
- `.memory-bank/architecture/` for WHAT and WHY
- `.memory-bank/guides/` for HOW

### Layer B: explicit normative docs
- `.memory-bank/constitution.md`
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
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-*.task.json`
- `.protocols/`
- `.tasks/`

The important rule is simple: richer docs strengthen source-of-truth routing, but they do not invalidate working duo docs.
The Constitution is the project governing-principles document. `/constitution` creates or updates it, agents read it early during priming, and it does not replace `invariants.md`, `contracts/*`, or `spec-index.md`.
Generated `AGENTS.md` is only the bootstrap and command router for agents. It points agents to the Constitution and Memory Bank files; it is not the Constitution itself.

## What the pack includes

### Package skills
- `cold-start` - all-in-one bootstrap for greenfield and brownfield repositories
- `mb-init` - skeleton and command generation only
- `mb-analysis` - optional upstream discovery: idea routing, brainstorming, and product brief before PRD
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
- `/analysis`
- `/brainstorm`
- `/brief`
- `/constitution`
- `/prd`
- `/clarify`
- `/prd-to-tasks`
- `/execute`
- `/verify`
- `/red-verify`
- `/review`
- `/map-codebase`
- `/mb-sync`
- `/mb-garden`
- `/mb-doctor`
- `/mb-harness`
- `/autopilot`
- `/autonomous`
- `/discuss`
- `/add-tests`
- `/find-skills`

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

The generated `AGENTS.md` contains Orchestrator Mode. If the top-level agent is not given another explicit role, it acts as an orchestrator: it plans, checks scope and risks, delegates implementation and verification, and routes work through the Memory Bank instead of treating chat history as source of truth.

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
- `schemas/`
- `tasks/`
- `commands/`
- `agents/`
- `archive/`
- `bugs/`

It also seeds core routing files such as `.memory-bank/index.md`, `.memory-bank/constitution.md`, `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md`, `.memory-bank/glossary.md`, `.memory-bank/invariants.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/testing/index.md`, `.memory-bank/workflows/tier-policy.md`, `.memory-bank/schemas/task.schema.json`, and `.memory-bank/tasks/index.json`.

Fresh skeleton bootstrap does not create runnable task records. By default `.memory-bank/tasks/index.json` starts as `{ "version": 1, "tasks": [] }`; `/prd-to-tasks` creates indexed `.memory-bank/tasks/TASK-*.task.json` records after PRD/features exist.
There is no generated markdown task list: tooling reads the JSON registry and task records directly.

### 2. Route into the correct workflow
`cold-start` is the main entry point and chooses the right path:
- Idea-only: optionally run `/analysis`, then `/brainstorm` and `/brief` before `/prd`
- Clear concept: optionally run `/brief`, then `/prd`
- Existing PRD: start from `prd.md` or requirements text and run `/prd`
- Brownfield: map the existing codebase into as-is docs first
- Skeleton-only: initialize the structure and stop for later planning

Analysis is optional discovery. It helps turn a raw idea or clear concept into better PRD input, but it does not replace `/clarify`: after `/prd`, every feature still goes through `/clarify FT-<NNN>` before `/prd-to-tasks FT-<NNN>`.

### 3. Plan by feature, not by a giant upfront task queue
The intended planning loop is:
- `/prd`
- `/clarify FT-001`
- `/prd-to-tasks FT-001`
- `/execute TASK-001`
- `/verify TASK-001`
- `/red-verify TASK-001` for T2/T3 tasks
- `/mb-sync`
- `/review` when needed

For existing codebases, the brownfield entry is:
- `/map-codebase`
- then PRD delta or change-planning work

Planning is now richer, but mechanically strict:
- if structured inputs such as source artifacts, normative inputs, constraints, invariants, or verification targets are present, the planner can use them
- if they are absent, the classic minimal feature and requirements flow is still valid
- task state is stored in schema-backed JSON records under `.memory-bank/tasks/*.task.json`, indexed by `.memory-bank/tasks/index.json`; fresh skeleton starts with an empty index until `/prd-to-tasks` creates records
- each task record must contain `tier: T0|T1|T2|T3`; execution routing is authoritative only through `task.tier`
- `.memory-bank/tasks/backlog.md` and markdown task cards are obsolete and unsupported as workflow artifacts
- the old `risk` / `risk.level` task model is removed and invalid
- `/prd` still should not emit the entire implementation task queue blindly in one shot
- `/prd-to-tasks` remains the per-feature decomposition step and is responsible for creating task records

### 4. Execute with resumable file protocols
Each task may have a protocol folder such as `.protocols/TASK-123/` containing:
- `context.md`
- `plan.md`
- `progress.md`
- `verification.md`
- `handoff.md`

This makes task execution resumable across fresh sessions, engines, and review passes.
T0/T1 tasks may use compact `.protocols/TASK-123/run.md`; T2/T3 tasks require the full protocol files. T3 also requires a human-aware checkpoint and rollback/recovery note.

Execution and verification now follow an explicit fallback model:
1. richer structured inputs if present
2. classic feature, requirements, and RTM basis
3. duo docs
4. related normative docs when needed

That means richer fields are supported, but not silently mandatory.
Authoritative task state lives in JSON task records created by `/prd-to-tasks`, not by PRD-less bootstrap.

### 4.1. Adversarial semantic verification
In addition to normal `/verify`, `memobank` now includes a separate semantic pass:
- `/red-verify TASK-123`
- `/red-verify TASK-123`

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

Closure policy:
- `semantic-pass` allows normal closure when `/verify` also passed
- `semantic-fail` fails the task
- `semantic-concern` is not normal done; it blocks closure or requires human review and follow-up before dependents can move forward

Recommended place in the loop:
- `/execute TASK-123`
- `/verify TASK-123`
- `/red-verify TASK-123` for T2/T3 tasks
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

## Install from source-only fork

Important: do not use `npx skills add <repo>` directly for this fork. The repository is stored in source-only form, so the correct entry point is the installer wrapper shipped by this package.

Install only what you need:

```bash
npx github:<owner>/<repo> --skill cold-start --global --yes
npx github:<owner>/<repo> --skill mb-init --global --yes
npx github:<owner>/<repo> --skill mb-analysis --global --yes
npx github:<owner>/<repo> --skill mb-from-prd --global --yes
```

Install the full set:

```bash
npx github:<owner>/<repo> --skill '*' --global --yes
```

For a local clone, run:

```bash
node scripts/install-framework.mjs --skill '*' --global --yes
```

The installer keeps this repository source-only: it generates vendored `shared-*` files in a temporary copy and passes that prepared copy to `skills add`.

What happens during installation:
- a temporary copy of the repository is created;
- `scripts/vendor-shared.mjs` runs inside that temporary copy;
- missing `agents/shared-*`, `references/shared-*`, and `scripts/shared-*` files are generated inside each package skill;
- the wrapper then calls `npx -y skills add <prepared-temp-repo> ...`;
- the temporary copy is removed after installation;
- the working repository remains source-only, without committed generated `shared-*` files.

In practice, most users start with:
- `cold-start` for the all-in-one entry point
- or `mb-init` plus `mb-analysis`, `mb-from-prd`, and `mb-map-codebase` for a modular workflow

## Quick start

### New repository with a PRD
Run `cold-start`, then follow the normal loop:

```text
/prd
/clarify FT-001
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/red-verify TASK-001   # required for T2/T3 tasks
/mb-sync
```

### Minimal flows
Use only the path that matches your starting point:

```text
Idea-only:
/analysis
/brainstorm
/brief
/prd
/clarify FT-001
/prd-to-tasks FT-001

Clear concept:
/brief
/prd
/clarify FT-001
/prd-to-tasks FT-001

Existing PRD:
/prd
/clarify FT-001
/prd-to-tasks FT-001

Brownfield:
/map-codebase
/brief --delta or /prd --delta
/clarify FT-001
/prd-to-tasks FT-001
```

Analysis commands are optional and upstream of PRD. They do not create implementation task records and do not bypass feature clarification.

If the JSON task queue / task records are already prepared and the repo is ready for batch execution:

```text
/autopilot
```

If you want a full unattended run from PRD toward terminal state:

```text
/autonomous
```

Use the deterministic readiness gates at the right phase:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs          # pre-queue / fresh skeleton health check
node scripts/mb-doctor.mjs --strict # after /prd-to-tasks, before scheduler/autopilot execution
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
The agent should read `AGENTS.md`, the indexed JSON task record, and the protocol path selected by `task.tier`:
- `T0` / `T1`: compact `.protocols/TASK-123/run.md` may be used
- `T2` / `T3`: full `.protocols/TASK-123/{context,plan,progress,verification,handoff}.md`

### Codex
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/tasks/TASK-123.task.json, and the tier-selected protocol path. Implement only scoped changes.'
```

### Claude
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md, .memory-bank/tasks/TASK-123.task.json, and the tier-selected protocol path. Implement only scoped changes.'
```

Independent tasks may run in parallel. Tasks with dependencies or overlapping files should run sequentially.

## Memory Bank maintenance

`memobank` includes a deterministic maintenance path:
- `/mb-sync` to keep the Memory Bank aligned with completed work
- `/mb-garden` to lint and clean Memory Bank structure
- `skills/mb-garden/assets/mb-lint.mjs` for structure and mechanical hygiene: required files, frontmatter, metadata, task registry consistency, tier rules, protocol evidence, and broken links
- `skills/mb-garden/assets/mb-doctor.mjs` for workflow and autonomous readiness: whether the JSON task queue, dependencies, tier policy, evidence, and obsolete artifact checks are safe enough to continue

`mb-lint` answers "is the Memory Bank mechanically valid?" `mb-doctor` answers "is this repository ready for autonomous or autopilot execution?" Use default `mb-doctor` for pre-queue health checks and fresh skeletons. Run `mb-doctor --strict` only after the JSON task queue exists: after `/prd-to-tasks`, before scheduler execution inside `/autonomous`, or before `/autopilot` when the queue is already prepared.

Task state is JSON-only. The supported registry is `.memory-bank/tasks/index.json` plus indexed `.memory-bank/tasks/TASK-*.task.json` records. `backlog.md`, markdown task cards, and the old `risk` / `risk.level` model are unsupported.

The maintenance model is deliberately file-based and auditable.

## Shared assets and vendoring

`skills/_shared/` is the source of truth for shared prompts, references, and scripts.

Before release, `scripts/vendor-shared.mjs` vendors those shared assets into every installable package skill as flat companion files such as:
- `agents/shared-*.md`
- `references/shared-*.md`
- `scripts/shared-*.js`

This keeps top-level skills self-contained for `skills add` installs while preserving a single shared authoring source inside the repository.

In the source-only repository model, these vendored `shared-*` files are generated artifacts and should not be committed. CI generates them before package install smoke tests.

Source-only hygiene check:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

The source tree should print `0`. If shared behavior must change, edit `skills/_shared/`, not generated package-local `shared-*` copies.

## Repository structure

```text
skills/
  _shared/
  cold-start/
  mb-init/
  mb-analysis/
  mb-from-prd/
  mb-map-codebase/
  mb-execute/
  mb-verify/
  mb-red-verify/
  mb-review/
  mb-garden/
  mb-harness/
scripts/
  install-framework.mjs
  vendor-shared.mjs
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
- `skills/mb-garden/assets/mb-doctor.mjs` - deterministic autonomous readiness check
- `scripts/install-framework.mjs` - source-only installer wrapper
- `scripts/vendor-shared.mjs` - vendoring pipeline for package skills

## License

MIT - see `LICENSE`.
