import { join } from 'node:path';
import { homedir } from 'node:os';
import { stat } from 'node:fs/promises';

/**
 * Build target definitions for a config root (user home or project directory).
 * Same layout as global install: `.cursor`, `.claude`, `.claude-internal`.
 */
export function makeTargets(root) {
  return {
    cursor: {
      label: 'Cursor',
      configDir: join(root, '.cursor'),
      typeMap: {
        skills: join(root, '.cursor', 'skills'),
        agents: join(root, '.cursor', 'agents'),
        hooks: join(root, '.cursor', 'hooks'),
        workflows: join(root, '.cursor', 'workflows'),
      },
    },
    claude: {
      label: 'Claude Code',
      configDir: join(root, '.claude'),
      typeMap: {
        skills: join(root, '.claude', 'skills'),
        commands: join(root, '.claude', 'commands'),
        agents: join(root, '.claude', 'agents'),
        hooks: join(root, '.claude', 'hooks'),
        workflows: join(root, '.claude', 'commands'),
      },
    },
    'claude-internal': {
      label: 'Claude Code (Internal)',
      configDir: join(root, '.claude-internal'),
      typeMap: {
        skills: join(root, '.claude-internal', 'skills'),
        commands: join(root, '.claude-internal', 'commands'),
        agents: join(root, '.claude-internal', 'agents'),
        hooks: join(root, '.claude-internal', 'hooks'),
        workflows: join(root, '.claude-internal', 'commands'),
      },
    },
  };
}

const home = homedir();
export const TARGETS = makeTargets(home);

export function getTargetsForRoot(root) {
  return makeTargets(root);
}

export async function detectTargets() {
  const detected = [];
  for (const [name, target] of Object.entries(TARGETS)) {
    try {
      const s = await stat(target.configDir);
      if (s.isDirectory()) detected.push(name);
    } catch {
      // not installed
    }
  }
  return detected;
}

/**
 * Resolve symlink destination directory for a platform and component type.
 * @param {string} targetName
 * @param {string} componentType
 * @param {object} [opts]
 * @param {string} [opts.projectRoot] - If set, paths are under this directory instead of home.
 */
export function resolveTargetDir(targetName, componentType, { projectRoot } = {}) {
  const map = projectRoot ? makeTargets(projectRoot) : TARGETS;
  const target = map[targetName];
  if (!target) throw new Error(`Unknown target: ${targetName}`);
  return target.typeMap[componentType] || null;
}

export function getTargetLabel(targetName) {
  return TARGETS[targetName]?.label || targetName;
}
