---
name: llm-kb-research-file
description: Researches answers by reading wiki/index.md and linked articles (lightweight index-first navigation, not RAG-by-default), writes Obsidian-friendly artifacts (Markdown reports, Marp decks, matplotlib figures), and files outputs into the wiki so every query compounds the knowledge base. Use when the user asks complex questions against this wiki, wants answers as saved files/slides/charts for Obsidian, or wants Q&A/explorations archived back into the KB (Karpathy-style “queries always add up”). Chinese triggers 对知识库提问、问答沉淀、输出写入 wiki、Marp、matplotlib、Obsidian 归档.
---

# LLM KB — Research, Artifact, and File-Back

This workflow pairs with the project’s **llm-kb-compile** skill: `raw/` → compiled `wiki/` for **ingested** sources; this skill handles **agent explorations** that should **persist as first-class files** in the vault and appear in navigation (aligned with `wiki/concepts/问答沉淀.md`).

## When to use this skill

- User asks a multi-step or cross-cutting question that requires reading several wiki pages.
- User wants the answer **as files** (not only chat): Markdown notes, Marp slides, or figures.
- User cares about **filing**: outputs must be linked from the wiki so future sessions find them via `wiki/index.md` and wikilinks.

## Research strategy (medium-sized wikis)

1. Start from `wiki/index.md` — scan Concepts and Summaries; open the smallest set of pages that obviously matter.
2. Follow `[[wikilinks]]` and “See also” / “Sources”; broaden only if gaps appear.
3. Prefer **targeted search** (grep/list) over reading the whole tree unless the user asks for a global audit.
4. Do **not** assume RAG or embeddings are required at this scale; escalate to heavier retrieval only if the user asks or the wiki is huge and sparse.

## Output locations (vault root)

Artifacts live under **`outputs/`** at the **vault root** (same level as `wiki/` and `raw/`), distinct from compiled `wiki/summaries/` and `wiki/concepts/`. This matches the “问答沉淀” convention: material in `outputs/qa/` is real accumulated knowledge, not chat exhaust.

| Kind | Directory | Notes |
|------|-----------|--------|
| Q&A / research notes | `outputs/qa/` | One file per thread or per distinct question |
| Marp slides | `outputs/slides/` | Marp front matter (`marp: true`); preview via Obsidian Marp plugin |
| Figures | `outputs/figures/` | PNG/SVG; embed with paths relative to the referencing note |

Use **kebab-case or short slugs** in filenames; prefix with `YYYY-MM-DD-` when it helps sorting.

## Q&A note template (required for `outputs/qa/`)

```markdown
---
type: exploration
topic: <short label>
created: <YYYY-MM-DD>
sources:
  - "[[concepts/SomeConcept]]"
  - "[[summaries/SomeSummary]]"
---

# Q: <question as asked>

## TL;DR
<3–6 bullets or one tight paragraph>

## Answer
<structured reasoning; link evidence with wikilinks>

## Evidence
- [[path/to/page]] — <why it matters>

## Uncertainties / follow-ups
- <what was weak, missing, or needs verification>

## Related
- [[concepts/...]]
```

## Marp and figures

- **Marp**: keep decks self-contained under `outputs/slides/`; link the deck from the matching Q&A file (or vice versa).
- **matplotlib** (or other generators): write image under `outputs/figures/`; reference it from Markdown with a **relative** path so Obsidian resolves it.

## Multi-turn accumulation (non-negotiable)

A single Q&A session often spans multiple user messages — the initial question, follow-up clarifications, deep-dives, corrections. **Every turn that produces substantive new content must be written back to the same output file**, not just answered in chat.

- If a follow-up belongs to the **same topic** as an existing `outputs/qa/` file, **append** the new content to that file (e.g. add a new subsection, expand an existing section, or mark an uncertainty as resolved).
- Only create a **new** Q&A file when the follow-up is clearly a **distinct topic** that deserves its own page.
- Update `## Uncertainties / follow-ups` to reflect which open questions have been addressed and which new ones emerged.

Rationale: chat messages are ephemeral and invisible to future sessions. If the insight isn't in the file, it doesn't exist.

## File-back (non-negotiable)

Finishing the answer in chat is **not** enough. Before closing the task:

1. **Write** the artifact(s) under `outputs/...` on disk.
2. **Register** the work in `wiki/index.md`:
   - Add or extend a section such as **## Explorations** (or **## Outputs**) with a one-line wikilink and description pointing to each new file (e.g. `[[outputs/qa/2026-04-04-topic]]` from vault root).
3. **Connect** to the graph:
   - Add `## Related` / `See also` links from the new note to relevant `concepts/*` and `summaries/*`.
   - If the exploration **defines or stabilizes a reusable idea**, add or **update** a `wiki/concepts/*.md` stub (or fold the insight into an existing concept) and link it from `wiki/index.md` **Concepts** when appropriate.
4. **Backlinks**: If this repo’s convention is a `## Backlinks` section on wiki pages, update backlinks on pages you touched (same spirit as llm-kb-compile Phase 4).

## Optional: promote to `raw/`

If the user wants a **source-of-truth clipping** that should flow through the compile pipeline, add a distilled note under `raw/` and run **llm-kb-compile** afterward. Default for explorations is **stay in `outputs/`** unless the user asks to promote.

## Coordination with llm-kb-compile

- **llm-kb-compile** ingests `raw/` → `summaries/`, `concepts/`, `index.md`.
- **This skill** adds **human/agent explorations** under `outputs/` and **extends `wiki/index.md`** manually—no compile step required for those files.

## Conceptual anchor

See `wiki/concepts/问答沉淀.md` for the “queries add up” rationale.
