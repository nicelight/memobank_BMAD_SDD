# Schema-backed task records implementation plan

## Goal

Move Memory Bank task planning from markdown task cards as source of truth to schema-backed JSON task records.

New source of truth:

- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-001.task.json`
- `.memory-bank/schemas/task.schema.json`

`.memory-bank/tasks/backlog.md` remains only a human-readable summary/router. It must not store authoritative task state for scheduler, execute, verify, or autonomous flows.

## Files expected to change

Primary implementation:

- `skills/_shared/scripts/init-mb.js`
- `skills/mb-garden/assets/mb-lint.mjs`
- `.github/workflows/release-check.yml`

Command specs:

- `skills/_shared/references/commands/prd-to-tasks.md`
- `skills/_shared/references/commands/autopilot.md`
- `skills/_shared/references/commands/autonomous.md`
- `skills/_shared/references/commands/execute.md`
- `skills/_shared/references/commands/verify.md`
- `skills/_shared/references/commands/mb-sync.md`

Likely docs / skill entrypoints:

- `README.en.md`
- `README.ru.md`
- `skills/mb-init/SKILL.md`
- `skills/mb-execute/SKILL.md`
- `skills/mb-verify/SKILL.md`
- `skills/mb-from-prd/SKILL.md`
- `skills/cold-start/SKILL.md`
- `skills/mb-red-verify/SKILL.md`
- possibly `skills/mb-map-codebase/SKILL.md` if wording says task state lives in `backlog.md`

Do not edit or commit generated `skills/*/{agents,references,scripts}/shared-*` files. This fork is source-only.

## Task schema shape

Minimum generated task record:

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
  "risk": {
    "level": "low",
    "reasons": [],
    "red_verify_required": false
  },
  "gates": [
    {
      "name": "unit tests",
      "command": "npm test",
      "required": true
    }
  ],
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

Required enums:

- `status`: `planned | ready | in_progress | blocked | done | failed`
- `risk.level`: `low | medium | high`

Task index shape:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "TASK-001",
      "file": "TASK-001.task.json"
    }
  ]
}
```

The index links to task records only. It must not duplicate full task content.

## Backlog.md migration rule

Remove scheduler dependence on markdown task cards:

- `/prd-to-tasks` creates `.task.json` files and updates `index.json`.
- `/autopilot` and `/autonomous` read `index.json` and task records.
- `/execute` must stop if the requested task record is missing.
- `/verify` updates verdict/evidence/status in the task record.
- `/mb-sync` uses JSON task records for RTM/backlog/changelog synchronization.
- `backlog.md` may list waves, task IDs, titles, status summaries, and links, but is not authoritative.

## Lint / CI checks

`mb-lint` should add lightweight structural validation without external validator dependencies:

- `.memory-bank/tasks/index.json` exists and parses as JSON.
- `.memory-bank/schemas/task.schema.json` exists and parses as JSON.
- all indexed task files exist.
- all indexed task files parse as JSON.
- task records have required fields.
- task `id` matches index entry and filename convention.
- `status` is in the allowed enum.
- `risk.level` is in the allowed enum.
- every `depends_on` ID exists.
- dependency graph has no cycles.
- `done` tasks include at least one verification/evidence marker.
- high-risk tasks require `risk.red_verify_required: true`.
- markdown task cards are not accepted as task records in `backlog.md`.

CI smoke should assert generated skeleton includes:

- `.memory-bank/schemas/task.schema.json`
- `.memory-bank/tasks/index.json`
- working `mb-lint`
- install smoke through the wrapper still passes

## Source-only packaging constraint

`Optimisation.md` asks to run `node scripts/vendor-shared.mjs`, but this repository intentionally keeps generated shared files out of the source tree.

Implementation must preserve:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

Expected result: `0`.

Use `node scripts/install-framework.mjs --skill '*' --yes` or CI-style temporary install smoke for vendoring verification without committing generated shared files.

## Out of scope

- No new external npm dependencies.
- No new large commands such as `mb-doctor`.
- No marketplace skill installation.
- No deploy or publish.
- No license changes.
- No broad rewrite of README content beyond task model updates.
- No conversion tooling for existing real-world markdown task cards unless needed for skeleton/lint compatibility.

## Risks

- Command specs can drift if one still refers to task cards as source of truth.
- Existing old Memory Banks may fail stricter lint unless the new requirement is intentionally scoped to current generated skeletons.
- `done` evidence validation needs a pragmatic marker definition to avoid false failures.
- The source-only vendoring model conflicts with a literal reading of the vendoring phase in `Optimisation.md`; preserve source-only hygiene.
- `backlog.md` should still be useful to humans without becoming a second state store.

## Sequential execution strategy

1. Update skeleton and schema generation.
2. Update command specs to make JSON task records authoritative.
3. Extend `mb-lint` and CI smoke.
4. Update README and relevant `SKILL.md` wording.
5. Run syntax checks, source-only hygiene checks, dry bootstrap, lint smoke, and install smoke.
