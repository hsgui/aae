---
name: append-note
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

## Note File Location

`~/notes.md` — create if it doesn't exist.

## Operations

### 1. Append a Note (default action)

When the user provides something to note down:

1. Read the current contents of `~/notes.md` (or create it empty if missing).
2. Build the new entry:
   ```
   ---
   YYYY-MM-DD HH:MM

   [content]

   ```
3. Prepend the new entry to the top of the file (above all existing content).
4. Write back to `~/notes.md`.

**Content formatting rules:**
- If the user's input starts with a recognized prefix (`watch:`, `idea:`, `todo:`, etc.), keep it as-is.
- If the user says something like "记一下明天要看 XXX", convert naturally to: `watch: XXX`
- Multi-line notes are fine. Preserve the user's formatting.
- No extra metadata beyond the timestamp. No "category:", no "tags:", no YAML blocks.
- Keep it raw and fast.

**Recognized prefixes** (case-insensitive, user can invent new ones freely):
- `watch:` — movies, shows, videos to watch
- `listen:` — music, podcasts, audiobooks
- `read:` — articles, books, papers
- `idea:` — thoughts, inspirations
- `todo:` — action items
- `quote:` — memorable quotes
- `link:` — URLs worth saving
- `learn:` — topics to study
- `buy:` — things to purchase
- `meeting:` — meeting notes
- `person:` — notes about someone
- `reflect:` — reflections, journaling

If the user invents a new prefix (e.g., `recipe:`, `dream:`), just use it. Don't gatekeep.

### 2. Review Notes

When the user asks to review or look at their notes:

1. Read `~/notes.md`.
2. Present a summary: total entries, recent entries (last 5-10), and a sense of what's in there.
3. Ask what the user wants to do:
   - **Resurface**: Copy important old notes back to the top with today's date.
   - **Merge**: Combine related entries into one consolidated note.
   - **Prune**: Remove entries that are no longer relevant.
   - **Just browse**: Show more entries if requested.

### 3. Search Notes

When the user searches for something in their notes:

1. Read `~/notes.md`.
2. Search by keyword, prefix tag, or date range.
3. Present matching entries with their timestamps.

### 4. Quick Stats

When the user asks for note stats:

1. Count total entries, entries per prefix tag, date range.
2. Show a brief summary.

## Important Constraints

- NEVER reorganize the file into sections, categories, or separate files unless the user explicitly asks.
- NEVER add metadata beyond the timestamp line.
- NEVER reformat the user's content unless fixing obvious typos they ask about.
- The file is the user's stream of consciousness. Respect it.
- If the file gets very large (1000+ entries), suggest a review session but don't force it.
