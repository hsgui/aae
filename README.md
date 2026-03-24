# aae — AI Agent Engineering

Install and manage **skills**, **commands**, **agents**, **hooks**, and **workflows** for AI coding assistants. Supports both **Cursor** and **Claude Code**.

## Quick Start

```bash
git clone https://github.com/hsgui/aae.git && cd aae
npm install   # auto-links all components to detected platforms
npm link      # makes `aae` command available globally
```

## Usage

```bash
aae targets                      # show detected platforms
aae list                         # list all components
aae list commands                # list only commands

aae link                         # link everything to all platforms
aae link --target claude         # link only to Claude Code
aae link commands my-cmd         # link a specific command

aae unlink commands my-cmd       # unlink a specific command
```

## Platform Mapping

Components are symlinked to the right location based on platform:

| Type       | Cursor (`~/.cursor/`)    | Claude Code (`~/.claude/`) |
|------------|--------------------------|----------------------------|
| skills     | `skills/<name>/`         | —                          |
| commands   | —                        | `commands/<name>/`         |
| agents     | `agents/<name>/`         | `agents/<name>/`           |
| hooks      | `hooks/<name>/`          | `hooks/<name>/`            |
| workflows  | `workflows/<name>/`      | `commands/<name>/`         |

## Project Structure

```
aae/
├── bin/aae.mjs            # CLI
├── src/
│   ├── index.mjs          # Public API
│   ├── targets.mjs        # Platform detection & path mapping
│   ├── registry.mjs       # Component discovery
│   └── linker.mjs         # Symlink manager
├── skills/                # Cursor skills (SKILL.md)
├── commands/              # Claude slash commands (.md files)
├── agents/                # Agent definitions (both platforms)
├── hooks/                 # Lifecycle hooks (both platforms)
└── workflows/             # Workflow definitions (both platforms)
```

## Adding Components

Create a directory under the appropriate type folder:

```bash
# Cursor skill
skills/my-skill/SKILL.md

# Claude slash command (namespace with .md files)
commands/my-cmd/action.md

# Agent (works on both platforms)
agents/my-agent/manifest.json
```

Metadata is read from `manifest.json`, `SKILL.md` frontmatter, or `README.md` heading.

## Third-Party Packages

Publish standalone npm packages following naming conventions:

| Type       | npm package pattern       |
|------------|---------------------------|
| Skills     | `aae-skill-<name>`        |
| Commands   | `aae-command-<name>`      |
| Agents     | `aae-agent-<name>`        |
| Hooks      | `aae-hook-<name>`         |
| Workflows  | `aae-workflow-<name>`     |

## Programmatic API

```js
import { listAll, linkComponent, detectTargets } from 'aae';

const targets = await detectTargets();  // ['cursor', 'claude']
const components = await listAll();
await linkComponent('commands', 'my-cmd', { targets: ['claude'] });
```

## License

MIT
