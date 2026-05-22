# memobank

`memobank` is a source-only skill pack/framework for Codex CLI, Claude Code, OpenCode, and compatible agent runtimes.

It installs package skills into the runtime, then bootstraps a target repository into a Memory Bank workspace: `.memory-bank/` for durable knowledge, `.protocols/` for resumable protocols, and `.tasks/` for runtime evidence and reports. The goal is to let agents work from files and verifiable state instead of fragile chat history.

## What to know first

- This repository is a source-only pack: canonical shared source lives in `skills/_shared/`.
- Package-local `skills/*/{agents,references,scripts}/shared-*` files are not committed.
- Skill installation and CI smoke tests first create a temporary vendored copy where `shared-*` files are generated, then call `skills add`.
- A target repository is bootstrapped in a separate step through the installed or source `shared-init-mb.js` / `init-mb.js`.
- The task model is JSON-only: `.memory-bank/tasks/index.json` indexes `.memory-bank/tasks/TASK-*.task.json`.
- Every task record must have `tier: T0|T1|T2|T3`; legacy `risk` and `risk.level` are invalid.
- A fresh bootstrap creates an empty task index and no runnable task records.

## Two different stages

### 1. Install package skills

For this source-only fork, do not run direct:

```bash
npx skills add <repo>
```

The correct entry point is the wrapper:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

You can pass normal `skills add` options, for example:

```bash
node scripts/install-framework.mjs --skill cold-start --global --yes
```

What the wrapper does:

1. Copies the current repository to a temporary directory.
2. Runs `scripts/vendor-shared.mjs` inside that copy.
3. Generates package-local `shared-*` assets for every installable skill.
4. Calls `npx -y skills add <prepared-temp-repo> ...`.
5. Removes the temporary repository unless `MEMOBANK_KEEP_INSTALL_TMP=1` is set.

### 2. Bootstrap the target repository

After package skills are installed, initialize the target repository through the installed skill script:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

When working directly from this framework source checkout, you can bootstrap a target repo with the source script:

```bash
node /path/to/memobank_BMAD_SDD/skills/_shared/scripts/init-mb.js
```

To update generated command specs, proxy skills, and runtime scripts in an already bootstrapped target repo:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js --sync
```

`--force` is currently equivalent to `--sync`.

## Source-only packaging

Canonical shared assets:

```text
skills/_shared/agents/*
skills/_shared/references/commands/*
skills/_shared/references/workflows/*
skills/_shared/references/protocols/*
skills/_shared/scripts/init-mb.js
```

Generated package-local assets:

```text
skills/<skill>/agents/shared-*
skills/<skill>/references/shared-*
skills/<skill>/scripts/shared-*
```

Generated `shared-*` files are intentionally absent in the source tree. If a `SKILL.md` or command doc appears to reference `shared-*` files, those links may look missing in the source-only tree. They become valid after vendoring/install, when the wrapper prepares the temporary installable copy.

Framework development rule:

- change shared behavior only in `skills/_shared/`;
- do not edit or commit generated package-local `shared-*`;
- before release/source checks, confirm the source tree is clean:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

Expected result in the source repo: `0`.

## What bootstrap creates in a target repo

`skills/_shared/scripts/init-mb.js` creates or updates the Memory Bank workspace. By default it does not overwrite existing files; `--sync` updates generated command specs, proxy skills, and runtime scripts.

Generated artifacts:

```text
.memory-bank/
  adrs/ADR-000-template.md
  agents/
  archive/
  architecture/
  bugs/
  commands/*.md
  commands/index.md
  constitution.md
  contracts/
  domains/
  epics/
  features/
  glossary.md
  guides/
  index.md
  invariants.md
  mbb/index.md
  product.md
  quality/
  requirements.md
  runbooks/
  schemas/task.schema.json
  skills/index.md
  spec-index.md
  states/
  tasks/index.json
  tasks/plans/
  tech-specs/
  testing/index.md
  workflows/autonomy-policy.md
  workflows/execute-loop.md
  workflows/mb-sync.md
  workflows/tier-policy.md
  changelog.md
.tasks/
.protocols/
scripts/mb-lint.mjs
scripts/mb-doctor.mjs
AGENTS.md
CLAUDE.md
GEMINI.md
.claude/skills/<command>/SKILL.md
.agents/skills/<command>/SKILL.md
```

`.memory-bank/commands/*.md` is the source of truth for generated slash commands. `.claude/skills/*` and `.agents/skills/*` are thin proxy skills that tell the runtime to read the matching command spec.

## Package skills

- `cold-start` - all-in-one bootstrap router for greenfield, idea-only, and brownfield projects.
- `mb-init` - skeleton generation and command/proxy creation.
- `mb-analysis` - optional discovery before PRD: `/analysis`, `/brainstorm`, `/brief`.
- `mb-from-prd` - clarified PRD -> product, requirements, epics, features.
- `mb-map-codebase` - as-is mapping of an existing codebase without roadmap speculation.
- `mb-execute` - implementation handoff for one `TASK-*`.
- `mb-verify` - functional verification against AC/REQ and evidence.
- `mb-red-verify` - adversarial semantic verification.
- `mb-review` - fresh-context Memory Bank review.
- `mb-garden` - lint, doctor, and maintenance assets.
- `mb-harness` - deterministic commands, clean sessions, and worktree guidance.

## Main workflows

### Idea/raw discovery

When the idea is raw or direction is unstable:

```text
/analysis -> /brainstorm -> /brief -> /write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

`/analysis` only routes. `/brainstorm` creates a brainstorming report. `/brief` creates the Product Brief as the input contract for `/write-prd`. None of these steps creates task records.

### Clear PRD or concept

If you have a clear concept but no PRD:

```text
/brief -> /write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

If you have an external PRD or PRD-like text:

```text
/write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

`/write-prd` normalizes input into `.memory-bank/prd.md` with `type: prd`, `clarification_status: complete`, and `constitution_checked: true`. `/prd` decomposes the PRD into L1-L3: product, requirements, epics, and features. `/prd-to-tasks` creates tasks only after feature docs exist.

### Brownfield

For an existing codebase, build the as-is baseline first:

```text
/map-codebase -> /write-prd --delta -> /prd -> /prd-to-tasks FT-<NNN>
```

You may use `/brief` to shape the delta input, but the route must not bypass `/write-prd`. Brownfield rule: without PRD/delta, do not create roadmap epics, features, or runnable task records. `/map-codebase` documents the current system; it does not invent the plan.

### Manual task loop

Interactive mode for one task:

```text
/execute TASK-001 -> /verify TASK-001 -> optional /red-verify TASK-001 -> /mb-sync
```

In manual mode, `/red-verify` is optional after `/verify PASS` and is used for risky/substantive tasks. If it finds a semantic issue, it may reopen/block/fail the task or create a bug/follow-up task.

### `/autopilot`

`/autopilot` is a scheduler/executor only for an existing JSON task queue.

Preconditions:

- `.memory-bank/tasks/index.json` lists indexed task records;
- every task has mandatory `tier`;
- the latest `/review` returned `APPROVE`;
- `node scripts/mb-doctor.mjs --strict` passes;
- no task-linked feature has pending/blocked clarification.

`/autopilot` does not run `/write-prd`, `/prd`, `/prd-to-tasks`, or create the task queue.

### `/autonomous`

`/autonomous` is the full unattended flow:

```text
PRD/Product Brief/delta
-> /write-prd
-> /prd
-> /review
-> /prd-to-tasks --all
-> task-planning review
-> strict doctor
-> scheduler loop
-> wave reviews
-> terminal state
```

It builds L1-L3, creates an all-feature JSON task queue, runs the scheduler loop, performs verification/red-verification according to tier policy, runs `/mb-sync`, gates through reviews, and finishes with an explicit terminal state: `SUCCESS`, `HALT_BLOCKING_QUESTIONS`, `HALT_CLARIFICATION_REQUIRED`, `HALT_REVIEW_REJECT`, `HALT_FAILURE_BUDGET`, `HALT_DEPENDENCY_DEADLOCK`, `HALT_POLICY_VIOLATION`, `HALT_QUALITY_GATES`, or `HALT_BUDGET_EXCEEDED`.

## Task model

The task registry is strictly JSON-only:

```text
.memory-bank/tasks/index.json
.memory-bank/tasks/TASK-001.task.json
.memory-bank/schemas/task.schema.json
```

Fresh bootstrap:

```json
{
  "version": 1,
  "tasks": []
}
```

A fresh bootstrap does not create `.memory-bank/tasks/TASK-001.task.json` and does not create runnable task records. Task records appear through `/prd-to-tasks FT-<NNN>` or `/prd-to-tasks --all`.

Minimal task record shape:

```json
{
  "id": "TASK-001",
  "title": "Short task title",
  "status": "planned",
  "wave": "W1",
  "feature": "FT-001",
  "reqs": ["REQ-001"],
  "depends_on": [],
  "touched_files": [],
  "tier": "T1",
  "gates": [],
  "verify": [],
  "docs": [],
  "evidence_required": [],
  "source_artifacts": [],
  "normative_inputs": [],
  "constraints": [],
  "invariants": [],
  "verification_targets": []
}
```

Allowed `status`: `planned`, `ready`, `in_progress`, `blocked`, `done`, `failed`.

Allowed `tier`: `T0`, `T1`, `T2`, `T3`.

Legacy `risk` and `risk.level` are removed. Execution, verification, red-verification, scheduler routing, and doctor checks must use only `task.tier`.

## Manual mode vs scheduler mode

Status ownership differs by mode.

Manual mode:

- `/execute` implements the task and records evidence/handoff.
- `/verify PASS` may close the task, including T2/T3.
- `/red-verify` after PASS is optional and risk-based; it may reopen/block/fail if the solution is semantically wrong.
- `/mb-sync` synchronizes Memory Bank, RTM, changelog, and task records after an explicit closure decision.

Scheduler mode (`/autopilot`, `/autonomous`):

- the scheduler owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done|failed`, dependent block/unblock, and terminal state;
- `/execute` does not close tasks;
- `/verify` does not close, fail, or promote dependents;
- `/red-verify` does not close, fail, or promote dependents;
- `/mb-sync` only records/reconciles the scheduler-provided decision and does not make a closure decision by itself.

Do not mix manual and scheduler mode inside one task run.

## Tier policy

| Tier | When to use | Protocol | Verification | Scheduler closure |
|---|---|---|---|---|
| `T0` | typo, links, formatting, safe docs-only | compact `.protocols/TASK/run.md` allowed | separate `/verify` usually not required | compact evidence / functional PASS is enough |
| `T1` | local code/local behavior with low blast radius | compact allowed | local gates; `/verify` optional | compact evidence / functional PASS is enough |
| `T2` | API, contracts, schema/state/data/domain, cross-module | full protocol required | `/verify` required; `/red-verify` required in scheduler | `VERDICT: PASS` + `SEMANTIC_VERDICT: semantic-pass` |
| `T3` | auth, security, secrets, prod/deploy, irreversible/data-loss, payments, compliance | full protocol required | `/verify` + `/red-verify` + human/recovery evidence | T2 requirements + exact `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present` |

If scope grows, raise the tier before handing the task forward. If unsure between two tiers, choose the higher one.

## Generated command reference

| Command | Purpose | Creates/updates | Does not do | Next step |
|---|---|---|---|---|
| `/cold-start` | Scenario router after skeleton creation | routing decision, next command recommendation | does not create EP/FT/TASK without PRD; does not bypass `/write-prd` | `/analysis`, `/brief`, `/write-prd`, `/map-codebase`, or stop |
| `/mb` | Prime agent context from Memory Bank | usually no writes; may create `.protocols/<TASK>/plan.md` for unknowns | does not implement | selected task/workflow command |
| `/mb-init` | Initialize Memory Bank skeleton | `.memory-bank/`, `.tasks/`, `.protocols/`, agent files, proxy skills | does not plan roadmap/tasks | `/cold-start` |
| `/analysis` | Optional discovery router | `.memory-bank/analysis/index.md` | does not create brief, PRD, tasks, research | `/brainstorm`, `/brief`, `/write-prd`, `/map-codebase`, `/clarify-feature` |
| `/brainstorm` | Facilitated ideation | `.memory-bank/analysis/brainstorming/BR-*.md`, analysis index | does not create PRD, Product Brief, tasks | `/brief` |
| `/brief` | Product Brief input contract | `.memory-bank/analysis/product-brief.md`, analysis index | does not create features/tasks; does not replace PRD | `/write-prd` |
| `/constitution` | Create/read/minimally amend governing principles | `.memory-bank/constitution.md` | does not add governance engines or command aliases | `/write-prd`, `/prd-to-tasks`, or current workflow |
| `/write-prd` | Product Brief/context -> clarified PRD | `.memory-bank/prd.md` | does not create EP/FT/TASK; does not bypass Constitution conflicts | `/prd` |
| `/prd` | Clarified PRD -> L1-L3 Memory Bank | product, requirements, epics, features, testing/index | does not blindly create the full task queue | `/clarify-feature` if blocked, else `/prd-to-tasks FT-*` |
| `/clarify-feature` | Resolve feature-level blockers | target `.memory-bank/features/FT-*.md` clarification metadata/answers | does not assign tier; does not create task records | `/prd-to-tasks FT-*` |
| `/prd-to-tasks` | Feature -> implementation plan + JSON tasks | `.memory-bank/tasks/plans/IMPL-FT-*.md`, indexed `TASK-*.task.json` | does not run execution; does not work through pending blockers | `/execute` manually or `/review`/`/autopilot` |
| `/execute` | Implement one scoped task | `.protocols/<TASK>/...`, `.tasks/<TASK>/...`, code/docs in task scope | does not close task; does not run verify/red-verify/mb-sync | `/verify` |
| `/verify` | Functional acceptance/evidence verification | verification protocol/evidence, task `verify` entries, possible bugs/follow-ups | in scheduler mode does not close/fail/promote | manual close or `/red-verify`/scheduler decision |
| `/red-verify` | Adversarial semantic verification | `.protocols/<TASK>/red-verification.md`, `.tasks/<TASK>/...`, bugs/follow-ups if needed | does not duplicate `/verify`; in scheduler mode does not close | `/mb-sync` or scheduler decision |
| `/review` | Fresh-context Memory Bank/planning review | `.tasks/TASK-MB-REVIEW/*`, fix list/verdict | is not per-task semantic verification | fix issues, `/prd-to-tasks`, `/autopilot`, or continue |
| `/map-codebase` | Brownfield as-is mapping | `.memory-bank/*` baseline docs, `.tasks/TASK-MB-MAP/*` | does not create roadmap/tasks without PRD | `/write-prd --delta` then `/prd` |
| `/mb-sync` | Synchronize durable docs and task consistency | indexes, RTM/lifecycle, changelog, task consistency | does not make scheduler closure/promotion decisions | `mb-doctor`, review, next task |
| `/mb-garden` | Maintain Memory Bank hygiene | lint findings, cleanup/archive recommendations | does not change product scope | fix docs or rerun checks |
| `/mb-doctor` | Deterministic readiness gate over `mb-lint` | report only; optional JSON output | does not replace `/review`, `/verify`, `/red-verify`; no markdown task-card fallback | fix findings or proceed to scheduler |
| `/mb-harness` | Set up deterministic agent-safe workflows | harness docs/config guidance, gates/worktree guidance | does not implement product tasks | run chosen workflow with gates |
| `/autopilot` | Execute existing JSON task queue | task statuses, protocols, evidence, sync/review loop | does not create PRD/FT/TASK queue | terminal state or follow-up fixes |
| `/autonomous` | Full unattended PRD -> done flow | PRD/L1-L3/tasks/protocols/reviews/status | does not ask user mid-run except terminal halt; does not bypass hard stops | terminal state |
| `/discuss` | Clarify unknowns/contradictions before implementation | decision log/protocol notes when useful | does not implement; does not create tasks by itself | resolved command such as `/write-prd`, `/execute` |
| `/add-tests` | Add useful unit/integration/e2e coverage | tests, `.memory-bank/testing/index.md`, evidence under `.tasks/` | does not add decorative/flaky tests | run tests, `/mb-sync` |
| `/find-skills` | Find relevant installed/marketplace skills | recommendation list | does not install marketplace skills without confirmation | use/install selected skills |

## Checks

Framework/source repo checks:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
```

The `find` command should print `0`.

Optional installer debugging:

```bash
MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes
```

Target repo checks after bootstrap:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs
```

Use strict doctor only after a real executable task queue exists:

```bash
node scripts/mb-doctor.mjs --strict
```

In a fresh skeleton, empty `.memory-bank/tasks/index.json` is valid in default doctor mode and invalid in strict mode because there is no executable queue.

## Repository map for this framework

```text
skills/_shared/                 canonical shared source
skills/*/SKILL.md               installable package skill entrypoints
skills/*/assets|references      skill-specific non-shared assets
scripts/install-framework.mjs   source-only installer wrapper
scripts/vendor-shared.mjs       temp-copy shared asset vendoring
.github/workflows/release-check.yml
                                 source hygiene, syntax, install/bootstrap smoke
README.ru.md / README.en.md     full documentation
README.md                       short bilingual entrypoint
PROJECT_MAP.md                  agent-facing repository map
```

## Documentation caveats

`PROJECT_MAP.md` currently references `HANDOFF.md` and `Optimisation.md` as planning/context docs, but those files are absent in the current tree. This README intentionally does not link to them as existing documentation.

## License

MIT
