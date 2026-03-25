import { join } from 'node:path';
import { homedir } from 'node:os';
import { stat } from 'node:fs/promises';

const home = homedir();

export const TARGETS = {
  cursor: {
    label: 'Cursor',
    configDir: join(home, '.cursor'),
    typeMap: {
      skills:    join(home, '.cursor', 'skills'),
      agents:    join(home, '.cursor', 'agents'),
      hooks:     join(home, '.cursor', 'hooks'),
      workflows: join(home, '.cursor', 'workflows'),
    },
  },
  claude: {
    label: 'Claude Code',
    configDir: join(home, '.claude'),
    typeMap: {
      skills:    join(home, '.claude', 'skills'),
      commands:  join(home, '.claude', 'commands'),
      agents:    join(home, '.claude', 'agents'),
      hooks:     join(home, '.claude', 'hooks'),
      workflows: join(home, '.claude', 'commands'),
    },
  },
  'claude-internal': {
    label: 'Claude Code (Internal)',
    configDir: join(home, '.claude-internal'),
    typeMap: {
      skills:    join(home, '.claude-internal', 'skills'),
      commands:  join(home, '.claude-internal', 'commands'),
      agents:    join(home, '.claude-internal', 'agents'),
      hooks:     join(home, '.claude-internal', 'hooks'),
      workflows: join(home, '.claude-internal', 'commands'),
    },
  },
};

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

export function resolveTargetDir(targetName, componentType) {
  const target = TARGETS[targetName];
  if (!target) throw new Error(`Unknown target: ${targetName}`);
  return target.typeMap[componentType] || null;
}

export function getTargetLabel(targetName) {
  return TARGETS[targetName]?.label || targetName;
}
