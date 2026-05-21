---
description: Tier policy for TASK routing, protocol depth, verification, and MB-SYNC.
status: active
---
# Tier Policy

Task records route execution by a single required field:

```json
"tier": "T0"
```

Allowed values: `T0`, `T1`, `T2`, `T3`.

Do not use a separate risk model in task records. If scope grows during execution, update the task to the higher tier and follow the higher-tier policy.

## T0 - trivial / docs-only

Use for typos, formatting, broken links, or safe documentation changes with no runtime, contract, state, data, security, or test impact.

- Protocol: compact `.protocols/<TASK_ID>/run.md`
- Separate `/verify`: not required
- `/red-verify`: not required
- Evidence: short note in the compact run is enough
- MB-SYNC: only when the Memory Bank meaningfully changes

## T1 - local code / local behavior

Use for one local function, one small component, a local unit test, or a contained behavior change with low blast radius.

- Protocol: compact `.protocols/<TASK_ID>/run.md` is allowed
- Checks: relevant local lint/typecheck/unit tests when available
- Separate `/verify`: optional; local verification can be recorded in the compact run
- `/red-verify`: not required
- MB-SYNC: required when documented behavior, task state, requirements, or changelog change

## T2 - cross-module / API / state / data / domain

Use for APIs, contracts, events, schemas, state machines, lifecycle changes, data behavior, migrations, multiple modules, or meaningful domain logic.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- `/red-verify`: required
- Evidence: store substantive artifacts under `.tasks/<TASK_ID>/`
- MB-SYNC: required

## T3 - critical / security / production / irreversible

Use for auth, permissions, secrets, security-sensitive behavior, deploy/runtime or production impact, irreversible migration, data loss, payments, compliance, or destructive operations.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- `/red-verify`: required
- Human-aware checkpoint: required before autonomous closure
- Rollback/recovery note: required
- MB-SYNC: required

## Assignment Rules

- Docs-only and safe -> `T0`
- Local, contained, low blast radius -> `T1`
- API, contracts, state, data, migration, domain logic, or multiple modules -> at least `T2`
- Auth, security, deploy/runtime, production, irreversible/data-loss, payments, or compliance -> `T3`
- If unsure between two tiers, choose the higher tier
