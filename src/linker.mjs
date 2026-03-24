import { mkdir, symlink, readlink, unlink, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getComponentDir, listComponents, COMPONENT_TYPES } from './registry.mjs';

const CURSOR_SKILLS_DIR = join(homedir(), '.cursor', 'skills');

const TARGET_DIRS = {
  skills: CURSOR_SKILLS_DIR,
  agents: join(homedir(), '.cursor', 'agents'),
  hooks: join(homedir(), '.cursor', 'hooks'),
  workflows: join(homedir(), '.cursor', 'workflows'),
};

export async function linkComponent(type, name, { quiet = false } = {}) {
  const src = join(getComponentDir(type), name);
  const targetDir = TARGET_DIRS[type];
  const dest = join(targetDir, name);

  await mkdir(targetDir, { recursive: true });

  try {
    const existing = await readlink(dest);
    if (existing === src) {
      if (!quiet) console.log(`  ✓ ${type}/${name} (already linked)`);
      return 'already';
    }
    await unlink(dest);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      try {
        const s = await stat(dest);
        if (s.isDirectory()) {
          if (!quiet) console.log(`  ⚠ ${type}/${name} skipped (non-symlink exists)`);
          return 'skipped';
        }
      } catch {
        // doesn't exist, proceed
      }
    }
  }

  await symlink(src, dest, 'dir');
  if (!quiet) console.log(`  ✓ ${type}/${name} → linked`);
  return 'linked';
}

export async function unlinkComponent(type, name, { quiet = false } = {}) {
  const dest = join(TARGET_DIRS[type], name);
  try {
    const target = await readlink(dest);
    const expected = join(getComponentDir(type), name);
    if (target !== expected) {
      if (!quiet) console.log(`  ⚠ ${type}/${name} skipped (not managed by aae)`);
      return 'skipped';
    }
    await unlink(dest);
    if (!quiet) console.log(`  ✓ ${type}/${name} → unlinked`);
    return 'unlinked';
  } catch {
    if (!quiet) console.log(`  - ${type}/${name} (not linked)`);
    return 'not_found';
  }
}

export async function linkAll({ quiet = false } = {}) {
  let count = 0;
  for (const type of COMPONENT_TYPES) {
    const components = await listComponents(type);
    for (const c of components) {
      const result = await linkComponent(type, c.name, { quiet });
      if (result === 'linked') count++;
    }
  }
  return count;
}

export async function unlinkAll({ quiet = false } = {}) {
  let count = 0;
  for (const type of COMPONENT_TYPES) {
    const components = await listComponents(type);
    for (const c of components) {
      const result = await unlinkComponent(type, c.name, { quiet });
      if (result === 'unlinked') count++;
    }
  }
  return count;
}
