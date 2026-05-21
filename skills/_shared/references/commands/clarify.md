---
description: Feature-level clarification gate before task decomposition.
status: active
---
# /clarify — Feature ambiguity gate

<objective>
Close critical ambiguity for exactly one feature before `/prd-to-tasks` creates implementation plans or JSON task records.

Clarification is feature-level ambiguity closure. It is not PRD-level Deep Questioning, task generation, tier assignment, or implementation planning.
</objective>

<process>

## 0) Input
Expected `$ARGUMENTS`:
- `FT-<NNN>` for one target feature.

The feature ID is required.

If no feature ID is provided:
- interactive mode: ask the user to provide `FT-<NNN>`.
- autonomous mode: halt with `HALT_CLARIFICATION_TARGET_REQUIRED`.

Do not auto-select a feature.

## 1) Locate target feature
Find exactly one matching file:
- `.memory-bank/features/FT-<NNN>-*.md`

If no feature file matches, stop and report the missing target. Do not create protocol files for an unknown feature.

The feature frontmatter must contain:

```yaml
clarification_status: pending|complete
last_clarified: null|YYYY-MM-DD
clarification_questions: 0
```

Missing clarification metadata is an error. Do not use backward compatibility fallback.

## 2) Read minimal context
Read only the context needed for this feature:
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-<NNN>-*.md`

Read epics, glossary, invariants, contracts, states, testing docs, runbooks, or other docs only when:
- the feature links to them, or
- they are clearly needed to decide whether an ambiguity is blocking.

## 3) Artifact
Create or update only:
- `.protocols/FT-<NNN>/clarification.md`

Do not create:
- task records
- implementation plans
- `.protocols/FT-<NNN>/decision-log.md`
- `.protocols/FT-<NNN>/clarification-report.md`
- command aliases
- external spec directories

`clarification.md` must stay compact and include:
- status
- summary
- passes
- context used
- questions and accepted answers
- remaining blockers

Minimal structure:

```md
# Clarification — FT-<NNN>

## Status
pending|complete

## Summary
- Current outcome: ...
- Questions accepted total: N
- Last clarified: YYYY-MM-DD

## Passes

### Pass 1 — YYYY-MM-DD
Questions accepted: N / 5

#### Context used
- .memory-bank/product.md
- .memory-bank/requirements.md
- .memory-bank/features/FT-<NNN>-*.md

#### Questions
1. Q: ...
   A: ...
   Applied to: <feature section>

#### Remaining blockers
- <short blocker>
```

If no blockers remain:

```md
#### Remaining blockers
- None
```

## 4) Pass-based interview
Each `/clarify FT-<NNN>` run is one clarification pass.

Rules per pass:
- ask exactly one question at a time
- accept at most 5 answers
- do not reveal queued future questions
- no hard total question limit across passes
- after each accepted answer, update the feature doc
- after each accepted answer, update `.protocols/FT-<NNN>/clarification.md`
- after each accepted answer, increment cumulative `clarification_questions`
- after each accepted answer, recalculate remaining critical ambiguity

Accepted replies:
- option letter from a multiple-choice question
- `recommended`
- `suggested`
- a short custom answer when allowed
- `done`
- `stop`
- `proceed`

`done`, `stop`, and `proceed` end the current pass. They do not imply `clarification_status: complete` if blockers remain.

If 5 accepted answers are reached in the current pass and blockers remain:
- keep `clarification_status: pending`
- record blockers in `.protocols/FT-<NNN>/clarification.md`
- tell the user to continue with `/clarify FT-<NNN>`

## 5) Question priority
Ask only questions whose answers can change:
- acceptance criteria
- task decomposition
- verification targets or evidence
- UX behavior
- data/domain behavior
- API/contracts
- security/compliance
- operations
- future tier assignment by `/prd-to-tasks`

Priority order:
1. Blocking product decisions
2. Verification-shaping decisions
3. Scope-boundary decisions
4. Risk-shaping decisions
5. Nice-to-have clarity

Do not ask nice-to-have questions. Record them as assumptions or follow-up notes only when useful.

Internal ambiguity scan:
- scope / behavior
- actors / UX flow
- data / domain rules
- integrations / constraints
- edge cases / failure modes
- verification / completion signals

## 6) Question format
Ask one question at a time.

Multiple choice:

```md
**Recommended:** Option B — <brief rationale>

| Option | Description |
|---|---|
| A | ... |
| B | ... |
| C | ... |
| Short | Custom short answer, max 5 words |

Reply with A/B/C, "recommended", or a short answer.
```

Short answer only when options are a bad fit:

```md
**Suggested:** <answer> — <brief rationale>

Format: short answer, max 5 words.
Reply "suggested" to accept.
```

## 7) Apply accepted answers
After every accepted answer:
1. Add or append to the feature doc:

```md
## Clarifications

### Session YYYY-MM-DD
- Q: ... -> A: ...
```

2. Apply the answer to the relevant feature section:
- behavior -> use cases / acceptance criteria / requirements
- actors -> user stories / use cases
- data -> entities / fields / lifecycle
- NFR -> measurable verification target
- edge case -> failure modes
- terminology -> glossary / normalized wording
- dependency -> constraints / integration notes
- completion -> verification targets

3. Remove contradictory old wording.
4. Keep edits short, testable, and actionable.
5. Update `.protocols/FT-<NNN>/clarification.md`.
6. Update frontmatter:

```yaml
last_clarified: YYYY-MM-DD
clarification_questions: <cumulative accepted answer count>
```

## 8) Completion criteria
Allowed values:
- `clarification_status: pending`
- `clarification_status: complete`

Set `clarification_status: complete` only when no critical ambiguity remains and `/prd-to-tasks FT-<NNN>` can safely produce JSON task records with:
- clear acceptance criteria
- clear verification targets
- known constraints
- known actors and behavior
- no unresolved product decision that affects task decomposition
- no unresolved data / API / security / UX / operations ambiguity
- enough context to assign future task tier if the tier model exists

If any critical blocker remains, keep:

```yaml
clarification_status: pending
```

</process>
