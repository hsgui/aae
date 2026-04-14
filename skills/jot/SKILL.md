---
name: jot
description: >
  Quick-capture note-taking using the Append-and-Review method (inspired by Karpathy).
  All notes are prepended to a single file ~/notes.md with minimal friction.
  Use when the user wants to jot down a thought, idea, recommendation, todo, quote, link,
  or any snippet worth remembering. Trigger on phrases like "note", "jot down", "记一下",
  "remember this", "add to notes", "append note", "笔记", "记录", or when the user provides
  content with a recognized prefix tag (watch:, listen:, read:, idea:, todo:, quote:, link:,
  learn:, buy:, meeting:, person:, reflect:). Also use when the user asks to review, search,
  or clean up their notes.
---

# Append-and-Review Note

A single-file, append-only note system. Friction is the enemy — capture fast, review later.

## Philosophy

- **One file**: `~/notes.md`. Everything goes here.
- **Prepend, don't append**: New notes go to the TOP. The file is reverse-chronological.
- **Minimal metadata**: Just a timestamp separator. No templates, no frontmatter per note.
- **Prefix tags are optional shortcuts**: `watch:`, `idea:`, `todo:`, etc. Use when natural, skip when not.
- **Review is how notes stay alive**: Old stuff sinks. Good stuff gets pulled back up or merged.
- **Format is enforced by script, not by LLM**: All write operations go through `jot.sh`. Never hand-format entries.

## Script Location

All formatting is handled by the script at:
```
~/.workbuddy/skills/jot/scripts/jot.sh
```

**CRITICAL**: You MUST use this script for ALL write operations. NEVER manually construct note entries or edit `~/notes.md` with replace_in_file / write_to_file for appending notes. The script guarantees format consistency.

## Operations

### 1. Append a Note (default action)

When the user provides something to note down:

1. Determine the content string. Apply prefix tag rules (see below).
2. Run the script:
   ```bash
   ~/.workbuddy/skills/jot/scripts/jot.sh prepend "read: https://example.com"
   ```
3. Confirm to the user that the note was added.

**Content rules (what YOU decide before calling the script):**
- If the user's input starts with a recognized prefix (`watch:`, `idea:`, `todo:`, etc.), keep it as-is.
- If the user says something like "记一下明天要看 XXX", convert naturally to: `watch: XXX`
- Multi-line notes: pass as a single string with `\n` for newlines.
- No extra metadata. No "category:", no "tags:", no YAML blocks.
- All prefixes are treated equally — pure text with checkbox for review tracking.
- **Every note line is automatically prefixed with `- [ ]` (Markdown checkbox)** by the script. This enables review-mode checking. You do NOT need to add checkboxes manually — the script handles it.

**CRITICAL — URL/Link handling:**
- When the user provides a URL, record ONLY the URL with its prefix: `read: <URL>`, `link: <URL>`, `watch: <URL>`.
- **NEVER fetch, visit, summarize, or expand the linked content.**
- **NEVER expand a single URL into multiple lines** (no author, no source, no key ideas).
- If the user explicitly asks "summarize this link", that is a SEPARATE request.

### 2. Review Notes

When the user asks to review or look at their notes:

1. Read `~/notes.md` directly (read_file is fine for reading).
2. Present a summary: total entries, recent entries (last 5-10), and a sense of what's in there.
3. Ask what the user wants to do:
   - **Resurface**: Copy important old notes back to the top with today's date.
   - **Merge**: Combine related entries into one consolidated note.
   - **Prune**: Remove entries that are no longer relevant.
   - **Just browse**: Show more entries if requested.

For resurfacing/merging, use the script to prepend new consolidated entries, then manually remove old ones.

### 3. Search Notes

```bash
~/.workbuddy/skills/jot/scripts/jot.sh search "keyword"
```

Prints all entries containing the keyword.

### 4. Quick Stats

```bash
~/.workbuddy/skills/jot/scripts/jot.sh stats
```

Shows total entries and entries by prefix.

### 5. Initialize File

If `~/notes.md` doesn't exist:

```bash
~/.workbuddy/skills/jot/scripts/jot.sh init
```

Creates the file with Obsidian-compatible frontmatter (`---\n---`).

## Recognized Prefixes

Case-insensitive. User can invent new ones freely:
- `watch:` — movies, shows, videos
- `listen:` — music, podcasts, audiobooks
- `read:` — articles, books, papers
- `idea:` — thoughts, inspirations
- `todo:` — action items
- `fix:` — bugs to fix
- `quote:` — memorable quotes
- `link:` — URLs worth saving
- `learn:` — topics to study
- `buy:` — things to purchase
- `meeting:` — meeting notes
- `person:` — notes about someone
- `reflect:` — reflections, journaling

If the user invents a new prefix (e.g., `recipe:`, `dream:`), just use it. Don't gatekeep.

## Important Constraints

- **ALL writes go through `jot.sh`**. Never manually format entries.
- **Checkbox format is automatic**: The script adds `- [ ]` to every note. During review, users can mark items as `- [x]` to indicate completion.
- NEVER reorganize the file into sections, categories, or separate files unless the user explicitly asks.
- NEVER add metadata beyond the timestamp line.
- NEVER reformat the user's content unless fixing obvious typos they ask about.
- NEVER fetch or summarize URLs/links when adding them as notes.
- The file is the user's stream of consciousness. Respect it.
- If the file gets very large (1000+ entries), suggest a review session but don't force it.
