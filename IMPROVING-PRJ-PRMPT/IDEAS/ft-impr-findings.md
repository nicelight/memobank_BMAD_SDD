# Findings: feature decomposition workflow review

Context: review after optimizing `/execute` and merging
`/spec-improve` + `/prd-to-tasks` + `/mb-packet` according to
`IMPROVING-PRJ-PRMPT/IDEAS/feature-decomposition-improve.md`.

This file records only unresolved review findings after the quick-fix pass.

## High

### 1. Stale ignored dogfood command docs describe the old flow

Ignored local `.memory-bank/commands` copies still describe the old separate
`/spec-improve` before `/prd-to-tasks` flow and older packet handoff.

Known stale files:

- `.memory-bank/commands/prd-to-tasks.md`
- `.memory-bank/commands/spec-improve.md`
- `.memory-bank/commands/mb-packet.md`

Impact: not a deployment blocker because these files are ignored and not part
of the allowlisted dogfood baseline, but local dogfood agents can still read
them and get outdated instructions.

## Low

### 2. Reviewer role contract is still TODO

`worker.md` allows delegated `Reviewer`, but the detailed Reviewer contract and
severity model are still TODO.

Impact: delegated reviews work, but output can be inconsistent and more
token-heavy than necessary.

Reference:

- `skills/_shared/references/roles/worker.md`

### 3. Idea note allowlist statement is stale

`feature-decomposition-improve.md` says only `.memory-bank/commands/execute.md`
is allowlisted, but `.gitignore` allowlists more command/workflow baseline
files.

Impact: stale planning note only; no runtime impact.

References:

- `IMPROVING-PRJ-PRMPT/IDEAS/feature-decomposition-improve.md`
- `.gitignore`
