import { mkdir, symlink, readlink, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getComponentDir, listComponents, COMPONENT_TYPES } from './registry.mjs';
import { detectTargets, resolveTargetDir, getTargetLabel } from './targets.mjs';

async function symlinkSafe(src, dest, { quiet = false, label = '' } = {}) {
  try {
    const existing = await readlink(dest);
    if (existing === src) {
      if (!quiet) console.log(`  ✓ ${label} (already linked)`);
      return 'already';
    }
    await unlink(dest);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      try {
        const s = await stat(dest);
        if (s.isDirectory() || s.isFile()) {
          if (!quiet) console.log(`  ⚠ ${label} skipped (non-symlink exists)`);
          return 'skipped';
        }
      } catch { /* doesn't exist, proceed */ }
    }
  }

  await symlink(src, dest, 'dir');
  if (!quiet) console.log(`  ✓ ${label} → linked`);
  return 'linked';
}

async function unsymlinkSafe(src, dest, { quiet = false, label = '' } = {}) {
  try {
    const target = await readlink(dest);
    if (target !== src) {
      if (!quiet) console.log(`  ⚠ ${label} skipped (not managed by aae)`);
      return 'skipped';
    }
    await unlink(dest);
    if (!quiet) console.log(`  ✓ ${label} → unlinked`);
    return 'unlinked';
  } catch {
    if (!quiet) console.log(`  - ${label} (not linked)`);
    return 'not_found';
  }
}

export async function linkComponent(type, name, { quiet = false, targets } = {}) {
  const resolvedTargets = targets || await detectTargets();
  const src = join(getComponentDir(type), name);
  const results = [];

  for (const t of resolvedTargets) {
    const targetDir = resolveTargetDir(t, type);
    if (!targetDir) continue;

    await mkdir(targetDir, { recursive: true });
    const dest = join(targetDir, name);
    const label = `[${getTargetLabel(t)}] ${type}/${name}`;
    const result = await symlinkSafe(src, dest, { quiet, label });
    results.push({ target: t, result });
  }
  return results;
}

export async function unlinkComponent(type, name, { quiet = false, targets } = {}) {
  const resolvedTargets = targets || await detectTargets();
  const src = join(getComponentDir(type), name);
  const results = [];

  for (const t of resolvedTargets) {
    const targetDir = resolveTargetDir(t, type);
    if (!targetDir) continue;

    const dest = join(targetDir, name);
    const label = `[${getTargetLabel(t)}] ${type}/${name}`;
    const result = await unsymlinkSafe(src, dest, { quiet, label });
    results.push({ target: t, result });
  }
  return results;
}

export async function linkAll({ quiet = false, targets } = {}) {
  const resolvedTargets = targets || await detectTargets();
  let count = 0;
  for (const type of COMPONENT_TYPES) {
    const components = await listComponents(type);
    for (const c of components) {
      const results = await linkComponent(type, c.name, { quiet, targets: resolvedTargets });
      count += results.filter(r => r.result === 'linked').length;
    }
  }
  return count;
}

export async function unlinkAll({ quiet = false, targets } = {}) {
  const resolvedTargets = targets || await detectTargets();
  let count = 0;
  for (const type of COMPONENT_TYPES) {
    const components = await listComponents(type);
    for (const c of components) {
      const results = await unlinkComponent(type, c.name, { quiet, targets: resolvedTargets });
      count += results.filter(r => r.result === 'unlinked').length;
    }
  }
  return count;
}
