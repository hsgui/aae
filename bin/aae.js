#!/usr/bin/env node

import { join, resolve } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { listAll, listComponents, COMPONENT_TYPES, getStoreRoot, findComponentDir } from '../src/registry.mjs';
import { linkComponent, unlinkComponent, linkAll, unlinkAll } from '../src/linker.mjs';
import { detectTargets, getTargetLabel, TARGETS, makeTargets } from '../src/targets.mjs';
import { parseSource, discoverRemoteComponents, downloadDir } from '../src/github.mjs';

const argv = process.argv.slice(2);
const command = argv.find(a => !a.startsWith('-'));
const args = argv.filter(a => a !== command);

function flag(name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolveAns => {
    rl.question(question, answer => { rl.close(); resolveAns(answer.trim()); });
  });
}

/**
 * @param {string | undefined} raw
 * @returns {string[] | null}
 */
function parseTargetNames(raw) {
  if (raw == null || raw === '') return null;
  const names = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (names.length === 0) return null;
  for (const n of names) {
    if (!TARGETS[n]) {
      console.error(`Unknown target: ${n}. Available: ${Object.keys(TARGETS).join(', ')}`);
      process.exit(1);
    }
  }
  return names;
}

/**
 * @param {Record<string, { label: string, configDir: string }>} targetsMap
 * @param {{ projectMode?: boolean }} [opts]
 */
async function promptTargets(targetsMap, { projectMode = false } = {}) {
  const entries = Object.entries(targetsMap);
  const detected = projectMode ? [] : await detectTargets();

  console.log('\n\x1b[33mWhich target(s) would you like to install for?\x1b[0m\n');
  entries.forEach(([name, target], i) => {
    const suffix = projectMode
      ? ''
      : (detected.includes(name) ? '' : ' \x1b[2m(not detected)\x1b[0m');
    console.log(`  \x1b[32m${i + 1})\x1b[0m ${target.label.padEnd(24)} \x1b[2m(${target.configDir})\x1b[0m${suffix}`);
  });
  console.log(`  \x1b[32m${entries.length + 1})\x1b[0m All`);
  console.log(`\n  \x1b[2mSelect multiple: 1,3 or 1 3\x1b[0m`);

  const defaultChoice = !projectMode && detected.length > 0
    ? detected.map(d => entries.findIndex(([n]) => n === d) + 1).join(',')
    : '1';
  const answer = await prompt(`  Choice [${defaultChoice}]: `);

  const input = answer || defaultChoice;
  const nums = input.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

  if (nums.includes(entries.length + 1)) {
    return entries.map(([name]) => name);
  }

  const selected = nums
    .filter(n => n >= 1 && n <= entries.length)
    .map(n => entries[n - 1][0]);

  if (selected.length === 0) {
    console.error('No valid targets selected.');
    process.exit(1);
  }

  return selected;
}

/**
 * @param {{ interactive?: boolean, projectRoot?: string | null, quiet?: boolean }} opts
 */
async function resolveTargets({ interactive = false, projectRoot = null, quiet = false } = {}) {
  const explicitList = parseTargetNames(flag('--target'));
  if (explicitList) return explicitList;

  if (projectRoot != null) {
    if (interactive && process.stdin.isTTY && !quiet) {
      const map = makeTargets(projectRoot);
      return await promptTargets(map, { projectMode: true });
    }
    console.error('aae: --target is required when using --project without an interactive terminal, or when using --quiet.');
    process.exit(1);
  }

  if (interactive && process.stdin.isTTY && !quiet) {
    return await promptTargets(TARGETS, { projectMode: false });
  }
  return await detectTargets();
}

const HELP = `
aae — AI Agent Engineering

Usage:
  aae add <source>                 Install from GitHub and link
  aae remove <type> <name>         Remove a local component and unlink
  aae list   [type]                List available components
  aae link   [type] [name]         Symlink components into detected platforms
  aae unlink [type] [name]         Remove symlinks
  aae targets                      Show detected platforms
  aae help                         Show this help

Options:
  --target <names>                 One or more of: cursor, claude, claude-internal (comma-separated)
  --project <path>                 Symlink under <path>/.cursor and/or <path>/.claude (requires --target when non-interactive or with --quiet)
  --store <path>                   Store downloads under <path> instead of ~/.aae (per command)
  --quiet                          Suppress output

Source formats:
  owner/repo                       All components from a repo
  owner/repo/path/to/skill         A specific skill (auto-detected by SKILL.md)
  owner/repo/type/name             A specific component (skills/, commands/, etc.)
  https://github.com/owner/repo    Full GitHub URL
  https://github.com/.../tree/main/path   URL with path

Types: ${COMPONENT_TYPES.join(', ')}

Component ↔ Platform mapping:
  skills/      → Cursor (~/.cursor/skills/) + Claude (~/.claude/skills/)
  commands/    → Claude (~/.claude/commands/)
  agents/      → Cursor + Claude
  hooks/       → Cursor + Claude
  workflows/   → Cursor (~/.cursor/workflows/) + Claude (~/.claude/commands/)

Supports repos with SKILL.md files at root level (Agent Skills format).
By default, downloaded components are stored in ~/.aae/; use --store to override.

Examples:
  aae add hsgui/aae                          Add all components from repo
  aae add hsgui/aae/skills/deep-research     Add a specific skill
  aae add hsgui/aae --project . --target cursor
  aae remove skills my-skill                 Remove a skill
  aae list                                   List all local components
  aae link                                   Link everything to detected platforms
  aae link --target claude                   Link only to Claude Code
`.trim();

async function runAdd(source, { quiet, targets, projectRoot, store }) {
  const { owner, repo, subpath } = parseSource(source);
  if (!quiet) console.log(`\nFetching from ${owner}/${repo}${subpath ? '/' + subpath : ''}...\n`);

  const components = await discoverRemoteComponents(owner, repo, subpath);

  if (components.length === 0) {
    console.log('No components found at that path.');
    return;
  }

  const storeRoot = getStoreRoot({ store });
  let added = 0;

  for (const comp of components) {
    const type = comp.type || 'skills';
    const destDir = join(storeRoot, type, comp.name);

    // Clean destination before downloading
    await rm(destDir, { recursive: true, force: true }).catch(() => {});
    await mkdir(destDir, { recursive: true });

    if (!quiet) console.log(`  Downloading ${type}/${comp.name}...`);
    const files = await downloadDir(owner, repo, comp.remotePath, destDir);
    if (!quiet) console.log(`    ${files.length} file(s) → ${destDir}`);

    const results = await linkComponent(type, comp.name, { quiet, targets, src: destDir, projectRoot });
    const linked = results.filter(r => r.result === 'linked' || r.result === 'already');
    if (!quiet && linked.length > 0) {
      for (const r of results) {
        console.log(`    [${getTargetLabel(r.target)}] → ${r.result}`);
      }
    }
    added++;
  }

  if (!quiet) console.log(`\nDone. ${added} component(s) added.\n`);
}

async function runRemove(type, name, { quiet, targets, projectRoot, store }) {
  const compDir = await findComponentDir(type, name, { store });

  if (!compDir) {
    console.error(`  ✗ ${type}/${name} not found`);
    return;
  }

  await unlinkComponent(type, name, { quiet, targets, projectRoot });

  try {
    await rm(compDir, { recursive: true, force: true });
    if (!quiet) console.log(`  ✓ ${type}/${name} → removed`);
  } catch (err) {
    console.error(`  ✗ Failed to remove ${type}/${name}: ${err.message}`);
  }
}

async function main() {
  const quiet = args.includes('--quiet');

  if (args.includes('--project')) {
    const p = flag('--project');
    if (p == null || p === '' || p.startsWith('-')) {
      console.error('aae: --project requires a path argument.');
      process.exit(1);
    }
  }
  if (args.includes('--store')) {
    const s = flag('--store');
    if (s == null || s === '' || s.startsWith('-')) {
      console.error('aae: --store requires a path argument.');
      process.exit(1);
    }
  }

  const targetVal = flag('--target');
  const projectVal = flag('--project');
  const storeVal = flag('--store');
  const positional = args.filter(a =>
    !a.startsWith('-') &&
    a !== targetVal &&
    a !== projectVal &&
    a !== storeVal
  );

  const projectRoot = projectVal != null ? resolve(process.cwd(), projectVal) : null;
  const store = storeVal != null ? resolve(process.cwd(), storeVal) : undefined;

  async function targetsForCmd() {
    return resolveTargets({ interactive: !quiet, projectRoot, quiet });
  }

  switch (command) {
    case 'add':
    case 'a':
    case 'install':
    case 'i': {
      const [source] = positional;
      if (!source) {
        console.error('Usage: aae add <owner/repo[/path]>');
        process.exitCode = 1;
        break;
      }
      const targets = await targetsForCmd();
      await runAdd(source, { quiet, targets, projectRoot, store });
      break;
    }

    case 'remove':
    case 'rm': {
      if (positional.length < 2) {
        console.error('Usage: aae remove <type> <name>');
        process.exitCode = 1;
        break;
      }
      const targets = await targetsForCmd();
      await runRemove(positional[0], positional[1], { quiet, targets, projectRoot, store });
      break;
    }

    case 'list':
    case 'ls': {
      const [type] = positional;
      if (type) {
        const items = await listComponents(type, { store });
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
        const all = await listAll({ store });
        let total = 0;
        for (const [t, items] of Object.entries(all)) {
          total += items.length;
          if (items.length > 0) {
            console.log(`\n${t} (${items.length}):`);
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
      const targets = await targetsForCmd();
      if (!quiet) console.log(`Targets: ${targets.map(getTargetLabel).join(', ')}\n`);

      if (positional.length >= 2) {
        const src = await findComponentDir(positional[0], positional[1], { store });
        await linkComponent(positional[0], positional[1], { quiet, targets, src, projectRoot });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0], { store });
        for (const item of items) {
          await linkComponent(positional[0], item.name, { quiet, targets, src: item.dir, projectRoot });
        }
      } else {
        const count = await linkAll({ quiet, targets, projectRoot, store });
        if (!quiet) console.log(`\nDone. ${count} component(s) linked.`);
      }
      break;
    }

    case 'unlink': {
      const targets = await targetsForCmd();
      if (!quiet) console.log(`Targets: ${targets.map(getTargetLabel).join(', ')}\n`);

      if (positional.length >= 2) {
        await unlinkComponent(positional[0], positional[1], { quiet, targets, projectRoot });
      } else if (positional.length === 1) {
        const items = await listComponents(positional[0], { store });
        for (const item of items) {
          await unlinkComponent(positional[0], item.name, { quiet, targets, projectRoot });
        }
      } else {
        const count = await unlinkAll({ quiet, targets, projectRoot, store });
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
