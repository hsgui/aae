import { join } from 'node:path';
import { homedir } from 'node:os';
import { stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';

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
      commands:  join(home, '.claude', 'commands'),
      agents:    join(home, '.claude', 'agents'),
      hooks:     join(home, '.claude', 'hooks'),
      workflows: join(home, '.claude', 'commands'),
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
