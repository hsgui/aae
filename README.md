# aae — AI Agent Engineering

Install and manage **skills**, **commands**, **agents**, **hooks**, and **workflows** for AI coding assistants. Supports both **Cursor** and **Claude Code**.

Compatible with the [Agent Skills](https://agentskills.io) specification — works with any repo that has `SKILL.md` files.

## Quick Start

```bash
# Install the deep-research skill
npx @hsgui/aae add hsgui/aae/skills/deep-research

# Install all components from a repo
npx @hsgui/aae add hsgui/aae
```

## Install from GitHub

Add components directly from any GitHub repo:

```bash
aae add hsgui/aae                            # all components from a repo
aae add hsgui/aae/skills/deep-research       # a specific skill
aae add https://github.com/hsgui/aae/tree/master/skills/deep-research  # full URL with path
aae add https://github.com/hsgui/aae        # full GitHub URL
```

The `add` command downloads the component to `~/.aae/`, then symlinks it to detected platforms — all in one step.

Authentication is automatic if `gh` CLI is logged in, or set `GITHUB_TOKEN` env var.

### Supported repo layouts

**Type-based repos** (components grouped by type):
```
repo/
├── skills/my-skill/SKILL.md
├── commands/deploy/action.md
└── agents/my-agent/manifest.json
```

**Agent Skills repos** (skills at root level with `SKILL.md`):
```
repo/
├── prd-to-plan/SKILL.md
├── tdd/SKILL.md
└── grill-me/SKILL.md
```

Both layouts are auto-detected.

## Remove Components

```bash
aae remove skills my-skill                   # delete files and unlink
aae remove commands deploy
```

## Usage

```bash
aae targets                      # show detected platforms
aae list                         # list all local components
aae list skills                  # list only skills

aae link                         # link everything to all platforms
aae link --target claude         # link only to Claude Code
aae link skills my-skill         # link a specific skill

aae unlink skills my-skill       # unlink (keep files, remove symlink)
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

## Storage

- **Bundled components**: included in the package itself (e.g. `skills/deep-research/`)
- **Downloaded components** (`aae add`): saved to `~/.aae/<type>/<name>/` — persists across `npx` runs
- Both sources are merged when listing and linking

## Project Structure

```
aae/
├── bin/aae.js             # CLI entry point
├── src/
│   ├── index.mjs          # Public API
│   ├── github.mjs         # GitHub API client (download, discover)
│   ├── targets.mjs        # Platform detection & path mapping
│   ├── registry.mjs       # Component discovery (package + ~/.aae/ store)
│   └── linker.mjs         # Symlink manager
├── skills/                # Bundled skills (SKILL.md)
├── commands/              # Claude slash commands
├── agents/                # Agent definitions
├── hooks/                 # Lifecycle hooks
└── workflows/             # Workflow definitions
```

## Creating Skills

Create a directory with a `SKILL.md` file following the [Agent Skills specification](https://agentskills.io/specification):

```markdown
---
name: my-skill
description: What this skill does and when to use it.
---

# My Skill

Instructions for the agent to follow when this skill is activated.
```

## Programmatic API

```js
import { listAll, linkComponent, detectTargets, downloadDir, getStoreRoot } from '@hsgui/aae';

const targets = await detectTargets();  // ['cursor', 'claude']
const components = await listAll();
await linkComponent('skills', 'my-skill', { targets: ['claude'], src: '/path/to/skill' });
```

## License

MIT
