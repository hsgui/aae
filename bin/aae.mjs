#!/usr/bin/env node

import { listAll, listComponents, COMPONENT_TYPES } from '../src/registry.mjs';
import { linkComponent, unlinkComponent, linkAll, unlinkAll } from '../src/linker.mjs';

const [command, ...args] = process.argv.slice(2);

const HELP = `
aae — AI Agent Engineering

Usage:
  aae list   [type]              List available components
  aae link   [type] [name]       Symlink components into ~/.cursor/
  aae unlink [type] [name]       Remove symlinks from ~/.cursor/
  aae help                       Show this help

Types: ${COMPONENT_TYPES.join(', ')}

Examples:
  aae list                       List all components
  aae list skills                List only skills
  aae link                       Link all components
  aae link skills github         Link a specific skill
  aae unlink skills github       Unlink a specific skill
`.trim();

async function main() {
  const quiet = args.includes('--quiet');

  switch (command) {
    case 'list':
    case 'ls': {
      const [type] = args.filter(a => !a.startsWith('-'));
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
        if (total === 0) {
          console.log('No components found.');
        }
        console.log();
      }
      break;
    }

    case 'link': {
      const positional = args.filter(a => !a.startsWith('-'));
      if (positional.length >= 2) {
        await linkComponent(positional[0], positional[1], { quiet });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0]);
        for (const item of items) {
          await linkComponent(positional[0], item.name, { quiet });
        }
      } else {
        if (!quiet) console.log('Linking all components...');
        const count = await linkAll({ quiet });
        if (!quiet) console.log(`Done. ${count} component(s) linked.`);
      }
      break;
    }

    case 'unlink': {
      const positional = args.filter(a => !a.startsWith('-'));
      if (positional.length >= 2) {
        await unlinkComponent(positional[0], positional[1], { quiet });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0]);
        for (const item of items) {
          await unlinkComponent(positional[0], item.name, { quiet });
        }
      } else {
        if (!quiet) console.log('Unlinking all components...');
        const count = await unlinkAll({ quiet });
        if (!quiet) console.log(`Done. ${count} component(s) unlinked.`);
      }
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
