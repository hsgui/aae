#!/usr/bin/env node

import { listAll, listComponents, COMPONENT_TYPES } from '../src/registry.mjs';
import { linkComponent, unlinkComponent, linkAll, unlinkAll } from '../src/linker.mjs';
import { detectTargets, getTargetLabel, TARGETS } from '../src/targets.mjs';

const argv = process.argv.slice(2);
const command = argv.find(a => !a.startsWith('-'));
const args = argv.filter(a => a !== command);

function flag(name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

const HELP = `
aae — AI Agent Engineering

Usage:
  aae list     [type]              List available components
  aae link     [type] [name]       Symlink components into detected platforms
  aae unlink   [type] [name]       Remove symlinks
  aae targets                      Show detected platforms
  aae help                         Show this help

Options:
  --target <cursor|claude>         Target a specific platform (default: auto-detect)
  --quiet                          Suppress output

Types: ${COMPONENT_TYPES.join(', ')}

Component ↔ Platform mapping:
  skills/      → Cursor (~/.cursor/skills/)
  commands/    → Claude (~/.claude/commands/)
  agents/      → Cursor + Claude
  hooks/       → Cursor + Claude
  workflows/   → Cursor (~/.cursor/workflows/) + Claude (~/.claude/commands/)

Examples:
  aae list                         List all components
  aae link                         Link everything to all detected platforms
  aae link --target claude         Link only to Claude Code
  aae link commands my-cmd         Link a specific command to Claude
`.trim();

async function resolveTargets() {
  const explicit = flag('--target');
  if (explicit) {
    if (!TARGETS[explicit]) {
      console.error(`Unknown target: ${explicit}. Available: ${Object.keys(TARGETS).join(', ')}`);
      process.exit(1);
    }
    return [explicit];
  }
  return await detectTargets();
}

async function main() {
  const quiet = args.includes('--quiet');
  const positional = args.filter(a => !a.startsWith('-') && a !== flag('--target'));

  switch (command) {
    case 'list':
    case 'ls': {
      const [type] = positional;
      if (type) {
        const items = await listComponents(type);
        if (items.length === 0) {
          console.log(`No ${type} found.`);
        } else {
          console.log(`\n${type} (${items.length}):`);
          for (const item of items) {
            console.log(`  ${item.name}${item.description ? ' — ' + item.description : ''}`);
          }
          console.log();
        }
      } else {
        const all = await listAll();
        let total = 0;
        for (const [type, items] of Object.entries(all)) {
          total += items.length;
          if (items.length > 0) {
            console.log(`\n${type} (${items.length}):`);
            for (const item of items) {
              console.log(`  ${item.name}${item.description ? ' — ' + item.description : ''}`);
            }
          }
        }
        if (total === 0) console.log('No components found.');
        console.log();
      }
      break;
    }

    case 'link': {
      const targets = await resolveTargets();
      if (!quiet) console.log(`Targets: ${targets.map(getTargetLabel).join(', ')}\n`);

      if (positional.length >= 2) {
        await linkComponent(positional[0], positional[1], { quiet, targets });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0]);
        for (const item of items) {
          await linkComponent(positional[0], item.name, { quiet, targets });
        }
      } else {
        const count = await linkAll({ quiet, targets });
        if (!quiet) console.log(`\nDone. ${count} component(s) linked.`);
      }
      break;
    }

    case 'unlink': {
      const targets = await resolveTargets();
      if (!quiet) console.log(`Targets: ${targets.map(getTargetLabel).join(', ')}\n`);

      if (positional.length >= 2) {
        await unlinkComponent(positional[0], positional[1], { quiet, targets });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0]);
        for (const item of items) {
          await unlinkComponent(positional[0], item.name, { quiet, targets });
        }
      } else {
        const count = await unlinkAll({ quiet, targets });
        if (!quiet) console.log(`\nDone. ${count} component(s) unlinked.`);
      }
      break;
    }

    case 'targets': {
      const detected = await detectTargets();
      console.log('\nPlatform detection:\n');
      for (const [name, target] of Object.entries(TARGETS)) {
        const found = detected.includes(name);
        console.log(`  ${found ? '✓' : '✗'} ${target.label} (${target.configDir})`);
      }
      console.log();
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    case undefined:
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err.message);
  process.exitCode = 1;
});
