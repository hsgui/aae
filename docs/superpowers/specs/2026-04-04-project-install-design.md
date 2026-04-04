# Project-local install and custom store — design spec

**Date:** 2026-04-04  
**Status:** Approved (conversation); pending implementation  
**Repo:** aae (`@hsgui/aae`)

## Context

`aae` downloads components from GitHub into a local store (default `~/.aae/<type>/<name>/`) and symlinks them into Cursor / Claude config trees under the user home directory (`~/.cursor/...`, `~/.claude/...`). Paths and mappings live in `src/targets.mjs`; linking in `src/linker.mjs`; CLI in `bin/aae.js`; store and discovery in `src/registry.mjs`.

## Goals

1. **Project install (`--project <path>`):** Use the same directory shape as global install, but rooted at a **project directory** (e.g. `<project>/.cursor/skills/<name>`). Create missing parent directories as needed.
2. **Custom store (`--store <path>`):** Allow a per-invocation store root **instead of** `~/.aae` for download/delete/discovery, while **bundled package components** remain discoverable from the package tree.
3. **Target selection with `--project`:** Do **not** use `detectTargets()` (home dir existence) to decide where to link. Use `--target` or an **interactive** menu; in non-interactive mode without `--target`, **fail** with a clear error.
4. **Command coverage:** `add`, `link`, `unlink`, and `remove` all honor `--project` and `--store` where applicable (see below).

## Non-goals (this iteration)

- Persisting `--project` / `--store` in a repo config file (e.g. `.aae.toml`); users pass flags each run or wrap scripts.
- Changing GitHub download or component discovery rules beyond store root and symlink roots.

## CLI

### Flags

| Flag | Argument | Semantics |
|------|----------|-----------|
| `--project` | Required path | Absolute path resolved with `resolve(cwd, path)`. Symlinks for applicable types go under `<project>/.cursor/...` and/or `<project>/.claude/...` per target and existing `typeMap`. |
| `--store` | Required path | **Replaces** `~/.aae` for this invocation: downloads, `remove` deletes under this tree, and store-backed `list` / `findComponentDir` use this root (see registry). Bundled components under the package still participate in list/find. |
| `--target` | One value, comma-separated allowed | e.g. `cursor`, `claude`, `claude-internal`, or `cursor,claude`. Multiple platforms in one flag for non-interactive use. |

`--project` and `--store` are **always** `flag + value` (no bare `--project`).

### `resolveTargets` behavior

| `--project` | TTY | `--target` | Result |
|-------------|-----|------------|--------|
| absent | * | absent | Current behavior: interactive if TTY and not `--quiet`; else `detectTargets()`. |
| absent | * | present | Single or comma-split list validated against `TARGETS`. |
| present | yes | absent | Interactive target menu; labels show **paths under the resolved project root** (not `~`). |
| present | no | absent | **Exit non-zero** with message: `--target` is required when using `--project` in non-interactive mode. |
| present | * | present | Use parsed targets only; **do not** gate on `detectTargets()`. |

### Help / docs

Update CLI `HELP` and `README.md` with `--project`, `--store`, comma-separated `--target`, and non-interactive rules.

## `targets.mjs`

- Introduce a way to resolve symlink **destination directories** from a **config root** (home vs project):
  - Either extend `resolveTargetDir(targetName, componentType, { root })` where `root` is `null`/`undefined` for current global behavior (`homedir()`-based), or add `resolveTargetDirFromRoot(root, targetName, componentType)`.
  - **Same `typeMap` shape** as today; only the prefix changes from `join(homedir(), '.cursor')` to `join(projectRoot, '.cursor')`, etc.
- `detectTargets()` remains for **`aae targets`** and for **global** `resolveTargets` when no `--project`; do not use it to decide project link destinations.

## `linker.mjs`

- Thread an optional **install context** (or explicit `projectRoot: string | null`) into `linkComponent`, `unlinkComponent`, `linkAll`, `unlinkAll`.
- When `projectRoot` is set, call the parameterized `resolveTargetDir` (or equivalent) so destinations live under the project tree.
- When `projectRoot` is unset, behavior matches today.

## `registry.mjs`

- **Single effective store root per invocation:** `~/.aae` **or** `resolve(cwd, --store)` when `--store` is passed. Not a union of both in one command (avoids ambiguous `remove`).
- **`getStoreRoot({ store })`:** Return resolved path; default `join(homedir(), '.aae')`.
- **`getStoreComponentDir(type, { store })`:** `join(getStoreRoot({ store }), type)`.
- **`findComponentDir(type, name, { store })`:** Search order: **store** (`getStoreComponentDir`), then **package** `getComponentDir` — align with existing semantics where store and package are both checked (today store is `~/.aae` only).
- **`listComponents(type, { store })`:** Bases = `[getComponentDir(type), getStoreComponentDir(type, { store })]`, preserving de-dupe by name (package wins first in iteration order as today).

`add` passes explicit `destDir` for download; it must use the effective store root.

## Command matrix

| Command | `--project` | `--store` | Notes |
|---------|-------------|-----------|--------|
| `add` | Symlink under project tree | Download to `<store>/<type>/<name>` | After download, `linkComponent` uses `projectRoot` if set. |
| `link` | Same | Resolves component `dir` via registry with store | |
| `unlink` | Same | Same | |
| `remove` | Unlink under project | Remove directory under effective store (not `~/.aae` when `--store` set) | Still unlink symlinks under project when `--project` set. |
| `list` | N/A (ignored or no-op) | List uses effective store | Optionally document that `--project` does not affect `list`. |
| `targets` | Optional future: show project tree existence | N/A | **v1:** Keep current behavior (home detection only); no requirement to extend `targets` for `--project`. |

## Errors

- Unknown `--target` name: error listing valid names.
- `--project` path not creatable or symlinks fail: surface underlying filesystem error.
- Non-interactive `--project` without `--target`: dedicated error message.

## Public API (`src/index.mjs`)

- Export updated helpers as needed: e.g. parameterized `getStoreRoot`, `resolveTargetDir` with optional root, and linker options `{ projectRoot, store }` consistent with CLI behavior so programmatic use stays aligned.

## Testing

- Unit tests for path resolution: global vs `projectRoot` for at least `skills` and `workflows` (Claude maps workflows → `commands`).
- Unit tests for store resolution: default vs explicit `store` in `getStoreRoot` / `findComponentDir` / `listComponents` if test harness exists; otherwise minimal `node:test` modules.
- Manual: `aae add <src> --project /tmp/p --target cursor` in non-TTY succeeds; same without `--target` fails.

## Implementation notes

- Parse comma-separated `--target` in one place shared by all commands.
- Interactive menu in `bin/aae.js` must read **project-aware** paths from `targets` helpers when `--project` is set.
