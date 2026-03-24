# aae — AI Agent Engineering

Install and manage **skills**, **commands**, **agents**, **hooks**, and **workflows** for AI coding assistants. Supports both **Cursor** and **Claude Code**.

## Quick Start

```bash
# Install from GitHub — single command
npx @hsgui/aae add owner/repo/skills/my-skill

# Or clone the repo for local development
git clone https://github.com/hsgui/aae.git && cd aae
npm install   # auto-links all components to detected platforms
npm link      # makes `aae` command available globally
```

## Install from GitHub

Add components directly from any GitHub repo:

```bash
aae add owner/repo                           # all components from a repo
aae add owner/repo/skills/my-skill           # a specific skill
aae add owner/repo/commands/deploy           # a specific command
aae add https://github.com/owner/repo        # full URL
aae add https://github.com/.../tree/main/skills/my-skill   # URL with path
```

The `add` command downloads the component, saves it locally, and symlinks it to detected platforms — all in one step.

Authentication is automatic if `gh` CLI is logged in, or set `GITHUB_TOKEN` env var.

## Remove Components

```bash
aae remove skills my-skill                   # delete files and unlink
aae remove commands deploy
```

## Usage

```bash
aae targets                      # show detected platforms
aae list                         # list all local components
aae list commands                # list only commands

aae link                         # link everything to all platforms
aae link --target claude         # link only to Claude Code
aae link commands my-cmd         # link a specific command

aae unlink commands my-cmd       # unlink (keep files, remove symlink)
```

## Platform Mapping

Components are symlinked to the right location based on platform:

| Type       | Cursor (`~/.cursor/`)    | Claude Code (`~/.claude/`) |
|------------|--------------------------|----------------------------|
| skills     | `skills/<name>/`         | `skills/<name>/`           |
| commands   | —                        | `commands/<name>/`         |
| agents     | `agents/<name>/`         | `agents/<name>/`           |
| hooks      | `hooks/<name>/`          | `hooks/<name>/`            |
| workflows  | `workflows/<name>/`      | `commands/<name>/`         |

## Project Structure

```
aae/
├── bin/aae.js             # CLI entry point
├── src/
│   ├── index.mjs          # Public API
│   ├── github.mjs         # GitHub API client (download, discover)
│   ├── targets.mjs        # Platform detection & path mapping
│   ├── registry.mjs       # Component discovery
│   └── linker.mjs         # Symlink manager
├── skills/                # Cursor skills (SKILL.md)
├── commands/              # Claude slash commands (.md files)
├── agents/                # Agent definitions (both platforms)
├── hooks/                 # Lifecycle hooks (both platforms)
└── workflows/             # Workflow definitions (both platforms)
```

## Creating Components

Create a directory under the appropriate type folder:

```bash
skills/my-skill/SKILL.md               # Skill (both platforms)
commands/my-cmd/action.md              # Claude slash command
agents/my-agent/manifest.json          # Agent (both platforms)
```

Metadata is read from `manifest.json`, `SKILL.md` frontmatter, or `README.md` heading.

## Programmatic API

```js
import { listAll, linkComponent, detectTargets, downloadDir } from '@hsgui/aae';

const targets = await detectTargets();  // ['cursor', 'claude']
const components = await listAll();
await linkComponent('commands', 'my-cmd', { targets: ['claude'] });
```

## License

MIT
