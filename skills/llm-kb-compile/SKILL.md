---
name: llm-kb-compile
description: Incrementally compile a raw/ directory of markdown source files into a structured wiki/ knowledge base. Use when the user wants to build or update a wiki from raw notes, generate concept articles, add backlinks, create summaries, or maintain a personal knowledge base in the style of Karpathy's LLM Knowledge Bases workflow.
---

# LLM KB — Compile

Compiles a `raw/` directory of collected markdown notes/clippings into a structured `wiki/` knowledge base with summaries, concept articles, and cross-linked backlinks.

## Directory structure

```
raw/               ← source files (articles, clippings, notes)
wiki/
├── index.md       ← master index of all wiki articles
├── summaries/     ← one summary per raw/ file
├── concepts/      ← one article per extracted concept
└── meta/
    └── state.json ← tracks processed files (filename → last_modified)
```

## Workflow

Run all 5 phases in order. If only specific raw files changed, run phases 2–5 incrementally (skip unchanged files using `meta/state.json`).

### Phase 0 — Bootstrap

1. Read `wiki/meta/state.json` if it exists (tracks `{ "filename": "iso_timestamp" }` for each processed raw file).
2. List all `.md` files in `raw/` (ignore `_resources/`).
3. Determine which files are **new or modified** vs already processed.

### Phase 1 — Summarize each raw file

For each new/modified raw file:

1. Read the raw file.
2. Write `wiki/summaries/<same-filename>.md` using this template:

```markdown
---
source: raw/<filename>.md
updated: <today's date>
---

# Summary: <title>

## Core ideas
- <bullet per key idea, max 7>

## Key quotes
> <1-3 most important verbatim quotes>

## Related concepts
- [[ConceptA]]
- [[ConceptB]]
```

3. After writing, record the file's modification timestamp in `wiki/meta/state.json`.

### Phase 2 — Extract & update concepts

After summarizing, compile a list of all concepts mentioned across `wiki/summaries/`. Then:

1. Read `wiki/index.md` if it exists to see existing concepts.
2. For each concept (new or updated):
   - Write/update `wiki/concepts/<ConceptName>.md` using the article template (see below).
3. Delete concept files for concepts no longer referenced.

**Concept article template:**

```markdown
---
updated: <today's date>
---

# <Concept Name>

<2-3 sentence definition / overview>

## Key ideas
- <synthesized insight from multiple sources>

## Sources
- [[summaries/file1]] — <one-line relevance note>
- [[summaries/file2]] — <one-line relevance note>

## See also
- [[ConceptX]]
- [[ConceptY]]
```

### Phase 3 — Rebuild the index

Rewrite `wiki/index.md`:

```markdown
---
updated: <today's date>
---

# Wiki Index

## Concepts
- [[concepts/ConceptA]] — <one-line description>
- [[concepts/ConceptB]] — <one-line description>

## Summaries
- [[summaries/file1]] — <source title>
- [[summaries/file2]] — <source title>
```

### Phase 4 — Backlink pass

For every wiki file just written, scan all other wiki files and add/update a `## Backlinks` section at the bottom listing files that link to it. Keep backlinks sorted alphabetically.

---

## Incremental runs

- Only process raw files whose `mtime` is newer than the timestamp in `wiki/meta/state.json`.
- After processing, always re-run Phase 3 (index) and Phase 4 (backlinks) over **all** wiki files—these are cheap and must stay globally consistent.

---

## Quality guidelines

- Summaries: factual, no editorializing, preserve author's intent.
- Concepts: synthesize across sources—do not just copy one summary.
- Obsidian wikilink format: `[[path/to/file]]` (no `.md` extension).
- Keep every file under ~500 words unless the concept is genuinely complex.
- If a raw file has no extractable concepts, still write a summary and skip concept extraction for it.

### Wikilink canonical form (hard rule)

- **Concept links in summaries' `## Related concepts` MUST use the full path `[[concepts/<ConceptName>]]`**, never the short form `[[<ConceptName>]]`. Same for summary-to-summary links (`[[summaries/...]]`).
- `## See also` and `## Sources` sections in concepts follow the same rule for their targets.
- Rationale: Obsidian resolves short links by first-match heuristics; full paths keep cross-repo linting deterministic and avoid regressions when files are renamed.

### `updated` field semantics (hard rule)

- Refresh `updated: <today>` **iff the file's content area changes**—specifically: Key ideas / Core ideas / Sources / See also / Related concepts / body prose. 
- **Do NOT bump `updated` for Backlinks-only changes** (Phase 4 backlink pass). Backlinks are derived metadata and would otherwise flood every compile with noise, defeating the field's purpose as a "last meaningful edit" marker.
- index.md's `updated` always reflects the current compile date.

---

## Additional reference

For detailed prompt templates and examples, see [prompts.md](prompts.md).
