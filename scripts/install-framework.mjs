#!/usr/bin/env node

import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
memobank install-framework

Usage:
  node scripts/install-framework.mjs [skills add options]

Examples:
  node scripts/install-framework.mjs --skill '*' --yes
  node scripts/install-framework.mjs --skill cold-start --global --yes

The repository is source-only. This wrapper copies the repo to a temporary
directory, runs scripts/vendor-shared.mjs there, then calls:
  npx -y skills add <prepared-temp-repo> [options]
`.trim());
  process.exit(0);
}

if (!existsSync(join(repoRoot, 'scripts', 'vendor-shared.mjs'))) {
  console.error(`Missing vendor script in ${repoRoot}`);
  process.exit(1);
}

const addArgs = args.length ? args : ['--skill', '*', '--yes'];
const tempRoot = mkdtempSync(join(tmpdir(), 'memobank-skills-'));
const preparedRepo = join(tempRoot, 'repo');

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

try {
  cpSync(repoRoot, preparedRepo, {
    recursive: true,
    filter: (source) => {
      const rel = resolve(source).slice(repoRoot.length + 1);
      return ![
        '.git',
        'node_modules',
      ].some((ignored) => rel === ignored || rel.startsWith(`${ignored}/`));
    },
  });

  run(process.execPath, ['scripts/vendor-shared.mjs'], { cwd: preparedRepo });
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'skills', 'add', preparedRepo, ...addArgs]);
} finally {
  if (!process.env.MEMOBANK_KEEP_INSTALL_TMP) {
    rmSync(tempRoot, { recursive: true, force: true });
  } else {
    console.log(`Prepared repository kept at: ${preparedRepo}`);
  }
}
