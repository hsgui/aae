# Project install and custom store — implementation plan

> **For agentic workers:** Use checkbox steps for tracking; spec: `docs/superpowers/specs/2026-04-04-project-install-design.md`.

**Goal:** Add `--project <path>` for project-local symlinks, `--store <path>` for per-invocation store root, comma-separated `--target`, and thread options through registry/linker/CLI per spec.

**Architecture:** `targets.mjs` builds target maps from any root via `makeTargets(root)`; `resolveTargetDir(..., { projectRoot })` switches home vs project. `registry.mjs` parameterizes store with `getStoreRoot({ store })`. `linker.mjs` accepts `projectRoot` and passes `store` only where `listComponents` is used. `bin/aae.js` parses flags, validates `--project` + non-interactive rules, and passes context into commands.

**Tech stack:** Node >=18, ESM, `node:test`.

---

### Task 1: Targets module

**Files:** `src/targets.mjs`, `src/targets.test.mjs`

- [ ] Refactor duplicated paths into `makeTargets(root)`; keep `TARGETS = makeTargets(homedir())`.
- [ ] Export `getTargetsForRoot(root)` (alias of `makeTargets` or thin wrapper).
- [ ] Extend `resolveTargetDir(targetName, componentType, { projectRoot } = {})`.

### Task 2: Registry module

**Files:** `src/registry.mjs`, `src/registry.test.mjs`

- [ ] `getStoreRoot({ store })` — default `~/.aae`, else `resolve(store)`.
- [ ] Thread `{ store }` through `getStoreComponentDir`, `findComponentDir`, `listComponents`, `listAll`, `componentExists`.

### Task 3: Linker

**Files:** `src/linker.mjs`

- [ ] Pass `projectRoot` into `resolveTargetDir` in link/unlink helpers.
- [ ] `linkAll` / `unlinkAll`: pass `{ store }` to `listComponents` and `projectRoot` to each link/unlink.

### Task 4: CLI + public API + docs

**Files:** `bin/aae.js`, `src/index.mjs`, `README.md`

- [ ] Parse `--project`, `--store`; exclude their values from positionals.
- [ ] `parseTargetList` for comma-separated `--target`; validate names.
- [ ] `resolveTargets` per spec (project + TTY + quiet rules).
- [ ] `promptTargets(targetsMap)` for project vs home display.
- [ ] Wire `add`, `link`, `unlink`, `remove`, `list` with `store` / `projectRoot`.
- [ ] Export `getTargetsForRoot` from `index.mjs` if useful; ensure `resolveTargetDir` third-arg behavior is public.

### Task 5: Verify

- [ ] Run `npm test`
- [ ] Manual: `aae add` with `--project` and `--target` in non-TTY
