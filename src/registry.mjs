import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const COMPONENT_TYPES = ['skills', 'agents', 'hooks', 'workflows'];

export function getRoot() {
  return ROOT;
}

export function getComponentDir(type) {
  if (!COMPONENT_TYPES.includes(type)) {
    throw new Error(`Unknown component type: ${type}. Must be one of: ${COMPONENT_TYPES.join(', ')}`);
  }
  return join(ROOT, type);
}

export async function listComponents(type) {
  const dir = getComponentDir(type);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const components = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const meta = await readComponentMeta(type, entry.name);
    components.push({ name: entry.name, type, ...meta });
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

async function readComponentMeta(type, name) {
  const dir = join(getComponentDir(type), name);
  const manifest = join(dir, 'manifest.json');
  const skillMd = join(dir, 'SKILL.md');

  try {
    const raw = await readFile(manifest, 'utf8');
    return JSON.parse(raw);
  } catch {
    // fall through
  }

  try {
    const md = await readFile(skillMd, 'utf8');
    const match = md.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const frontmatter = parseFrontmatter(match[1]);
      return { description: frontmatter.description || '' };
    }
  } catch {
    // fall through
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
  try {
    const s = await stat(join(getComponentDir(type), name));
    return s.isDirectory();
  } catch {
    return false;
  }
}

export { COMPONENT_TYPES };
