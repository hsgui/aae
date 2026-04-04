---
name: llm-kb-health-lint
description: Runs LLM-driven wiki health checks—consistency, completeness, orphan/island detection, missing-data gaps with optional web verification/imputation, connection discovery, and new article candidates—writes structured reports to outputs/health/ and suggests follow-up questions. Use when the user wants wiki linting, quality audits, data integrity passes, or incremental cleanup aligned with Karpathy-style “health checks”. Chinese triggers 知识库健康检查、wiki 审查、一致性、孤岛、补全、质量报告.
---

# LLM KB — Health Lint

Periodic **lint + CI** for `wiki/`: find inconsistencies, surface missing information (optionally filled via **web search** with explicit provenance), spot weak linkage (“islands”), propose new links and **article candidates**, and archive a **traceable report**. Conceptual match: `wiki/concepts/知识库健康检查.md`.

## When to use

- User asks for a wiki audit, lint, health check, or data-integrity pass.
- User wants missing facts researched on the web **before** editing the wiki.
- User wants **next questions** to investigate (a backlog of follow-ups).

## Scope

1. Read `wiki/index.md`, then sample or read `wiki/concepts/` and `wiki/summaries/` as needed.
2. If the user names a **subset** (e.g. one concept cluster), limit the pass to those files; otherwise default to **wiki-wide** but prioritize high-traffic concepts linked from the index.

## Checklist (run in order)

Copy and track mentally or in the report header:

- [ ] **Consistency** — Same term/concept described differently across files; contradictory claims; stale `updated` vs content.
- [ ] **Completeness** — Missing definitions, empty “Sources”, broken or placeholder wikilinks, summaries without “Related concepts”.
- [ ] **Islands / orphans** — Notes with very few in- or out-links (threshold: treat as suspicious, not auto-delete); suggest concrete `[[...]]` to add.
- [ ] **Connection discovery** — Pairs or clusters that *should* link but do not; one-line rationale each.
- [ ] **Article candidates** — New `concepts/` or `summaries/`-style topics worth adding (title + why + suggested sources).
- [ ] **Follow-up questions** — Ranked list of what a human or the next session should read, verify, or decide.

## Web search and “imputation”

- Use web search **only when** the wiki lacks a fact and the user did not forbid it.
- **Never present imputed web facts as if they came from existing wiki sources.** In the report (and any later wiki edit), tag clearly:
  - **Verified externally** (with URL + date retrieved), or
  - **Hypothesis / needs wiki source** if confidence is low.
- Prefer **editing the wiki** only after the user confirms, unless they asked to apply fixes directly. Default: **report first**, patch second.

## Report output (required)

Write one file under **`outputs/health/`**:

- Filename: `YYYY-MM-DD-health-lint.md` (or append a short slug if multiple runs the same day).

Use this structure:

```markdown
---
type: health-report
created: <YYYY-MM-DD>
scope: <full wiki | list of paths>
---

# LLM KB health report

## Executive summary
- <3–6 bullets: severity, main themes>

## Findings

### Consistency
| Issue | Files | Severity | Suggested fix |
|-------|-------|----------|----------------|

### Completeness & missing data
| Gap | Files | Web? | Notes |
|-----|-------|------|-------|

### Islands / weak linkage
- <note or pattern> — suggested links

### New connections
- [[A]] ↔ [[B]] — <one-line why>

### Article candidates
- **Title** — <rationale>; suggested parent links

## Recommended actions
1. <concrete edit or new file>
2. ...

## Follow-up questions (ask next)
1. <question>
2. ...

## Changelog (if edits were applied)
- <file> — <what changed>
```

## Register the report

Add a line under **`wiki/index.md`** (e.g. new **## Health reports** or **## Maintenance**) pointing to the new note, e.g. `[[outputs/health/2026-04-04-health-lint]]`, so reports compound like other `outputs/`.

## Coordination with other skills

- **llm-kb-compile** — Ingestion from `raw/`; health lint does **not** replace compile. If fixes should become durable “sources”, consider adding or updating `raw/` and re-running compile per user intent.
- **llm-kb-research-file** — Deep dives on a single follow-up question; health lint produces **many** shallow findings + a backlog.

## Quality bar

- Prefer **actionable** findings over generic praise.
- Separate **facts in repo** from **web-sourced** or **speculative** claims.
- Keep the report scannable: tables and short bullets; long prose belongs in a separate exploration note (`outputs/qa/` via llm-kb-research-file).
