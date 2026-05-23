# memobank

`memobank` is a skill pack/framework for Codex CLI, Claude Code, OpenCode, and compatible agent runtimes.

It helps agents run a project through files instead of fragile chat history: Memory Bank docs, resumable protocols, JSON tasks, and evidence. The goal is simple: keep context durable, make work restartable, and give beginners a clear path in. 🌱

## Why it exists

As a project grows, chat history becomes a weak source of truth. Decisions drift, task state gets fuzzy, and the next agent often has to rediscover too much.

`memobank` keeps the working state in the repository:

- `.memory-bank/` stores product knowledge, requirements, features, architecture, and task records;
- `.protocols/` stores execution and verification traces for specific `TASK-*` work;
- `.tasks/` stores runtime evidence, reports, and handoff material;
- the JSON task queue keeps execution order and tier policy explicit.

## Main path: manual workflow

Start manually first. It makes the system easy to understand before you hand more control to automation.

```text
idea / rough draft
  -> /analysis or /brief when the direction needs shaping
  -> /constitution
  -> /write-prd
  -> /spec-init
  -> /prd
  -> /spec-design FT-001
  -> /prd-to-tasks FT-001
  -> /execute TASK-001
  -> /verify TASK-001
  -> /red-verify TASK-001 for T2/T3 work
  -> /mb-sync
  -> repeat the feature/task loop until the project is done
```

In plain terms:

- `/analysis` and `/brief` help turn a raw idea into a usable input.
- `/constitution` runs a short contextual interview for project principles and non-negotiables. If you explicitly skip it, the flow can continue with framework-default/skipped principles and you can revisit it later.
- `/write-prd` captures a clear PRD.
- `/spec-init` creates the SDD Design Specs Index route map without inventing authoritative specs.
- `/prd` decomposes the PRD into Memory Bank product, requirements, epics, and features.
- `/spec-design FT-001` completes the minimum needed feature design, or marks it `not_required` for simple T0/T1-like work.
- `/prd-to-tasks FT-001` creates JSON tasks for one feature.
- `/execute`, `/verify`, and `/mb-sync` take one task from implementation to synchronized project memory.
- `/red-verify` adds the required adversarial semantic pass for T2/T3 work.

## Automation, when you are ready

Automation is available, but it works best after the manual loop is familiar.

- `/autopilot` runs an existing JSON task queue as a scheduler/executor.
- `/autonomous` runs the full unattended flow from PRD/Product Brief/delta to terminal state.

## Killer features

- Durable context instead of dependence on chat history.
- Resumable task protocols for work that spans sessions.
- JSON task queue with `tier: T0|T1|T2|T3`.
- Beginner-friendly manual mode first, autonomous mode later.

## Install and quick start

For this source-only fork, use the installer wrapper:

```bash
node scripts/install-framework.mjs
```

The interactive installer lets you choose the target project folder from a list,
installs the memobank commands, and bootstraps or syncs the target repository.

Detailed installation mechanics and automation scenarios are documented in
[howItWorks.md](howItWorks.md).

Then run:

```text
/cold-start
```

or go straight into the manual flow: `/analysis` or `/brief` -> `/constitution` -> `/write-prd` -> `/spec-init` -> `/prd` -> `/spec-design FT-001` -> `/prd-to-tasks FT-001` -> `/execute TASK-001`.

## More detail

The full mechanics for installation, packaging, task model, tier policy, command reference, and checks live in [howItWorks.md](howItWorks.md).
