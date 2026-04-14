#!/usr/bin/env bash
# jot.sh — deterministic note formatting for the jot skill
# Usage:
#   jot.sh prepend "content"  — prepend a note with timestamp
#   jot.sh init               — create ~/notes.md with frontmatter
#   jot.sh search "keyword"   — search notes (prints matching entries)
#   jot.sh stats              — show quick stats
set -euo pipefail

NOTES_FILE="$HOME/notes.md"

# ── helpers ──────────────────────────────────────────────────────────

now() {
  date "+%Y-%m-%d %H:%M"
}

ensure_file() {
  if [[ ! -f "$NOTES_FILE" ]]; then
    printf -- '---\n---\n' > "$NOTES_FILE"
    echo "[jot] Created $NOTES_FILE" >&2
  fi
}

# ── commands ─────────────────────────────────────────────────────────

cmd_init() {
  if [[ -f "$NOTES_FILE" ]]; then
    echo "[jot] $NOTES_FILE already exists, skipping init." >&2
  else
    printf -- '---\n---\n' > "$NOTES_FILE"
    echo "[jot] Created $NOTES_FILE" >&2
  fi
}

cmd_prepend() {
  local content="${1:?Usage: jot.sh prepend \"content\"}"
  ensure_file

  local ts
  ts="$(now)"

  # Build the entry lines (compact: no blank lines, NO leading ---)
  # Prefix each content line with a checkbox for review tracking
  local cb_content
  cb_content="$(printf '%s' "$content" | sed 's/^/- [ ] /')"

  local entry
  entry="${ts}
${cb_content}"

  # Read existing file, split off frontmatter (first 2 lines: ---\n---)
  local head body
  head="$(head -n 2 "$NOTES_FILE")"
  body="$(tail -n +3 "$NOTES_FILE")"

  # Reassemble: frontmatter + new entry + --- separator + existing body
  # The frontmatter's closing --- acts as the separator before the first entry.
  # Between entries we insert an explicit --- separator.
  {
    printf '%s\n' "$head"
    printf '%s\n' "$entry"
    if [[ -n "$body" ]]; then
      printf '%s\n' "---"
      printf '%s\n' "$body"
    fi
  } > "${NOTES_FILE}.tmp"
  mv "${NOTES_FILE}.tmp" "$NOTES_FILE"

  echo "[jot] Note added." >&2
}

cmd_search() {
  local keyword="${1:?Usage: jot.sh search \"keyword\"}"
  ensure_file

  # Print each entry (separated by ---) that contains the keyword
  awk -v kw="$keyword" '
    BEGIN { IGNORECASE = 1; entry = ""; found = 0 }
    /^---$/ {
      if (found && entry != "") print entry
      entry = "---"
      found = 0
      next
    }
    {
      entry = entry "\n" $0
      if (index(tolower($0), tolower(kw)) > 0) found = 1
    }
    END { if (found && entry != "") print entry }
  ' "$NOTES_FILE"
}

cmd_stats() {
  ensure_file

  local total
  total=$(grep -c '^---$' "$NOTES_FILE" 2>/dev/null || echo 0)
  # Subtract 1 for the frontmatter closing ---
  total=$((total > 1 ? total - 1 : 0))

  # Count by prefix tags
  echo "=== jot stats ==="
  echo "Total entries:  $total"
  echo ""
  echo "Entries by prefix:"
  # Extract first word ending with : from content lines (skip --- and date lines)
  tail -n +3 "$NOTES_FILE" | grep -v '^---$' | grep -v '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' | \
    grep -oE '^[a-z]+:' | sort | uniq -c | sort -rn || true
}

# ── main dispatch ────────────────────────────────────────────────────

case "${1:-}" in
  init)    cmd_init ;;
  prepend) shift; cmd_prepend "$@" ;;
  search)  shift; cmd_search "$@" ;;
  stats)   cmd_stats ;;
  *)
    echo "Usage: jot.sh {init|prepend|search|stats} [args...]" >&2
    exit 1
    ;;
esac
