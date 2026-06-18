# memobank

`memobank` is a skill pack/framework for Codex CLI, Claude Code, OpenCode, and compatible agent runtimes.

It helps agents run a project through files instead of fragile chat history: Memory Bank docs, resumable protocols, JSON tasks, and evidence. The goal is simple: keep context durable, make work restartable, and give beginners a clear path in. 🌱

## Why it exists

As a project grows, chat history becomes a weak source of truth. Decisions drift, task state gets fuzzy, and the next agent often has to rediscover too much.

`memobank` keeps the working state in the repository:

- `.memory-bank/` stores product knowledge, requirements, features, architecture, and task records;
- `.memory-bank/contracts/boundary-map.md` stores lightweight responsibility and scope boundary notes used through existing task fields and `runtime_context`;
- `.memory-bank/packets/` stores derivative Execution Packets for task runtime context; T2/T3 require them, T0/T1 use them only when explicitly required;
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
  -> /spec-design
  -> /spec-improve FT-001
  -> /prd-to-tasks FT-001
  -> /prd-to-tasks FT-002
  -> ...
  -> /prd-to-tasks FT-N
  -> /verify generated JSON task records/artifacts
  -> /mb-packet TASK-001 when required (all T2/T3; explicit T0/T1)
  -> /execute first indexed TASK
  -> /verify same TASK
  -> /red-verify same TASK for T3 work (optional for T2 task closure)
  -> /red-verify --feature FT-001 for T2 feature completion
  -> /mb-sync
  -> repeat the feature/task loop until the project is done
```

In plain terms:

- `/analysis` and `/brief` help turn a raw idea into a usable input.
- `/constitution` runs a short contextual interview for project principles and non-negotiables. If you explicitly skip it, the flow can continue with framework-default/skipped principles and you can revisit it later.
- `/write-prd` captures a clear PRD.
- `/spec-init` creates a lightweight SDD route map from PRD/brief/existing-spec evidence. It does not run architecture design or create authoritative specs.
- `/prd` decomposes the PRD into Memory Bank product, requirements, epics, and features.
- `/spec-design` is mandatory after `/prd`, but adaptive in depth. Small independent T0/T1 projects get a minimal backbone with irrelevant areas marked `not_applicable`; shared/T2/T3 projects get normal architecture backbone decisions. It may also create one first foundation task when a minimum executable baseline is needed. If key decisions are unresolved, it records blockers and stops downstream.
- `/spec-improve FT-001` completes the minimum needed feature design, or marks it `not_required` for simple T0/T1-like work.
- `/prd-to-tasks FT-001` creates feature JSON tasks; `/spec-design` may already have created one first foundation task when a minimum executable baseline was needed. After the full `FT-*` set is decomposed, run `/verify` on the generated JSON task records/artifacts, then run `/mb-packet` for all T2/T3 tasks and explicit T0/T1 packet requirements before `/execute`.
- `/mb-packet TASK-001` builds or refreshes a compact derivative Execution Packet; T2/T3 require one, while T0/T1 require one only when `runtime_context.packet_required: true`. Task records and linked specs remain authoritative.
- `/execute`, `/verify`, and `/mb-sync` take one task from implementation to synchronized project memory.
- `/red-verify TASK-*` is required for T3 task closure and optional for T2 task closure; `/red-verify --feature FT-*` is required before a T2 feature is treated as complete.

## Automation, when you are ready

Automation is available, but it works best after the manual loop is familiar.

- `/autopilot` runs an existing JSON task queue as a scheduler/executor.
- `/autonomous` runs the full unattended flow from PRD/Product Brief/delta to terminal state.
Both require usable packets for T2/T3 tasks and for T0/T1 tasks only when
`runtime_context.packet_required: true`.

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

or go straight into the manual flow: `/analysis` -> `/brief` -> `/constitution` -> `/write-prd` -> `/spec-init` -> `/prd` -> `/spec-design` -> `/spec-improve FT-001` -> `/prd-to-tasks FT-001` -> `/prd-to-tasks FT-002` -> ... -> `/prd-to-tasks FT-N` -> `/verify generated JSON task records/artifacts` -> `/mb-packet TASK when required (all T2/T3; explicit T0/T1)` -> `/execute first indexed TASK`.

`/spec-init` is the pre-PRD spec framing step: it captures enough domain, scenario, constraints, non-goals, risks, boundary hints, and lifecycle context for `/prd` to decompose safely. A `/spec-init` PASS means the project is prepared for `/prd`; Global Backbone Status is intentionally pending until `/spec-design`. After the full `FT-*` set is broken down and the generated JSON task records/artifacts are reviewed, the project is ready for `/execute`. It keeps `.memory-bank/spec-index.md` as a pure spec registry and writes readiness/state to `.memory-bank/spec-backbone.md`.

## More detail

The full mechanics for installation, packaging, task model, tier policy, command reference, and checks live in [howItWorks.md](howItWorks.md).
