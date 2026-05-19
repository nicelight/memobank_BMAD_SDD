# Project Handoff

## Status

The fork now uses a source-only repository model.

Generated package files named `shared-*` are not stored in git. They are generated only in a temporary prepared copy during installation or CI smoke tests.

## Correct Installation

Use the package wrapper:

```bash
npx github:<owner>/<repo> --skill '*' --global --yes
```

For a local clone:

```bash
node scripts/install-framework.mjs --skill '*' --global --yes
```

Do not install this fork with direct `npx skills add <repo>` unless the repository has already been prepared with `node scripts/vendor-shared.mjs`. Direct `skills add` copies the source tree as-is and does not run repository-specific generation.

## What Happens During Installation

1. `scripts/install-framework.mjs` creates a temporary copy of the repository.
2. It runs `scripts/vendor-shared.mjs` inside that temporary copy.
3. The missing package-local files are generated:
   - `agents/shared-*.md`
   - `references/shared-*.md`
   - `scripts/shared-*.js`
4. The wrapper runs `npx -y skills add <prepared-temp-repo> ...`.
5. The temporary copy is removed unless `MEMOBANK_KEEP_INSTALL_TMP=1` is set.
6. The working repository remains source-only.

## Files Changed For Source-Only Support

- `scripts/install-framework.mjs`: installation wrapper that prepares a temporary vendored package copy.
- `package.json`: exposes the wrapper as the package bin and adds basic scripts.
- `scripts/vendor-shared.mjs`: still the vendoring generator used by the wrapper and CI.
- `.github/workflows/release-check.yml`: validates source-only hygiene and installs through the wrapper.
- `README.md`, `README.en.md`, `README.ru.md`: document the correct installation path and install-time behavior.
- `skills/mb-garden/assets/mb-lint.mjs`: accepts CRLF frontmatter by normalizing line endings before parsing.

## Verification Already Run

```text
PASS node install-framework smoke
PASS npx package-bin install smoke
PASS source-only full smoke with installed mb-lint
PASS dry bootstrap sync smoke
PASS syntax/source-only check
```

Verified flow:

```text
source-only repo
  -> temporary vendored copy
  -> skills add
  -> mb-init
  -> generated Memory Bank
  -> mb-lint
```

## Operational Notes

- Read `PROJECT_MAP.md` before assigning independent agents to feature work.
- `skills/_shared/` is the source of truth for shared prompts, references, and scripts.
- `skills/*/shared-*` files are generated artifacts in this fork.
- CI should fail if generated `shared-*` files are committed outside `skills/_shared`.
- To debug installation, run with `MEMOBANK_KEEP_INSTALL_TMP=1` and inspect the prepared temporary repository printed by the wrapper.
