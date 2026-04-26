#!/usr/bin/env bash
# install-skills.sh — link each skill in this repo into ~/.workbuddy/skills/
#
# Design:
#   - Per-skill symlinks (NOT a single dir-level symlink) so third-party
#     skills can live alongside these without polluting this git repo.
#   - Idempotent: safe to re-run whenever new skills are added.
#   - Refuses to touch non-symlink entries (so a real third-party skill
#     with the same name is never overwritten).
set -euo pipefail

REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
TARGET_DIR="$HOME/.workbuddy/skills"

if [[ ! -d "$REPO_SKILLS_DIR" ]]; then
  echo "[install-skills] ERROR: $REPO_SKILLS_DIR not found" >&2
  exit 1
fi

# If the target itself is a legacy dir-level symlink, replace it with a real dir.
if [[ -L "$TARGET_DIR" ]]; then
  echo "[install-skills] Replacing legacy dir-symlink $TARGET_DIR with a real directory"
  rm "$TARGET_DIR"
fi
mkdir -p "$TARGET_DIR"

created=0
updated=0
skipped=0

for skill_path in "$REPO_SKILLS_DIR"/*/; do
  name=$(basename "$skill_path")
  link="$TARGET_DIR/$name"

  if [[ -L "$link" ]]; then
    current=$(readlink "$link")
    if [[ "$current" == "$skill_path" || "$current" == "${skill_path%/}" ]]; then
      skipped=$((skipped + 1))
      continue
    fi
    ln -sfn "$skill_path" "$link"
    echo "[install-skills] updated: $name"
    updated=$((updated + 1))
  elif [[ -e "$link" ]]; then
    echo "[install-skills] SKIP $name: $link exists and is not a symlink (third-party skill?)" >&2
    skipped=$((skipped + 1))
  else
    ln -s "$skill_path" "$link"
    echo "[install-skills] linked:  $name"
    created=$((created + 1))
  fi
done

echo "[install-skills] done. created=$created updated=$updated skipped=$skipped"
