# KISS-рекомендации по Task Runtime Context для `memobank_BMAD_SDD`

## 0. Назначение

Документ фиксирует упрощенный вариант идеи Task Runtime Context для текущего
фреймворка `memobank_BMAD_SDD`.

Цель: дать агенту перед `/execute TASK-XXX` компактный и проверяемый runtime
контекст, не создавая параллельный Memory Bank и не раздувая workflow.

Ключевое решение:

```text
Task record + linked SDD specs остаются source of truth.
Execution Packet является производным runtime-артефактом.
```

Если packet противоречит task record, feature, tier policy или linked specs,
packet не должен побеждать. Его нужно пересобрать или остановить выполнение.

---

## 1. Что уже есть в фреймворке

Текущая модель уже содержит базу для runtime context:

```text
.memory-bank/tasks/index.json
.memory-bank/tasks/TASK-XXX.task.json
.memory-bank/schemas/task.schema.json
.memory-bank/spec-backbone.md
.memory-bank/spec-index.md
.memory-bank/tech-specs/*
.memory-bank/architecture/*
.memory-bank/contracts/*
.memory-bank/domains/*
.memory-bank/states/*
.memory-bank/testing/*
.memory-bank/guides/*
.memory-bank/runbooks/*
.protocols/TASK-XXX/*
.tasks/TASK-XXX/*
```

В task record уже есть поля:

```json
{
  "source_artifacts": [],
  "normative_inputs": [],
  "constraints": [],
  "invariants": [],
  "verification_targets": []
}
```

Эти поля не нужно заменять. Task Runtime Context должен использовать их как
основной вход.

---

## 2. Что НЕ вводим

Чтобы сохранить KISS, не вводим отдельные большие слои.

### 2.1 Не вводим `.memory-bank/modules/`

Отдельный `/modules` или `.memory-bank/modules/` не нужен.

Причины:

- текущий framework уже имеет `.memory-bank/contracts/`,
  `.memory-bank/architecture/`, `.memory-bank/domains/` и `.memory-bank/states/`;
- module boundaries уже должны жить в architecture/contracts;
- новый module layer создаст второй source of truth;
- packet builder может брать module/boundary context из существующих SDD links.

Если нужна граница модуля, ее следует описывать в существующих местах:

```text
.memory-bank/architecture/system-architecture.md
.memory-bank/architecture/module-boundaries.md
.memory-bank/contracts/<boundary>.md
.memory-bank/domains/<domain>.md
```

### 2.2 Не вводим отдельный Graph Layer

Отдельная `.memory-bank/graph/` в первой итерации не нужна.

Причины:

- это быстро станет stale artifact;
- текущий workflow уже маршрутизирует через `spec-index`, task richer fields и
  linked SDD specs;
- drift detection лучше делать позже, когда packet flow стабилен.

Если в будущем понадобится graph, его можно добавить как generated/report-only
artifact, а не как обязательный source of truth.

### 2.3 Не вводим Failure Packet

Отдельный Failure Packet в первой итерации не нужен.

Причины:

- `/execute`, `/verify`, `/red-verify` уже пишут protocol/evidence/handoff;
- failure artifact легко начнет дублировать `.protocols/TASK-XXX/*` и
  `.tasks/TASK-XXX/*`;
- для KISS достаточно структурированного failure/blocker блока в существующих
  отчетах.

Вместо Failure Packet используем единый минимальный блок:

```md
## Failure / Blocker
- Status: blocked|failed
- Where: command/protocol/file
- Expected:
- Observed:
- Likely category: code|spec|task|packet|verification|tool|unknown
- Recommended next action:
- Requires replan: yes/no
```

Этот блок можно писать в:

```text
.protocols/TASK-XXX/run.md
.protocols/TASK-XXX/progress.md
.protocols/TASK-XXX/verification.md
.protocols/TASK-XXX/red-verification.md
.tasks/TASK-XXX/*final-report*.md
```

---

## 3. Minimal Task Runtime Context

Минимальный runtime context состоит из двух частей:

```text
1. Optional task purpose fields
2. Optional execution packet for T2/T3 or ambiguous work
```

### 3.1 Optional task purpose fields

В task schema рекомендуется добавить optional поля:

```json
{
  "purpose": "Why this task exists.",
  "success_outcome": "Observable result that proves real success.",
  "anti_goals": [
    "What must not be changed or optimized away."
  ]
}
```

Эти поля:

- не должны быть required;
- не должны ломать existing tasks;
- должны заполняться `/prd-to-tasks`, когда evidence есть в PRD/feature/specs;
- могут оставаться пустыми/отсутствовать для T0/T1 simple work.

Назначение:

```text
purpose          -> зачем задача существует
success_outcome  -> какой наблюдаемый результат нужен
anti_goals       -> что нельзя делать ради "закрытия" задачи
```

### 3.2 Optional runtime context fields

В task schema можно добавить optional поле `runtime_context`:

```json
{
  "runtime_context": {
    "packet_required": false,
    "packet_ref": ".memory-bank/packets/TASK-001.packet.json",
    "allowed_write_scope": [],
    "forbidden_scope": [],
    "stop_conditions": []
  }
}
```

Правила:

- `packet_required: false` по умолчанию;
- для `T0/T1` packet обычно не нужен;
- `T2/T3` SHOULD use packet;
- `T2/T3` MUST use packet only when at least one of these is true:
  - cross-module contract/state/data/security/runtime behavior is involved;
  - task has linked SDD specs;
  - `success_outcome` cannot be verified from task record alone;
  - `allowed_write_scope` matters;
- если `packet_required: true`, `/execute` должен проверить наличие и свежесть
  packet перед implementation;
- `allowed_write_scope` и `forbidden_scope` являются preflight/evidence
  contract, а не заменой permissions/sandbox.

---

## 4. Execution Packet

Execution Packet - это компактный derivative artifact для одного task run.

Файл:

```text
.memory-bank/packets/TASK-XXX.packet.json
```

Packet не является source of truth. Он компилирует уже существующий контекст:

```text
task record
feature/REQ
spec-backbone/spec-index
linked SDD specs
guides/runbooks/testing docs when linked or relevant
tier policy
protocol expectations
```

### 4.1 Minimal packet shape

```json
{
  "schema_version": 1,
  "packet_id": "PACKET-TASK-001-R1",
  "task_id": "TASK-001",
  "created_at": "ISO-8601",
  "source_task_hash": "hash",
  "status": "ready",

  "tier": "T2",
  "purpose": "",
  "success_outcome": "",
  "anti_goals": [],

  "source_refs": {
    "task": ".memory-bank/tasks/TASK-001.task.json",
    "feature": ".memory-bank/features/FT-001-example.md",
    "specs": [],
    "guides": [],
    "protocols": []
  },

  "scope": {
    "allowed_write_scope": [],
    "forbidden_scope": []
  },

  "verification": {
    "commands": [],
    "success_checks": [],
    "evidence_required": []
  },

  "stop_conditions": [],

  "required_handoff": [
    "changed_files",
    "commands_run",
    "evidence",
    "scope_compliance",
    "blockers_or_none"
  ]
}
```

### 4.2 Packet statuses

Packet может иметь только свои local statuses:

```text
ready
ready_with_gaps
blocked
stale
```

Важно: эти статусы не добавляются в task lifecycle.

Task lifecycle остается только:

```text
planned|ready|in_progress|blocked|done|failed
```

`ready_with_gaps` означает:

```text
Packet usable for bounded work, but some non-blocking context is missing.
```

Для `T2/T3` gaps должны быть осторожными. Если отсутствует обязательный linked
SDD spec или verification basis, status должен быть `blocked`, а не
`ready_with_gaps`.

### 4.3 Freshness

Packet считается stale, если изменился один из источников:

```text
task record
linked feature
linked SDD spec
tier policy
verification target
allowed/forbidden scope
```

В первой итерации достаточно `source_task_hash`. Более сложные multi-source
hashes можно добавить позже.

---

## 5. Новый command `/mb-packet`

Назначение:

```text
Build or refresh execution packet for one TASK.
```

Вход:

```text
/mb-packet TASK-001
```

Алгоритм:

```text
1. Read .memory-bank/tasks/index.json.
2. Read indexed TASK-XXX.task.json.
3. Read linked feature/REQ and richer task fields.
4. Read spec-backbone/spec-index only when needed by tier or linked specs.
5. Resolve linked SDD specs from source_artifacts/normative_inputs/
   constraints/invariants/verification_targets.
6. Build compact packet.
7. Mark packet ready, ready_with_gaps, blocked, or stale.
8. Write .memory-bank/packets/TASK-XXX.packet.json.
9. Report missing inputs without inventing them.
```

Do not:

```text
- create task records;
- edit product specs silently;
- invent module graph;
- create Failure Packet;
- close tasks;
- run implementation.
```

Output:

```text
Packet: .memory-bank/packets/TASK-001.packet.json
Status: ready|ready_with_gaps|blocked|stale
Missing:
- ...
Next action:
- /execute TASK-001 or resolve blocker
```

---

## 6. Changes to existing commands

### 6.1 `/prd-to-tasks`

Add optional fields when evidence exists:

```json
{
  "purpose": "",
  "success_outcome": "",
  "anti_goals": [],
  "runtime_context": {
    "packet_required": false,
    "allowed_write_scope": [],
    "forbidden_scope": [],
    "stop_conditions": []
  }
}
```

Rules:

- do not invent purpose fields without PRD/feature/spec evidence;
- T0/T1 may omit runtime context;
- T2/T3 SHOULD use packet;
- T2/T3 MUST set `packet_required: true` only when:
  - cross-module contract/state/data/security/runtime behavior is involved;
  - task has linked SDD specs;
  - `success_outcome` cannot be verified from task record alone;
  - `allowed_write_scope` matters;
- `allowed_write_scope` can default from `touched_files`;
- `forbidden_scope` should be used only when there is a real risk;
- `stop_conditions` should stay short.

Good stop conditions:

```text
- linked spec contradicts task goal
- needed public contract is missing
- implementation requires scope outside allowed_write_scope
- verification cannot prove success_outcome
- security/runtime decision is unclear
```

### 6.2 `/execute`

Preflight:

```text
1. Read task record.
2. If runtime_context.packet_required is true, read packet_ref.
3. If packet missing/stale/blocked, stop and ask to run /mb-packet or resolve blocker.
4. Print Goal Interpretation from task/packet.
5. Implement only bounded task scope.
```

Goal Interpretation block:

```text
Goal Interpretation
- Purpose:
- Success outcome:
- Anti-goals:
- Allowed write scope:
- Forbidden scope:
- Stop conditions:
```

Important:

- packet verification commands are required when present;
- agent may add relevant local tests;
- agent must report any command it could not run;
- `/execute` still does not close tasks.

Handoff should include:

```text
- changed files
- commands run
- evidence paths
- scope compliance: yes/no
- forbidden scope touched: yes/no
- blockers or none
- recommended next owner
```

### 6.3 `/verify`

In addition to current AC/REQ checks, verify:

```text
- purpose achieved when present
- success_outcome observable when present
- anti_goals respected
- required packet verification commands/checks covered
- evidence is sufficient
- forbidden scope was not touched
```

If packet is missing for a task that required it:

```text
VERDICT: NEEDS-CLARIFICATION or FAIL
Reason: packet required but absent/stale
```

Exact verdict choice can follow existing `/verify` ownership/mode rules.

### 6.4 `/red-verify`

Add packet-aware semantic questions:

```text
- Did the implementation optimize for local task closure instead of purpose?
- Did it violate anti_goals?
- Did it exceed allowed autonomy/scope?
- Did weak task/packet context hide a semantic problem?
- Should the fix be code, spec, task slicing, or verification improvement?
```

Do not create a separate Failure Packet. Use the existing red-verification report
and the `Failure / Blocker` block when needed.

### 6.5 `/mb-sync`

If packet flow is used, sync should only reconcile already-written evidence:

```text
- task verify evidence
- packet_ref if stored in task record
- protocol links
- changelog/RTM updates when durable docs changed
```

`/mb-sync` should not decide closure by itself.

---

## 7. Minimal files to add or change

### Add

```text
skills/_shared/references/commands/mb-packet.md
skills/_shared/references/protocols/packet-template.json
```

Optional if schema validation is implemented immediately:

```text
skills/_shared/references/schemas/execution-packet.schema.json
```

### Update

```text
skills/_shared/scripts/init-mb.js
skills/_shared/references/structure-template.md
skills/_shared/references/commands/prd-to-tasks.md
skills/_shared/references/commands/execute.md
skills/_shared/references/commands/verify.md
skills/_shared/references/commands/red-verify.md
skills/_shared/references/commands/mb-sync.md
skills/_shared/references/workflows/tier-policy.md
skills/mb-garden/assets/mb-lint.mjs
skills/mb-garden/assets/mb-doctor.mjs
README.en.md
README.ru.md
howItWorks.md
```

### Bootstrap additions

`init-mb.js` should create:

```text
.memory-bank/packets/
```

It should not create:

```text
.memory-bank/modules/
.memory-bank/graph/
.memory-bank/verification/
```

Verification remains in existing task `verify`, `verification_targets`,
`.memory-bank/testing/`, `.protocols/TASK-XXX/verification.md`, and
`.tasks/TASK-XXX/*`.

---

## 8. Acceptance Criteria

KISS implementation is complete when:

```text
1. Task schema supports optional purpose/success_outcome/anti_goals.
2. Task schema supports optional runtime_context.
3. Bootstrap creates .memory-bank/packets/.
4. /mb-packet builds a packet for one existing indexed task.
5. /mb-packet never invents missing SDD/spec context.
6. T0/T1 tasks continue to work without packets.
7. T2/T3 tasks SHOULD use packets, but MUST require packets only for the
   listed cross-module/spec/verification/scope conditions.
8. /execute blocks on missing/stale/blocked required packet.
9. /execute reports Goal Interpretation and scope compliance.
10. /verify checks purpose/success_outcome/anti_goals when present.
11. /red-verify checks false success, autonomy/scope violation, and weak context.
12. No .memory-bank/modules/ layer is introduced.
13. No separate Failure Packet is introduced.
14. Existing task lifecycle remains planned|ready|in_progress|blocked|done|failed.
15. Source-only packaging remains clean: no generated shared-* files in source tree.
```

Backward compatibility:

```text
Existing tasks without purpose/runtime_context/packet must remain valid.
T0/T1 execution must not require /mb-packet.
T2/T3 can require /mb-packet only when task runtime_context says so, and
runtime_context.packet_required should be set only for the listed
cross-module/spec/verification/scope conditions.
```

---

## 9. Recommended implementation order

### Phase 1 - Schema and docs

```text
1. Add optional task fields.
2. Add .memory-bank/packets/ bootstrap.
3. Document packet rules in structure-template and howItWorks.
4. Update mb-lint/mb-doctor to tolerate absent optional fields.
```

### Phase 2 - `/mb-packet`

```text
1. Add command spec.
2. Build packet from task + linked specs.
3. Detect missing/stale/blocked state.
4. Write packet JSON.
```

### Phase 3 - Execution integration

```text
1. /execute checks packet when required.
2. /execute prints Goal Interpretation.
3. /execute records scope compliance in protocol/handoff.
```

### Phase 4 - Verification integration

```text
1. /verify checks purpose and packet compliance.
2. /red-verify checks semantic false success and autonomy/scope drift.
3. Failure/blocker information stays in existing protocol/report files.
```

### Phase 5 - Later, only if needed

Consider later:

```text
- deterministic multi-source packet hashing
- generated drift reports
- stronger allowed_write_scope validation
- richer guide selection
```

Do not add these before the simple packet flow is working.

---

## 10. One-sentence design principle

```text
Keep source of truth in task records and linked specs; use Execution Packet only
as a small, disposable runtime handoff that tells /execute what this run is for,
what it may touch, how to prove success, and when to stop.
```

---

## 11. Implementation Plan

### 11.1 MVP boundary

Implement the smallest useful Task Runtime Context flow:

```text
optional task runtime fields
-> optional packet file
-> /execute preflight
-> /verify and /red-verify packet-aware checks
-> scheduler respects packet_required
```

Do not introduce:

```text
.memory-bank/modules/
.memory-bank/graph/
.memory-bank/verification/
Failure Packet
new task lifecycle statuses
mandatory packets for every T2/T3 task
```

The packet remains derivative. Task records, linked SDD specs, tier policy, and
protocol/evidence files remain authoritative.

### 11.2 Wave 1 - Schema, skeleton, and tolerant validators

Touch points:

```text
skills/_shared/scripts/init-mb.js
skills/_shared/references/structure-template.md
skills/mb-garden/assets/mb-lint.mjs
skills/mb-garden/assets/mb-doctor.mjs
```

Changes:

```text
1. Extend TASK_SCHEMA with optional:
   - purpose: string
   - success_outcome: string
   - anti_goals: string[]
   - runtime_context: object
2. runtime_context should allow:
   - packet_required: boolean
   - packet_ref: string
   - allowed_write_scope: string[]
   - forbidden_scope: string[]
   - stop_conditions: string[]
3. Bootstrap .memory-bank/packets/.
4. Update structure-template task schema and example task record.
5. Update mb-lint allowed task keys and basic shape checks.
6. Update mb-doctor so absent optional fields are not warnings/errors.
7. If runtime_context.packet_required is true, doctor may check only structural
   packet/ref readiness that is safe to determine mechanically.
```

Validator rule:

```text
No packet inference by tier alone.
If runtime_context is absent, lint/doctor must stay quiet.
If packet_required is true and packet_ref is absent or malformed, report it.
```

### 11.3 Wave 2 - `/mb-packet` command

Touch points:

```text
skills/_shared/references/commands/mb-packet.md
skills/_shared/references/protocols/packet-template.json
skills/_shared/scripts/init-mb.js
.github/workflows/release-check.yml
README.en.md
README.ru.md
howItWorks.md
```

Changes:

```text
1. Add /mb-packet command spec.
2. Add minimal packet template.
3. Confirm init-mb.js discovers the new command template and creates generated
   .memory-bank/commands/mb-packet.md plus .claude/.agents proxy skills.
4. Update release smoke checks if the command list is asserted.
5. Document the command in README/howItWorks.
```

Command behavior:

```text
/mb-packet TASK-XXX:
- reads .memory-bank/tasks/index.json;
- reads the indexed task record;
- reads linked feature/REQ and richer task fields;
- reads spec-backbone/spec-index only when needed by tier or linked specs;
- resolves SDD spec links from source_artifacts, normative_inputs, constraints,
  invariants, and verification_targets;
- writes .memory-bank/packets/TASK-XXX.packet.json;
- returns ready, ready_with_gaps, blocked, or stale;
- reports missing inputs without inventing them.
```

Non-goals:

```text
- no code changes;
- no task closure;
- no spec edits;
- no module graph;
- no Failure Packet.
```

### 11.4 Wave 3 - Manual workflow integration

Touch points:

```text
skills/_shared/references/commands/prd-to-tasks.md
skills/_shared/references/commands/execute.md
skills/_shared/references/commands/verify.md
skills/_shared/references/commands/red-verify.md
skills/_shared/references/commands/mb-sync.md
skills/_shared/references/workflows/tier-policy.md
```

Changes:

```text
1. /prd-to-tasks may fill purpose/success_outcome/anti_goals only from evidence.
2. /prd-to-tasks may add runtime_context.
3. T2/T3 SHOULD use packet.
4. T2/T3 MUST set packet_required only when:
   - cross-module contract/state/data/security/runtime behavior is involved;
   - task has linked SDD specs;
   - success_outcome cannot be verified from task record alone;
   - allowed_write_scope matters.
5. /execute checks packet only when runtime_context.packet_required is true.
6. /execute blocks on missing/stale/blocked required packet.
7. /execute prints Goal Interpretation and records scope compliance.
8. /verify checks purpose, success_outcome, anti_goals, and required packet
   verification items when present.
9. /red-verify adds false-success and autonomy/scope drift questions.
10. /mb-sync only reconciles already-written packet refs/evidence; it does not
    decide closure.
```

Manual task path after this wave:

```text
/execute TASK-XXX
  -> if packet_required: require valid packet first
  -> implementation handoff
/verify TASK-XXX
/red-verify TASK-XXX for T2/T3 when required by tier
/mb-sync when durable docs/task state changed
```

### 11.5 Wave 4 - Scheduler integration

Touch points:

```text
skills/_shared/references/commands/autopilot.md
skills/_shared/references/commands/autonomous.md
skills/_shared/references/workflows/execute-loop.md
skills/_shared/scripts/init-mb.js
```

Changes:

```text
1. In scheduler task loop, before /execute:
   - reread task record;
   - if runtime_context.packet_required is true, ensure packet_ref exists and
     packet status is usable;
   - if missing/stale/blocked, run or route to /mb-packet before /execute.
2. Fresh-session command examples should mention packet_ref when required.
3. Scheduler must not infer packet_required only from tier.
4. Scheduler status ownership remains unchanged.
```

Scheduler task path after this wave:

```text
ready -> in_progress
if packet_required: /mb-packet or packet freshness check
/execute
/verify
/red-verify if required by tier
scheduler writes final decision/status/evidence to task record
/mb-sync
mb-lint + mb-doctor --strict
promotion/dependent blocking pass
```

### 11.6 Wave 5 - Documentation and release checks

Touch points:

```text
README.en.md
README.ru.md
howItWorks.md
PROJECT_MAP.md if command hotspots need updating
.github/workflows/release-check.yml
```

Changes:

```text
1. Document Task Runtime Context as optional KISS extension.
2. Document SHOULD/MUST packet policy for T2/T3.
3. Add /mb-packet to command reference tables.
4. Update smoke tests if they assert generated command/proxy presence.
5. Keep source-only packaging rules unchanged.
```

### 11.7 Validation gates

Run after implementation:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
tmpdir="$(mktemp -d)"; node scripts/install-framework.mjs --bootstrap --target "$tmpdir" --yes
```

In the bootstrap target:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs
```

Expected:

```text
source-only shared-* count is 0
fresh skeleton passes default mb-lint/mb-doctor
existing tasks without runtime_context remain valid
T0/T1 tasks do not require /mb-packet
packet_required tasks fail readiness only when packet_ref/packet file is
mechanically missing or invalid
```

### 11.8 Main risks

```text
1. Over-enforcing packets in mb-doctor.
   Mitigation: only enforce packet when runtime_context.packet_required is true.

2. Packet becoming a second source of truth.
   Mitigation: every command states packet is derivative and loses conflicts.

3. Scheduler bypassing packet_required.
   Mitigation: update autopilot/autonomous task loop before /execute.

4. Scope checks becoming fake safety.
   Mitigation: scope compliance is evidence/preflight in MVP; stronger diff
   validation is a later phase.

5. T2/T3 packet bureaucracy.
   Mitigation: SHOULD use packet, MUST require packet only under listed
   cross-module/spec/verification/scope conditions.
```
