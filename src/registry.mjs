import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const STORE_ROOT = join(homedir(), '.aae');

const COMPONENT_TYPES = ['skills', 'commands', 'agents', 'hooks', 'workflows'];

export function getRoot() {
  return PACKAGE_ROOT;
}

export function getStoreRoot() {
  return STORE_ROOT;
}

export function getComponentDir(type) {
  validateType(type);
  return join(PACKAGE_ROOT, type);
}

export function getStoreComponentDir(type) {
  validateType(type);
  return join(STORE_ROOT, type);
}

function validateType(type) {
  if (!COMPONENT_TYPES.includes(type)) {
    throw new Error(`Unknown component type: ${type}. Must be one of: ${COMPONENT_TYPES.join(', ')}`);
  }
}

export async function findComponentDir(type, name) {
  for (const base of [getStoreComponentDir(type), getComponentDir(type)]) {
    const dir = join(base, name);
    try {
      const s = await stat(dir);
      if (s.isDirectory()) return dir;
    } catch { /* not found */ }
  }
  return null;
}

export async function listComponents(type) {
  validateType(type);
  const bases = [getComponentDir(type), getStoreComponentDir(type)];
  const seen = new Set();
  const components = [];

  for (const baseDir of bases) {
    let entries;
    try {
      entries = await readdir(baseDir, { withFileTypes: true });
    } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || seen.has(entry.name)) continue;
      seen.add(entry.name);
      const compDir = join(baseDir, entry.name);
      const meta = await readComponentMeta(compDir);
      components.push({ name: entry.name, type, dir: compDir, ...meta });
    }
  }
  return components;
}

export async function listAll() {
  const all = {};
  for (const type of COMPONENT_TYPES) {
    all[type] = await listComponents(type);
  }
  return all;
}

async function readComponentMeta(dir) {
  try {
    const raw = await readFile(join(dir, 'manifest.json'), 'utf8');
    return JSON.parse(raw);
  } catch { /* fall through */ }

  for (const file of ['SKILL.md', 'README.md']) {
    try {
      const md = await readFile(join(dir, file), 'utf8');
      const match = md.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const frontmatter = parseFrontmatter(match[1]);
        return { description: frontmatter.description || '' };
      }
      const heading = md.match(/^#\s+(.+)/m);
      if (heading) return { description: heading[1] };
    } catch { /* fall through */ }
  }

  return { description: '' };
}

function parseFrontmatter(raw) {
  const result = {};
  let currentKey = null;
  let multilineValue = [];
  let isMultiline = false;

  for (const line of raw.split('\n')) {
    const topLevel = /^(\w[\w-]*):\s*(.*)/.exec(line);
    if (topLevel) {
      if (isMultiline && currentKey) {
        result[currentKey] = multilineValue.join(' ').trim();
      }
      currentKey = topLevel[1];
      const val = topLevel[2].trim();
      if (val === '>' || val === '>-' || val === '|' || val === '|-') {
        isMultiline = true;
        multilineValue = [];
      } else {
        isMultiline = false;
        result[currentKey] = val;
      }
    } else if (isMultiline && currentKey) {
      multilineValue.push(line.trim());
    }
  }
  if (isMultiline && currentKey) {
    result[currentKey] = multilineValue.join(' ').trim();
  }
  return result;
}

export async function componentExists(type, name) {
  return (await findComponentDir(type, name)) !== null;
}

export { COMPONENT_TYPES };
