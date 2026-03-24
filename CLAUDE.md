# aae — AI Agent Engineering

This is an npm package that manages reusable components (skills, commands, agents, hooks, workflows) for AI coding assistants (Cursor + Claude Code).

## Architecture

- `src/github.mjs` — GitHub API client: parse source strings, download dirs, discover components
- `src/targets.mjs` — Platform detection and path mapping (cursor ↔ claude)
- `src/registry.mjs` — Component discovery (scans package dir + ~/.aae/ store, reads metadata)
- `src/linker.mjs` — Symlink manager (links components into `~/.cursor/` or `~/.claude/`)
- `bin/aae.js` — CLI entry point

## Component types and where they link

| Type       | Cursor                   | Claude Code              |
|------------|--------------------------|--------------------------|
| skills     | ~/.cursor/skills/        | ~/.claude/skills/         |
| commands   | —                        | ~/.claude/commands/       |
| agents     | ~/.cursor/agents/        | ~/.claude/agents/         |
| hooks      | ~/.cursor/hooks/         | ~/.claude/hooks/          |
| workflows  | ~/.cursor/workflows/     | ~/.claude/commands/       |

## Storage model

- **Bundled components**: live inside the package directory (e.g. `skills/deep-research/`)
- **Downloaded components** (`aae add`): stored in `~/.aae/<type>/<name>/` for persistence across npx runs
- Both locations are merged when listing/linking

## CLI commands

- `aae add <owner/repo[/path]>` — Download from GitHub + auto-link
- `aae remove <type> <name>` — Delete files + unlink
- `aae list [type]` — List local components
- `aae link [type] [name]` — Create symlinks to platforms
- `aae unlink [type] [name]` — Remove symlinks
- `aae targets` — Show detected platforms

## Conventions

- Each component is a directory under its type folder (e.g. `skills/my-skill/`)
- Supports Agent Skills repos (SKILL.md at root level, like mattpocock/skills)
- Metadata is read from `manifest.json`, `SKILL.md` frontmatter, or `README.md` heading
- The CLI auto-detects which platforms are installed
- GitHub auth: auto-reads `gh auth token`, or uses `GITHUB_TOKEN` / `GH_TOKEN` env var
- `npm install` triggers `postinstall` which runs `aae link --quiet`
