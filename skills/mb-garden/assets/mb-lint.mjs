#!/usr/bin/env node
/**
 * mb-lint.mjs
 *
 * Deterministic lint for `.memory-bank/`.
 * Intentionally mechanical: structure + frontmatter + broken links.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MB = path.join(ROOT, '.memory-bank');

if (!fs.existsSync(MB)) {
  console.error('❌ .memory-bank/ not found. Run mb-init first.');
  process.exit(1);
}

const REQUIRED = [
  '.memory-bank/index.md',
  '.memory-bank/mbb/index.md',
  '.memory-bank/changelog.md',
  '.memory-bank/workflows/mb-sync.md',
  '.memory-bank/testing/index.md',
  '.memory-bank/schemas/task.schema.json',
  '.memory-bank/tasks/index.json',
  '.memory-bank/tasks/backlog.md',
  '.memory-bank/skills/index.md',
];

const ALLOWED_STATUS = new Set(['draft', 'active', 'deprecated', 'archived']);
const ALLOWED_LIFECYCLE = new Set(['planned', 'implemented', 'verified']);
const ALLOWED_TASK_STATUS = new Set(['planned', 'ready', 'in_progress', 'blocked', 'done', 'failed']);
const ALLOWED_TASK_RISK = new Set(['low', 'medium', 'high']);
const TASK_ID_RE = /^TASK-[0-9]{3,}$/;
const TASK_FILE_RE = /^TASK-[0-9]{3,}\.task\.json$/;
const INDEX_TOP_LEVEL_KEYS = new Set(['version', 'tasks']);
const INDEX_TASK_ENTRY_KEYS = new Set(['id', 'file']);
const REQUIRED_TASK_FIELDS = [
  'id',
  'title',
  'status',
  'wave',
  'feature',
  'reqs',
  'depends_on',
  'touched_files',
  'risk',
  'gates',
  'verify',
  'docs',
  'evidence_required',
  'source_artifacts',
  'normative_inputs',
  'constraints',
  'invariants',
  'verification_targets',
];

const errors = [];
const warnings = [];

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function readJson(rel) {
  const p = path.join(ROOT, rel);
  try {
    return JSON.parse(readText(p));
  } catch (err) {
    errors.push(`${rel}: invalid JSON (${err.message})`);
    return undefined;
  }
}

function listMarkdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function hasFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  return normalized.startsWith('---\n') && normalized.includes('\n---\n');
}

function parseFrontmatter(text) {
  // Minimal YAML-ish parser for frontmatter block:
  // - key: value
  // - key: (then indented block, e.g. lists)
  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const block = normalized.slice(4, end).trimEnd();
  const lines = block.split('\n');
  const kv = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }

    const key = m[1];
    const rest = (m[2] ?? '').trimEnd();

    if (rest === '') {
      const collected = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        if (/^[A-Za-z0-9_\-]+:\s*/.test(next)) break;
        collected.push(next);
        i += 1;
      }
      kv[key] = collected.join('\n').trim();
      continue;
    }

    kv[key] = rest.trim();
    i += 1;
  }

  return kv;
}

function normalizeRel(p) {
  return p.replace(/\\/g, '/');
}

function isIndexDoc(rel) {
  const n = normalizeRel(rel);
  return n.endsWith('/index.md') || n === '.memory-bank/index.md';
}

function isLifecycleScopedDoc(rel) {
  const n = normalizeRel(rel);
  if (isIndexDoc(n)) return false;
  return (
    n.startsWith('.memory-bank/epics/') ||
    n.startsWith('.memory-bank/features/') ||
    n.startsWith('.memory-bank/requirements/')
  );
}

function isMetadataScopedDoc(rel) {
  const n = normalizeRel(rel);
  if (isIndexDoc(n)) return false;
  return (
    n === '.memory-bank/product.md' ||
    n === '.memory-bank/requirements.md' ||
    n === '.memory-bank/spec-index.md' ||
    n === '.memory-bank/glossary.md' ||
    n === '.memory-bank/invariants.md' ||
    n.startsWith('.memory-bank/architecture/') ||
    n.startsWith('.memory-bank/guides/') ||
    n.startsWith('.memory-bank/adrs/') ||
    n.startsWith('.memory-bank/tech-specs/') ||
    n.startsWith('.memory-bank/domains/') ||
    n.startsWith('.memory-bank/contracts/') ||
    n.startsWith('.memory-bank/states/') ||
    n.startsWith('.memory-bank/runbooks/') ||
    n.startsWith('.memory-bank/epics/') ||
    n.startsWith('.memory-bank/features/') ||
    n.startsWith('.memory-bank/requirements/') ||
    n.startsWith('.memory-bank/bugs/')
  );
}

function stripYamlQuotes(value) {
  const v = String(value ?? '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function hasSourceOfTruth(fm) {
  if (!fm) return false;
  if (!Object.prototype.hasOwnProperty.call(fm, 'source_of_truth')) return false;
  const raw = String(fm.source_of_truth ?? '').trim();
  if (!raw || raw === '[]') return false;
  if (raw.includes('\n') || raw.startsWith('-')) {
    return /^\s*-\s+\S+/m.test(raw);
  }
  return true;
}

function checkRequiredFiles() {
  for (const rel of REQUIRED) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`Missing required file: ${rel}`);
  }
}

function checkFrontmatter(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  if (!hasFrontmatter(text)) {
    errors.push(`${rel}: missing YAML frontmatter`);
    return;
  }
  const fm = parseFrontmatter(text);
  if (!fm || !fm.description) {
    errors.push(`${rel}: frontmatter must include 'description'`);
  }
  if (!fm || !fm.status) {
    errors.push(`${rel}: frontmatter must include 'status'`);
  } else {
    const status = stripYamlQuotes(fm.status);
    if (!ALLOWED_STATUS.has(status)) {
      errors.push(`${rel}: invalid status '${status}' (allowed: draft|active|deprecated|archived)`);
    }

    if (isMetadataScopedDoc(rel) && status === 'active') {
      if (!fm.owner || !String(fm.owner).trim()) warnings.push(`${rel}: missing 'owner' (recommended for active docs)`);
      if (!fm.last_updated || !String(fm.last_updated).trim()) {
        warnings.push(`${rel}: missing 'last_updated' (recommended for active docs, YYYY-MM-DD)`);
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(stripYamlQuotes(fm.last_updated))) {
        warnings.push(`${rel}: invalid 'last_updated' format (expected YYYY-MM-DD)`);
      }
      if (!hasSourceOfTruth(fm)) warnings.push(`${rel}: missing 'source_of_truth' (recommended for active docs)`);
    }
  }

  if (isLifecycleScopedDoc(rel)) {
    if (!fm || !fm.lifecycle) {
      warnings.push(`${rel}: missing 'lifecycle' (planned|implemented|verified)`);
    } else {
      const lifecycle = stripYamlQuotes(fm.lifecycle);
      if (!ALLOWED_LIFECYCLE.has(lifecycle)) {
        errors.push(
          `${rel}: invalid lifecycle '${lifecycle}' (allowed: planned|implemented|verified)`
        );
      }
    }
  }
}

function extractLinks(text) {
  // markdown links: [text](path)
  // Ignore anything inside code fences and inline code to avoid flagging examples/templates.
  const stripped = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  const links = [];
  const re = /\[[^\]]+\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function checkLinks(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  const dir = path.dirname(filePath);
  for (const link of extractLinks(text)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    if (link.startsWith('/')) continue;
    const target = path.normalize(path.join(dir, link));
    if (!target.startsWith(ROOT)) continue;
    if (!fs.existsSync(target)) {
      errors.push(`${rel}: broken link -> ${link}`);
    }
  }
}

function checkIndexRouters() {
  // For each folder inside .memory-bank with >3 md files, require index.md.
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const mdFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);

    const hasIndex = mdFiles.includes('index.md');
    const mdCount = mdFiles.length;

    const relDir = normalizeRel(path.relative(ROOT, dir));
    if (mdCount > 3 && !hasIndex) {
      warnings.push(`${relDir}: has ${mdCount} md files but no index.md router`);
    }

    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
    }
  }

  walk(MB);
}

function checkFileSize(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  const lines = text.split(/\r?\n/).length;
  if (lines > 2000) {
    warnings.push(`${rel}: very large file (${lines} lines). Consider splitting.`);
  }
}

function checkBacklogDoesNotContainTaskCards() {
  const rel = '.memory-bank/tasks/backlog.md';
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return;

  const text = readText(p).replace(/\r\n/g, '\n');
  const cardHeading = /^#{2,6}\s+TASK-[A-Za-z0-9_-]+(?:\s|$)/m;
  const taskIdField = /^(?:[-*]\s*)?TASK-ID:\s*TASK-[A-Za-z0-9_-]+\s*$/m;
  const taskStateField = /^[-*]\s*(Status|Wave|Feature|REQs?|Depends on|Touched files|Tests|Verify|Docs):\s+\S+/m;

  if (cardHeading.test(text) || taskIdField.test(text) || taskStateField.test(text)) {
    errors.push(
      `${rel}: markdown task cards are not valid task records; use tasks/index.json and indexed *.task.json files`
    );
  }
}

function hasDoneEvidenceMarker(task) {
  const fields = ['verify', 'evidence_required', 'verification_targets'];
  return fields.some((field) => Array.isArray(task[field]) && task[field].length > 0);
}

function checkArrayField(rel, task, field) {
  if (!Array.isArray(task[field])) {
    errors.push(`${rel}: '${field}' must be an array`);
  }
}

function checkExactKeys(rel, object, allowedKeys, label) {
  const keys = Object.keys(object);
  const extraKeys = keys.filter((key) => !allowedKeys.has(key));
  if (extraKeys.length) {
    errors.push(`${rel}: ${label} must not contain extra keys: ${extraKeys.join(', ')}`);
  }
}

function checkTaskRecords() {
  const schemaRel = '.memory-bank/schemas/task.schema.json';
  const indexRel = '.memory-bank/tasks/index.json';

  if (!fs.existsSync(path.join(ROOT, schemaRel))) {
    errors.push(`Missing required file: ${schemaRel}`);
  } else {
    readJson(schemaRel);
  }

  if (!fs.existsSync(path.join(ROOT, indexRel))) {
    errors.push(`Missing required file: ${indexRel}`);
    return;
  }

  const index = readJson(indexRel);
  if (index === undefined) return;

  if (!index || typeof index !== 'object' || Array.isArray(index)) {
    errors.push(`${indexRel}: index must be a JSON object`);
    return;
  }
  checkExactKeys(indexRel, index, INDEX_TOP_LEVEL_KEYS, 'top-level object');
  if (index.version !== 1) {
    errors.push(`${indexRel}: 'version' must be 1`);
  }
  if (!Array.isArray(index.tasks)) {
    errors.push(`${indexRel}: 'tasks' must be an array`);
    return;
  }

  const records = new Map();
  const dependencies = new Map();

  for (const entry of index.tasks) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${indexRel}: each task index entry must be an object`);
      continue;
    }
    checkExactKeys(indexRel, entry, INDEX_TASK_ENTRY_KEYS, `task index entry '${entry.id ?? '<missing-id>'}'`);

    const id = entry.id;
    const file = entry.file;
    if (typeof id !== 'string' || !id.trim()) {
      errors.push(`${indexRel}: each task index entry needs a non-empty 'id'`);
      continue;
    }
    if (!TASK_ID_RE.test(id)) {
      errors.push(`${indexRel}: task id '${id}' must match TASK-[0-9]{3,}`);
      continue;
    }
    if (records.has(id)) {
      errors.push(`${indexRel}: duplicate task id '${id}'`);
      continue;
    }
    if (typeof file !== 'string' || !file.trim()) {
      errors.push(`${indexRel}: task '${id}' needs a non-empty 'file'`);
      continue;
    }
    if (path.isAbsolute(file) || file.includes('..') || !file.endsWith('.task.json')) {
      errors.push(`${indexRel}: task '${id}' has invalid file '${file}'`);
      continue;
    }
    if (!TASK_FILE_RE.test(file)) {
      errors.push(`${indexRel}: task '${id}' file '${file}' must match TASK-[0-9]{3,}.task.json`);
      continue;
    }
    if (file !== `${id}.task.json`) {
      errors.push(`${indexRel}: task '${id}' file must be '${id}.task.json'`);
      continue;
    }

    const rel = normalizeRel(path.join('.memory-bank/tasks', file));
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      errors.push(`${indexRel}: indexed task '${id}' file missing: ${rel}`);
      continue;
    }

    const task = readJson(rel);
    if (task === undefined) continue;
    records.set(id, { rel, task });
  }

  for (const [id, { rel, task }] of records) {
    if (!task || typeof task !== 'object' || Array.isArray(task)) {
      errors.push(`${rel}: task record must be a JSON object`);
      continue;
    }

    for (const field of REQUIRED_TASK_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(task, field)) {
        errors.push(`${rel}: missing required field '${field}'`);
      }
    }

    if (task.id !== id) {
      errors.push(`${rel}: task id '${task.id}' does not match index id '${id}'`);
    }
    if (typeof task.id !== 'string' || !TASK_ID_RE.test(task.id)) {
      errors.push(`${rel}: task id '${task.id}' must match TASK-[0-9]{3,}`);
    }
    if (!ALLOWED_TASK_STATUS.has(task.status)) {
      errors.push(
        `${rel}: invalid task status '${task.status}' (allowed: planned|ready|in_progress|blocked|done|failed)`
      );
    }

    for (const field of [
      'reqs',
      'depends_on',
      'touched_files',
      'gates',
      'verify',
      'docs',
      'evidence_required',
      'source_artifacts',
      'normative_inputs',
      'constraints',
      'invariants',
      'verification_targets',
    ]) {
      checkArrayField(rel, task, field);
    }

    if (!task.risk || typeof task.risk !== 'object' || Array.isArray(task.risk)) {
      errors.push(`${rel}: 'risk' must be an object`);
    } else {
      if (!ALLOWED_TASK_RISK.has(task.risk.level)) {
        errors.push(`${rel}: invalid risk.level '${task.risk.level}' (allowed: low|medium|high)`);
      }
      if (!Array.isArray(task.risk.reasons)) {
        errors.push(`${rel}: 'risk.reasons' must be an array`);
      }
      if (typeof task.risk.red_verify_required !== 'boolean') {
        errors.push(`${rel}: 'risk.red_verify_required' must be a boolean`);
      }
      if (task.risk.level === 'high' && task.risk.red_verify_required !== true) {
        errors.push(`${rel}: high risk tasks must set risk.red_verify_required to true`);
      }
    }

    if (task.status === 'done' && !hasDoneEvidenceMarker(task)) {
      errors.push(`${rel}: done task must include at least one verification/evidence marker`);
    }

    dependencies.set(id, Array.isArray(task.depends_on) ? task.depends_on : []);
  }

  for (const [id, deps] of dependencies) {
    const rel = records.get(id)?.rel ?? indexRel;
    for (const dep of deps) {
      if (typeof dep !== 'string' || !TASK_ID_RE.test(dep)) {
        errors.push(`${rel}: depends_on value '${dep}' must match TASK-[0-9]{3,}`);
        continue;
      }
      if (!records.has(dep)) {
        errors.push(`${rel}: depends_on references unknown task '${dep}'`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(id, stack) {
    if (visiting.has(id)) {
      errors.push(`.memory-bank/tasks/index.json: dependency cycle detected: ${[...stack, id].join(' -> ')}`);
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    for (const dep of dependencies.get(id) ?? []) {
      if (records.has(dep)) visit(dep, [...stack, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of records.keys()) visit(id, []);
}

checkRequiredFiles();

const files = listMarkdownFiles(MB);
for (const f of files) {
  const text = readText(f);
  checkFrontmatter(f, text);
  checkLinks(f, text);
  checkFileSize(f, text);
}

checkIndexRouters();
checkBacklogDoesNotContainTaskCards();
checkTaskRecords();

if (warnings.length) {
  console.log('⚠️  WARNINGS');
  for (const w of warnings) console.log(`- ${w}`);
  console.log('');
}

if (errors.length) {
  console.error('❌ ERRORS');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(`✅ mb-lint passed (${files.length} files).`);
