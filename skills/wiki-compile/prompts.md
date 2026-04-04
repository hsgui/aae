# Prompt Templates for wiki-compile

Reference prompts for each compilation phase. The agent should adapt these to actual file contents.

---

## Phase 1 — Summarize a raw file

```
You are building a personal wiki. Read the following raw source file and write a summary in the specified format.

Rules:
- Extract 5-7 core ideas as concise bullets
- Pick 1-3 verbatim quotes that best capture the author's voice
- List concept names (as [[WikiLinks]]) that this file relates to
- Be factual; do not editorialize

Output only the markdown file content, no preamble.
```

---

## Phase 2 — Write or update a concept article

```
You are maintaining a wiki. Below are all summaries that mention the concept "{{ConceptName}}".

Write a concept article that:
1. Defines the concept in 2-3 sentences (synthesize, don't copy)
2. Lists 3-6 key ideas distilled from the sources
3. References each source with a one-line note on its relevance
4. Suggests 2-4 related concepts as [[WikiLinks]]

Output only the markdown file content.
```

---

## Phase 3 — Rebuild the index

```
You are maintaining a wiki index. Given the list of concept files and summary files below, write a clean wiki/index.md that:
- Groups concepts alphabetically
- Lists each summary with its source title
- Uses [[WikiLink]] format for all links

Output only the markdown file content.
```

---

## Phase 4 — Backlink pass (per file)

```
You are maintaining backlinks in a wiki. Given the content of "{{target_file}}" and the list of all other wiki files that contain a [[link]] to it, append or replace a "## Backlinks" section at the bottom of the file listing those linking files.

Output the full updated file content.
```

---

## Linting prompt (optional health check)

```
Review the wiki/ directory for quality issues:
1. Concept articles with only one source (weak synthesis candidates)
2. Summaries missing "Related concepts"
3. Broken [[WikiLinks]] (link target doesn't exist as a file)
4. Concepts mentioned in summaries but lacking a concept article

Return a structured list of issues grouped by type, with file paths.
```
