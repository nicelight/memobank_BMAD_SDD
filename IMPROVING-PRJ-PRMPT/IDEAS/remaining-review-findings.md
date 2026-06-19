# Remaining Review Findings Handoff

Context: after removing committed dogfood `.memory-bank/` and fixing the
actionable workflow/deploy consistency findings, two non-blocking review notes
remain for a separate analysis pass.

These are not confirmed blockers. Analyze whether they are real project debt
before implementing anything.

## 1. Fresh Skeleton `mb-lint` Warnings

Finding:

- A fresh bootstrap skeleton passes `mb-lint` and `mb-doctor`, but `mb-lint`
  reports warnings about missing optional frontmatter in `spec-index.md` and
  missing `.memory-bank/workflows/index.md`.

Why it may matter:

- Warnings may be acceptable for a minimal skeleton.
- Or they may teach agents that a freshly generated Memory Bank starts with
  avoidable hygiene noise.

Analysis questions:

- Are these warnings intentional for a minimal generated skeleton?
- If not, should `init-mb.js` generate the missing optional metadata/index?
- Would fixing this add useful clarity or just more skeleton bureaucracy?

Suggested KISS direction if real:

- Prefer making the generated skeleton warning-free only if it requires a tiny
  template addition.
- Do not broaden `mb-lint` rules or add new lifecycle semantics.

## 2. Drift Risk: `structure-template.md` vs `init-mb.js`

Finding:

- `skills/_shared/references/structure-template.md` and inline generated
  skeleton text in `skills/_shared/scripts/init-mb.js` partially duplicate
  workflow and structure guidance.

Why it may matter:

- Recent workflow changes repeatedly required touching both shared references
  and inline generator strings.
- This can create future drift in deployed `AGENTS.md`, generated Memory Bank
  docs, and source reference docs.

Analysis questions:

- Which duplicated sections are actually risky and frequently edited?
- Can any repeated text be removed, shortened, or generated from one canonical
  source without making bootstrap more complex?
- Is the better KISS fix simply to keep generated docs shorter and point to
  canonical command/workflow files?

Suggested KISS direction if real:

- Avoid a large templating system.
- Prefer deleting or shortening duplicate explanatory text in generated
  skeleton docs, keeping canonical detail in `skills/_shared/references/*`.
