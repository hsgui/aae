# aae — AI Agent Engineering

Install and manage **skills**, **commands**, **agents**, **hooks**, and **workflows** for AI coding assistants. Supports both **Cursor** and **Claude Code**.

Compatible with the [Agent Skills](https://agentskills.io) specification — works with any repo that has `SKILL.md` files.

Requires **Node.js >= 18**.

## Quick Start

```bash
# Install the deep-research skill
npx @hsgui/aae add hsgui/aae/skills/deep-research

# Install the proposal-review skill
npx @hsgui/aae add hsgui/aae/skills/proposal-review

# Install all components from a repo
npx @hsgui/aae add hsgui/aae
```

## Install

Use directly via `npx` (no install needed):

```bash
npx @hsgui/aae add hsgui/aae/skills/deep-research
```

Or install globally for the shorter `aae` command:

```bash
npm install -g @hsgui/aae
aae add hsgui/aae/skills/deep-research
```

When installed as a project dependency (`npm install @hsgui/aae`), the postinstall hook automatically runs `aae link` to symlink all bundled components into detected platforms.

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

### Command aliases

| Command   | Aliases              |
|-----------|----------------------|
| `add`     | `a`, `install`, `i`  |
| `remove`  | `rm`                 |
| `list`    | `ls`                 |

### Options

| Flag                 | Description |
|----------------------|-------------|
| `--target <names>`   | One or more of `cursor`, `claude`, `claude-internal` (comma-separated). Skips auto-detect and interactive prompts. |
| `--project <path>`   | Symlink into `<path>/.cursor/...` and `<path>/.claude/...` (same layout as `~`). Paths are relative to the current working directory. Missing directories are created. With `--project`, you must pass `--target` when not in an interactive terminal or when using `--quiet`. |
| `--store <path>`     | For this command only, use `<path>` as the download store instead of `~/.aae`. Affects `add`, `remove`, `list`, `link`, and `unlink`. Bundled package components are still discovered. |
| `--quiet`            | Suppress output (used by `postinstall`). |

In an interactive terminal (without `--quiet`), if you omit `--target`, you’ll be prompted to choose platform(s). Use `--target` to skip the prompt.

### Project-local symlinks

Install into a repo’s `.cursor` / `.claude` trees so the skill is scoped to that project (Cursor / Claude Code still load project-level config when opened from that folder):

```bash
aae add hsgui/aae/skills/deep-research --project . --target cursor
aae link --project . --target cursor,claude
```

Use `--store ./vendor/aae` (for example) to keep downloads next to the repo instead of under `~/.aae`.

### LLM Knowledge Bases (`llm-kb-*` skills)

Three bundled skills support a personal knowledge-base workflow aligned with Andrej Karpathy’s **LLM Knowledge Bases** thread on X: index sources into `raw/`, have an LLM incrementally compile a linked markdown `wiki/`, browse everything in Obsidian, ask complex questions and file answers (and slides, figures) back into the vault, and run LLM “health checks” to improve consistency and coverage — with the wiki mostly maintained by the agent, not by hand.

| Skill | Role |
|-------|------|
| `llm-kb-compile` | Compile `raw/` into a structured `wiki/` (summaries, backlinks, concept articles). |
| `llm-kb-health-lint` | Knowledge-base quality passes — consistency, gaps, connections, optional web imputation. |
| `llm-kb-research-file` | Answer complex questions via the wiki index; write markdown, Marp, matplotlib, etc., and file outputs back into the KB. |

Install them into **your knowledge-base repo** with project-local symlinks (replace `your-llm-kb` with the repo root, or use `.` from inside that folder):

```bash
npx @hsgui/aae add hsgui/aae/skills/llm-kb-compile --project your-llm-kb --target cursor,claude
npx @hsgui/aae add hsgui/aae/skills/llm-kb-health-lint --project your-llm-kb --target cursor,claude
npx @hsgui/aae add hsgui/aae/skills/llm-kb-research-file --project your-llm-kb --target cursor,claude
```

With `aae` installed globally, the same paths work as `aae add hsgui/aae/skills/llm-kb-compile ...`. See [Project-local symlinks](#project-local-symlinks) for `--project` / `--target` behavior.

## WorkBuddy Integration

[WorkBuddy](https://www.codebuddy.cn/) loads user-level skills from `~/.workbuddy/skills/<name>/`, which isn't one of the platforms that the `aae` CLI auto-detects. A bundled helper script, `install-skills.sh`, symlinks **each skill individually** from this repo into `~/.workbuddy/skills/` so you can keep editing skills in-repo (and have changes take effect immediately) while still installing third-party WorkBuddy skills side-by-side without polluting this repo.

```bash
# From the repo root (idempotent — safe to re-run after adding skills):
./install-skills.sh
```

The script:

- Symlinks **each skill directory** from `skills/<name>/` into `~/.workbuddy/skills/<name>/` (one symlink per skill, not a single top-level symlink).
- **Protects third-party skills**: if `~/.workbuddy/skills/<name>/` already exists as a real directory (installed through WorkBuddy itself), it's left untouched with a `SKIP` warning.
- **Auto-migrates** a legacy whole-directory symlink at `~/.workbuddy/skills` → flat per-skill symlinks.
- Is path-independent: it resolves the repo root from `$BASH_SOURCE`, so `git clone` anywhere and run it — no hard-coded paths.

Typical workflow:

```bash
# Add a new skill to the repo
cd /path/to/aae
# ...author skills/my-new-skill/SKILL.md...
./install-skills.sh             # link it into WorkBuddy
git add skills/my-new-skill && git commit -m "add my-new-skill"

# On a fresh machine
git clone <this repo> ~/repos/aae
cd ~/repos/aae && ./install-skills.sh
```

Edits in `skills/<name>/` are visible to WorkBuddy immediately (symlinks are live). Conversely, when WorkBuddy edits one of these skills, changes land directly in this git repo — `git status` shows them ready to commit.

### Per-skill local config

Some skills read a local, **non-git** config file to customize behavior per machine. Keep these **outside** `~/.workbuddy/skills/` (which contains symlinks into this repo) — the convention is:

```
~/.workbuddy/config/<skill-name>.conf
```

Example: the `jot` skill reads `~/.workbuddy/config/jot.conf` for a `JOT_NOTES_FILE=...` override. See `skills/jot/SKILL.md` for details.

## Platform Mapping

Components are symlinked to the right location based on platform:

| Type       | Cursor (`~/.cursor/`)    | Claude Code (`~/.claude/`) | WorkBuddy (`~/.workbuddy/`) |
|------------|--------------------------|----------------------------|-----------------------------|
| skills     | `skills/<name>/`         | `skills/<name>/`           | `skills/<name>/` (via `install-skills.sh`) |
| commands   | —                        | `commands/<name>/`         | —                           |
| agents     | `agents/<name>/`         | `agents/<name>/`           | —                           |
| hooks      | `hooks/<name>/`          | `hooks/<name>/`            | —                           |
| workflows  | `workflows/<name>/`      | `commands/<name>/`         | —                           |

## Storage

- **Bundled components**: included in the package itself (e.g. `skills/deep-research/`)
- **Downloaded components** (`aae add`): by default saved to `~/.aae/<type>/<name>/` — persists across `npx` runs. Override per command with `--store <path>`.
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
import {
  // Registry — discover local components
  listAll,              // ({ store }?) → { skills: [...], ... }
  listComponents,       // (type, { store }?) → [{ name, type, dir, description }]
  componentExists,      // (type, name, { store }?) → boolean
  findComponentDir,     // (type, name, { store }?) → string | null
  getRoot,              // () → package root path
  getStoreRoot,         // ({ store }?) → effective store root (default ~/.aae)
  COMPONENT_TYPES,      // ['skills', 'commands', 'agents', 'hooks', 'workflows']

  // Linker — symlink management
  linkComponent,        // (type, name, { targets, src, projectRoot, quiet }?) → [...]
  unlinkComponent,      // (type, name, { targets, projectRoot, quiet }?) → [...]
  linkAll,              // ({ targets, projectRoot, store, quiet }?) → count
  unlinkAll,            // ({ targets, projectRoot, store, quiet }?) → count

  // Targets — platform detection
  detectTargets,        // () → ['cursor', 'claude', ...]
  resolveTargetDir,     // (target, type, { projectRoot }?) → directory path
  makeTargets,          // (root) → target map for any root (home or project)
  getTargetsForRoot,    // alias of makeTargets
  TARGETS,              // { cursor: {...}, claude: {...}, ... } (home-based)

  // GitHub — download from repos
  parseSource,          // (source) → { owner, repo, subpath }
  downloadDir,          // (owner, repo, path, dest) → files[]
  discoverRemoteComponents, // (owner, repo, subpath?) → [{ name, type, remotePath }]
} from '@hsgui/aae';
```

Example usage:

```js
const targets = await detectTargets();  // ['cursor', 'claude']
const components = await listAll({ store: '/custom/aae-store' });
await linkComponent('skills', 'my-skill', {
  targets: ['claude'],
  src: '/path/to/skill',
  projectRoot: '/path/to/repo', // optional: .cursor / .claude under repo
});
```

## Acknowledgements

- [vercel-labs/skills](https://github.com/vercel-labs/skills) — The open agent skills CLI and ecosystem that defined the `SKILL.md` specification. `aae` is compatible with repos that follow this format.
- [mattpocock/skills](https://github.com/mattpocock/skills) — A curated collection of high-quality agent skills for planning, development, and tooling that helped inspire the direction of this project.
- [geekjourneyx/md2wechat-skill](https://github.com/geekjourneyx/md2wechat-skill) — Markdown-to-WeChat Official Account tooling and the upstream `md2wechat` agent skill; the bundled `md2wechat-best-practices` skill is meant to pair with that workflow.

## License

MIT
