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
  -> /write-prd
  -> /prd
  -> /prd-to-tasks FT-001
  -> /execute TASK-001
  -> /verify TASK-001
  -> optional /red-verify TASK-001 for complex or risky work
  -> /mb-sync
  -> repeat the feature/task loop until the project is done
```

In plain terms:

- `/analysis` and `/brief` help turn a raw idea into a usable input.
- `/write-prd` captures a clear PRD.
- `/prd` decomposes the PRD into Memory Bank product, requirements, epics, and features.
- `/prd-to-tasks FT-001` creates JSON tasks for one feature.
- `/execute`, `/verify`, and `/mb-sync` take one task from implementation to synchronized project memory.
- `/red-verify` adds adversarial review when the work is substantive or risky.

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
node scripts/install-framework.mjs --skill '*' --yes
```

In the target repository, bootstrap the Memory Bank:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

Then run:

```text
/cold-start
```

or go straight into the manual flow: `/analysis` or `/brief` -> `/write-prd` -> `/prd` -> `/prd-to-tasks FT-001` -> `/execute TASK-001`.

## More detail

The full mechanics for installation, packaging, task model, tier policy, command reference, and checks live in [howItWorks.md](howItWorks.md).
