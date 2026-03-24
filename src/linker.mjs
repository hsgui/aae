import { mkdir, symlink, readlink, unlink, stat } from 'node:fs/promises';
import { join, resolve, dirname, relative } from 'node:path';
import { getComponentDir, listComponents, COMPONENT_TYPES } from './registry.mjs';
import { detectTargets, resolveTargetDir, getTargetLabel } from './targets.mjs';

async function symlinkSafe(src, dest, { quiet = false, label = '' } = {}) {
  try {
    const existing = await readlink(dest);
    const resolvedExisting = resolve(dirname(dest), existing);
    if (resolvedExisting === resolve(src)) {
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

async function unsymlinkSafe(dest, { quiet = false, label = '' } = {}) {
  try {
    const target = await readlink(dest);
    // It's a symlink — remove it
    await unlink(dest);
    if (!quiet) console.log(`  ✓ ${label} → unlinked`);
    return 'unlinked';
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EINVAL') {
      if (!quiet) console.log(`  - ${label} (not linked)`);
      return 'not_found';
    }
    try {
      const s = await stat(dest);
      if (s.isDirectory() || s.isFile()) {
        if (!quiet) console.log(`  ⚠ ${label} skipped (not a symlink)`);
        return 'skipped';
      }
    } catch { /* doesn't exist */ }
    if (!quiet) console.log(`  - ${label} (not linked)`);
    return 'not_found';
  }
}

/**
 * Link a component to detected platform directories.
 * @param {string} type - Component type (skills, commands, etc.)
 * @param {string} name - Component name
 * @param {object} opts
 * @param {string} [opts.src] - Explicit source directory (defaults to package component dir)
 */
export async function linkComponent(type, name, { quiet = false, targets, src } = {}) {
  const resolvedTargets = targets || await detectTargets();
  const srcPath = src || join(getComponentDir(type), name);
  const results = [];

  for (const t of resolvedTargets) {
    const targetDir = resolveTargetDir(t, type);
    if (!targetDir) continue;

    await mkdir(targetDir, { recursive: true });
    const dest = join(targetDir, name);
    const label = `[${getTargetLabel(t)}] ${type}/${name}`;
    const result = await symlinkSafe(srcPath, dest, { quiet, label });
    results.push({ target: t, result });
  }
  return results;
}

export async function unlinkComponent(type, name, { quiet = false, targets } = {}) {
  const resolvedTargets = targets || await detectTargets();
  const results = [];

  for (const t of resolvedTargets) {
    const targetDir = resolveTargetDir(t, type);
    if (!targetDir) continue;

    const dest = join(targetDir, name);
    const label = `[${getTargetLabel(t)}] ${type}/${name}`;
    const result = await unsymlinkSafe(dest, { quiet, label });
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
      const results = await linkComponent(type, c.name, { quiet, targets: resolvedTargets, src: c.dir });
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
