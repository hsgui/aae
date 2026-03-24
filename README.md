# aae — AI Agent Engineering

Install and manage **skills**, **agents**, **hooks**, and **workflows** for AI coding assistants.

## Quick Start

```bash
# Clone and link all components into ~/.cursor/
git clone <repo-url> && cd aae
npm install
npm link

# Or install from npm (once published)
npm install -g aae
```

After installation, all bundled components are automatically symlinked into `~/.cursor/` via `postinstall`.

## Usage

```bash
# List available components
aae list
aae list skills

# Link / unlink components into ~/.cursor/
aae link                       # link everything
aae link skills github         # link one skill
aae unlink skills github       # unlink one skill
```

## Project Structure

```
aae/
├── bin/aae.mjs          # CLI entry point
├── src/
│   ├── index.mjs        # Public API
│   ├── registry.mjs     # Component discovery
│   └── linker.mjs       # Symlink manager
├── skills/              # Cursor skills (SKILL.md per directory)
├── agents/              # Agent configurations
├── hooks/               # Lifecycle hooks
└── workflows/           # Workflow definitions
```

## Adding Components

### Skills

Create a directory under `skills/` with a `SKILL.md`:

```
skills/my-skill/
└── SKILL.md
```

The `SKILL.md` must include YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does and when to use it.
---
```

### Agents / Hooks / Workflows

Same pattern — create a directory under the corresponding folder with either a `SKILL.md` or `manifest.json` describing the component.

## Third-Party Packages

Components can also be published as standalone npm packages following the naming convention:

| Type      | Package name pattern      |
|-----------|---------------------------|
| Skills    | `aae-skill-<name>`        |
| Agents    | `aae-agent-<name>`        |
| Hooks     | `aae-hook-<name>`         |
| Workflows | `aae-workflow-<name>`     |

## Programmatic API

```js
import { listAll, linkComponent, unlinkComponent } from 'aae';

const components = await listAll();
await linkComponent('skills', 'github');
```

## License

MIT
