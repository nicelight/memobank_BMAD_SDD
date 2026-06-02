---
description: Mandatory global SDD architecture backbone gate after PRD decomposition and before feature design.
status: active
---
# /spec-design - Global SDD backbone gate

<objective>
Create or update the mandatory global architecture/design backbone after `/prd` has created the FT set and before `/spec-improve FT-<NNN>`, `/spec-auto --all`, or `/prd-to-tasks`.

The first result is AI-first implementation guardrails: technical decisions, boundaries, and contracts that constrain agents/developers so they do not damage the project. It is not an architecture essay.

Main question:
> What technical decisions, boundaries, and contracts must constrain implementation so agents/developers cannot tear the project apart?

The gate is mandatory by workflow, but adaptive by depth:
- simple T0/T1 projects create a minimal backbone and mark irrelevant areas `not_applicable`;
- projects with shared/T2/T3 concerns get staged architecture decisions and normal backbone specs;
- unresolved key decisions are recorded as blockers and downstream commands must stop.

`/spec-design` does not create TASK records, implementation plans, or feature-local tech specs, and it does not replace `/spec-improve`.
</objective>

<process>

## 0) Input and timing
Run after `/prd`.

Supported arguments:
- no argument: inspect all current features and update the global backbone
- `--all`: same as no argument; explicit for autonomous or batch flow

Required inputs:
- `.memory-bank/spec-index.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/`
- `.memory-bank/features/`
- `.memory-bank/user-scenarios.md` when present
- existing relevant specs under `.memory-bank/architecture/`, `.memory-bank/guides/`, `.memory-bank/domains/`, `.memory-bank/contracts/`, `.memory-bank/states/`, `.memory-bank/adrs/`, `.memory-bank/testing/`, and `.memory-bank/runbooks/`

Never skip the command. For small independent T0/T1-only scope, write the minimal backbone status and mark non-applicable areas instead of expanding architecture.

## 1) Source-of-truth precedence
Use this precedence when deciding what is authoritative:
1. Constitution / explicit user decision
2. Existing production code and brownfield baseline
3. ADRs
4. Authoritative contracts/specs
5. PRD / requirements / features
6. User scenarios
7. Task records
8. Agent assumptions

A lower source cannot override a higher source. Any conflict becomes `blocked` unless the user makes an explicit decision.

## 2) Brownfield guard
Before interviewing, inspect whether meaningful production code exists and whether a mapped baseline / authoritative architecture baseline exists.

Interactive mode:
- If meaningful code exists but baseline is missing, ask one question:
  - **Run `/map-codebase` first (recommended)**: create authoritative brownfield baseline before architecture decisions.
  - **PRD-only override**: continue from PRD evidence and record drift risk.
  - **Minimal local delta only**: continue only for a clearly local/safe change with narrow `not_applicable` rationale.

Autonomous mode:
- Block if baseline is missing and scope is not clearly local/safe.
- Continue only when evidence proves the change is local, reversible, and does not affect shared architecture/contracts.

## 3) User scenarios preflight
Check `.memory-bank/user-scenarios.md`.

If scenarios are visible in PRD/requirements/features/existing specs, create or update a draft and ask the user to review/add before relying on scenario-sensitive architecture decisions.

If scenarios are absent and materially affect architecture, record a blocker/gap instead of guessing.

Use this simple template:

```markdown
# User Scenarios

## Primary Actors
- TBD

## Core Scenarios
- Scenario:
  - Architecture implications:

## Out Of Scope Scenarios
- TBD

## Review Status
- Status: draft|reviewed|blocked
- Notes:
```

## 4) Initial architecture mode
After reading PRD/requirements/features and current specs, ask one initial architecture mode question in interactive mode, or choose the mode from evidence in autonomous mode:

- **Minimal T0/T1 backbone**: only for explicitly local/simple scope; irrelevant global areas require `not_applicable` rationale.
- **Standard AI-first architecture backbone (recommended when shared behavior exists)**: normal guardrails for modules, source-of-truth, contracts, data, testing, and deployment.
- **Strict T2/T3 backbone**: for public contracts, security/safety, migrations, distributed/runtime boundaries, cross-team ownership, or irreversible decisions.

Recommend the mode from evidence; the user may override. Preserve the rule that `/prd-to-tasks` may route back to `/spec-design` or `/spec-improve` if T2/T3 indicators appear during task slicing.

## 5) Backbone status gate
Update `.memory-bank/spec-index.md` with this exact contract:

```markdown
## Global backbone status
- Status: complete|minimal|blocked
- Mode: minimal_t0_t1|standard_ai_first|strict_t2_t3
- Architecture artifact strategy: single-file|split-core-docs|split-by-boundary-topic
- Not applicable areas:
  - event_message_contracts: not_applicable - no event/message boundary in T0/T1 scope.
- Notes:
```

For `minimal`, explicit not-applicable global/shared lines must appear inside `## Global backbone status` under `- Not applicable areas:` for readiness-gate compatibility. They may also be mirrored in `## Not applicable areas` for routing clarity.

```markdown
## Not applicable areas
- event_message_contracts: not_applicable - no event/message boundary in T0/T1 scope.
```

Do not use `TBD`, `none`, or empty placeholders as a substitute for `not_applicable` rationale.

Status criteria:
- `complete`: every relevant/global area in the Backbone Area Matrix has an authoritative linked source or explicit `not_applicable`; no `unknown`, `planned`, `candidate`, or `blocked` remains in global/shared areas.
- `minimal`: only for explicit T0/T1-like scope; each unnecessary global/shared area has `not_applicable` plus rationale.
- `blocked`: unsafe ambiguity remains, source-of-truth conflict exists, or a required global/shared area cannot be decided truthfully.

If status is `blocked`, stop downstream work. Record:
- unresolved decision
- affected features/requirements
- why a conservative assumption would be unsafe
- next question or owner needed

## 6) Backbone Area Matrix
Maintain a concise matrix in `.memory-bank/spec-index.md`. The index holds only labels, status, links, and gaps; detailed rules live in linked specs or ADRs.

Required columns:

| Area | Status | Authoritative source | Notes |
|---|---|---|---|

Required areas:
- `architecture_style`
- `source_of_truth`
- `module_boundaries`
- `user_scenarios`
- `constraints`
- `non_goals`
- `data_flow`
- `storage`
- `api_contracts`
- `event_message_contracts`
- `agent_io_contracts`
- `security_safety`
- `testing_strategy`
- `deployment`
- `risks`
- `open_questions`

Allowed area statuses: `authoritative`, `needed_before_tasks`, `not_applicable`, `blocked`.
Use `needed_before_tasks` only as a temporary working status; final `complete|minimal` cannot contain it for relevant/global areas.

## 7) Spec-index content boundary
`.memory-bank/spec-index.md` is an index and route map, not an authoritative design spec.

Allowed in `spec-index.md`:
- global backbone status, blockers, and next command routing
- short decision labels, such as `Architecture: local layered modular monolith`
- Backbone Area Matrix with links and short notes
- links to authoritative specs/ADRs and one-line scope notes
- feature-to-spec routing

Not allowed in `spec-index.md`:
- decision body, rationale, trade-off analysis, or architecture rules
- API naming/status/error/auth/upload rules
- state transitions, data schemas, event/message envelope rules, safety policy, or testing gate details
- duplicated content that already belongs in `.memory-bank/architecture/`, `.memory-bank/contracts/`, `.memory-bank/domains/`, `.memory-bank/states/`, `.memory-bank/testing/`, `.memory-bank/invariants.md`, or `.memory-bank/adrs/`

If a decision needs more than a short label plus link, write it in the relevant authoritative spec or ADR and route it from `spec-index.md`. If `spec-index.md` already contains detailed decision content, summarize it into labels and move the body to the linked spec.

## 8) Phase A - staged architecture decision interview
Do not use a long questionnaire. Ask one question at a time with 2-3 options, a preferred option, and a short rationale. After each answer, record the decision body and rationale in the relevant authoritative spec or ADR. Update `.memory-bank/spec-index.md` only with the short decision label, status, and link.

Confirm or choose only decisions that affect the current PRD:
- architecture style
- source-of-truth hierarchy
- module/bounded-context boundaries
- persistence strategy
- API style
- frontend/backend boundary
- event/message model
- agent input/output boundaries
- schema strategy
- deployment assumptions
- testing gates
- architecture documentation granularity

For simple/T0-T1 projects, prefer conservative defaults such as modular monolith, local/simple persistence, no event bus, no separate HTTP boundary, and minimal testing gates when supported by PRD evidence. Mark unrelated areas `not_applicable`.

In autonomous mode, do not ask questions. Record conservative assumptions only when they are reversible and safe; otherwise set backbone status `blocked`.

## 9) Architecture documentation granularity
Before creating multiple files under `.memory-bank/architecture/`, choose the architecture artifact strategy.

Ask one targeted question unless the answer is obvious from project size or existing docs:
- **Single-file KISS (recommended default)**: keep the global architecture backbone in `.memory-bank/architecture/system-architecture.md`; include source-of-truth, module-boundary, deployment, data-flow, and Mermaid diagram sections there.
- **Split core docs**: create `system-architecture.md`, `source-of-truth.md`, and `module-boundaries.md` only when those sections are large, reused independently, or owned by different workstreams.
- **Split by boundary/topic**: add extra files such as `agno-boundary.md` only for large projects or complex external/runtime boundaries that would make `system-architecture.md` hard to prime.

Default to Single-file KISS for small, early, T0/T1, or unclear scope. Do not create `.memory-bank/architecture/index.md` unless the architecture folder has more than three docs. If the project already has split architecture docs, do not churn them unless consolidation is explicitly useful.

Recommended `system-architecture.md` sections for Single-file KISS:
- `# System Architecture`
- `## System goal`
- `## Main constraints`
- `## Non-goals`
- `## Architecture style`
- `## Main modules / bounded contexts`
- `## Data flow`
- `## External integrations`
- `## Storage decisions`
- `## API / contract boundaries`
- `## Security / safety constraints`
- `## Testing strategy`
- `## Deployment assumptions`
- `## Risks`
- `## Open questions`

Architecture docs content boundary:
- keep only global architecture decisions and invariants there: system shape, ownership, module boundaries, source-of-truth, deployment assumptions, high-level data flow, and diagrams
- do not put detailed API schemas, endpoint contracts, lifecycle state machines, message/event envelope contracts, or feature-local implementation design in `architecture/*`
- route those details to `.memory-bank/contracts/`, `.memory-bank/states/`, `.memory-bank/domains/`, or feature-level `.memory-bank/tech-specs/`

## 10) Phase B - write initial global specs
Write or update only relevant backbone artifacts:
- `.memory-bank/spec-index.md`
- `.memory-bank/user-scenarios.md` when scenario evidence exists or a scenario gap must be explicit
- `.memory-bank/architecture/system-architecture.md` as the default architecture hub, using the Single-file KISS sections above and Mermaid C4/context/container/component, data flow, and sequence diagrams when useful
- `.memory-bank/architecture/source-of-truth.md` only when Split core docs or Split by boundary/topic was selected, or when source-of-truth rules are too large/reused to keep in `system-architecture.md`
- `.memory-bank/architecture/module-boundaries.md` only when Split core docs or Split by boundary/topic was selected, or when boundary rules are too large/reused to keep in `system-architecture.md`
- `.memory-bank/architecture/<boundary>.md` only for a complex dedicated architecture boundary that cannot stay readable inside `system-architecture.md`
- `.memory-bank/domains/runtime-data-model.md`
- `.memory-bank/contracts/api-guidelines.md`
- `.memory-bank/contracts/http-api.md` or `.memory-bank/contracts/openapi.md` only when a separate HTTP boundary spec is needed
- `.memory-bank/contracts/agent-chat-bus.md` if agent/event/chat boundary exists
- `.memory-bank/contracts/message-envelope.md` if messages/events/envelopes exist
- `.memory-bank/guides/frontend-component-guide.md` if frontend component system/design behavior is in scope
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/testing/*`
- `.memory-bank/adrs/*` for stable architecture decisions

Keep output conservative. Prefer updating an existing authoritative spec over creating a new one.
Prefer fewer architecture files for faster priming; split only when it removes real complexity or matches the selected artifact strategy.
Keep architecture docs global: if the content is an API schema, lifecycle state machine, message/event contract, or feature-local behavior, create or update the relevant contract/state/domain/tech-spec instead of expanding `architecture/*`.

Do not create:
- `.memory-bank/tasks/*.task.json`
- `.memory-bank/tasks/plans/*`
- feature-local `.memory-bank/tech-specs/FT-*.md`
- implementation plans
- separate diagrams folders; diagrams belong as Mermaid sections in `.memory-bank/architecture/system-architecture.md`
- extra architecture files just because a standard filename exists in this command

## 11) Verifiable contracts routing
For AI-first architecture, route concrete contracts to verifiable artifacts when relevant:
- OpenAPI
- JSON Schema
- Pydantic models or equivalent stack schemas
- DB schema / migrations
- event/message schemas
- agent input/output schemas

KISS rule: `/spec-design` must decide each relevant contract area as `authoritative`, `needed_before_tasks`, `not_applicable`, or `blocked`. It does not need to write every concrete contract immediately.

OpenAPI is not the source of truth for the whole system.

Rules:
- backend schemas such as FastAPI/Pydantic, or equivalent stack schemas, should generate OpenAPI when that stack exists or is selected
- `.memory-bank/contracts/api-guidelines.md` defines naming, status codes, error format, auth, CORS, upload, pagination, and compatibility rules
- OpenAPI covers only frontend/backend HTTP API
- agent/domain/event/state/safety contracts live in separate specs
- do not write a large hand-written `openapi.yaml` before architecture design
- gate: generated OpenAPI validates and critical endpoints have integration/contract tests

## 12) Phase C - targeted follow-up interviews
While writing boundary/data/testing specs, ask follow-up questions only for unresolved branch decisions that block truthful specs.

Examples:
- the data model needs retention or migration rules not present in PRD
- HTTP API exists but auth/error/upload behavior is undecided
- event/message boundary exists but envelope or ordering rules are undecided
- agent I/O boundary exists but schemas, ownership, or failure semantics are unclear
- frontend component behavior is normative but ownership/design system source is unclear

If the answer is unavailable and a safe assumption is not possible, mark backbone status `blocked` and stop.

## 13) Update routing
Update `.memory-bank/spec-index.md`:
- exact `## Global backbone status` section and `- Status: complete|minimal|blocked` line
- Backbone Area Matrix with authoritative links or explicit `not_applicable` rationale
- source-of-truth route labels and links; detailed hierarchy/rules live in the selected architecture artifact (`system-architecture.md` by default, or `source-of-truth.md` when split)
- global backbone blockers and next command routing
- architecture artifact strategy and baseline backbone specs with their scope
- short backbone decision labels only, never decision body/rationale/rules
- feature-to-backbone routing
- expected spec locations

For affected feature docs:
- add SDD Design Gate notes with normative backbone links where evidence exists
- do not set `spec_design_status: complete` unless feature-local `/spec-improve` criteria are already fully satisfied
- do not mark `not_required` for features that still depend on shared T2/T3 backbone decisions

## 14) Handoff
Report:
- backbone status: `complete`, `minimal`, or `blocked`
- architecture mode and evidence
- architecture artifact strategy: single-file, split core docs, or split by boundary/topic
- specs created/updated
- Backbone Area Matrix summary
- not_applicable areas and rationale for simple projects
- affected features and normative links
- blockers/open questions
- next command: `/spec-improve FT-<NNN>` for manual flow, or `/spec-auto --all` before `/prd-to-tasks --all` in autonomous flow

</process>
