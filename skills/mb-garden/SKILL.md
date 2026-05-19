---
name: mb-garden
description: >
  Lint, clean up, and refactor a Memory Bank so it stays accurate and easy to load.
---

# mb-garden — Memory Bank maintenance (doc gardening)

- **What it does:** checks Memory Bank structure, fixes hygiene issues, and keeps docs navigable.
- **Use it when:** `.memory-bank/` exists and you want to reduce drift, stale docs, or broken routing.
- **Input:** an existing `.memory-bank/`.
- **Output:** a cleaner Memory Bank, resolved lint issues, and optional CI support for ongoing maintenance.

## Goal
Keep `.memory-bank/` accurate, navigable, and cheap-to-prime.

## Preconditions
- `.memory-bank/` exists.

## Process

### 1) Run a mechanical lint (deterministic)
If the repo doesn’t have a linter yet:
1) Create `scripts/mb-lint.mjs` using `assets/mb-lint.mjs`.
2) Make it executable (optional).
3) Add a package script (optional): `"mb:lint": "node scripts/mb-lint.mjs"`.

Then run:
```bash
node scripts/mb-lint.mjs
```

Fix all **ERROR** findings:
- missing YAML frontmatter (description + status)
- broken links
- missing folder index.md
- invalid or missing schema-backed task records
- markdown task cards used as task state in `backlog.md`

### 2) Refactor for ergonomics
- Split docs > ~700 lines into atomic docs + router index.
- Ensure key concepts are covered either by classic duo docs (`architecture` WHAT/WHY + `guides` HOW) or by equivalent spec-driven support docs.
- Replace copy-pasted code/config with links to source.

### 3) Archive stale or superseded docs
- Move outdated docs to `.memory-bank/archive/`.
- Leave a short tombstone stub in the original location with a link to the archive.

### 4) Optional: add CI gate
If the repo uses GitHub Actions:
- Create `.github/workflows/memory-bank-lint.yml` from `assets/memory-bank-lint.yml`.

### 5) Produce a short report
Write a summary (what changed + what remains) to:
- `.tasks/TASK-MB-GARDEN/TASK-MB-GARDEN-S-01-final-report-docs-01.md`

### 6) Weekly maintenance checklist
Run this checklist weekly (or every 5–10 meaningful changes):

1. **Frontmatter audit**: every `.memory-bank/**/*.md` has `description` + `status`.
2. **Stale docs**: scan for docs not updated in >2 weeks — archive or refresh.
3. **Concept coverage check**: every key concept is covered either by a matching `architecture/<X>.md` + `guides/<X>.md` pair or by clearly routed equivalent spec-driven support docs.
4. **RTM sync**: `requirements.md` RTM matches actual feature/test status.
5. **Task record hygiene**: completed tasks marked done in `.task.json`, no orphaned tasks without feature link, `backlog.md` refreshed only as a summary/router.
6. **Changelog**: `.memory-bank/changelog.md` has entries for recent changes.
7. **Index links**: all links in `index.md` and router-indexes resolve correctly.
8. **Archive tombstones**: every doc in `archive/` has a tombstone stub at original location.

## Definition of done
- `node scripts/mb-lint.mjs` passes (0 errors).
- Index navigation is coherent.
- No obvious duplication or stale docs without archive.
- Weekly checklist items are addressed.
