#!/usr/bin/env bash
# Sync shared agents/rules/skills from https://github.com/lchouville/MyClaude
# into this project's .claude/, and keep the project .gitignore in sync so
# none of it is ever committed here (edit shared ones in MyClaude instead).
# Run automatically by the SessionStart hook (see .claude/settings.json);
# safe to re-run manually.
set -euo pipefail

cache="$HOME/.claude-agents-shared"
repo_url="https://github.com/lchouville/MyClaude.git"
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$cache/.git" ]; then
  git -C "$cache" fetch -q origin main
  if [ "$(git -C "$cache" rev-parse HEAD)" != "$(git -C "$cache" rev-parse origin/main)" ]; then
    git -C "$cache" merge -q --ff-only origin/main
  fi
else
  git clone -q "$repo_url" "$cache"
fi

mkdir -p "$dir/agents" "$dir/rules" "$dir/skills"
# agents/ is fully owned by this sync (nothing else lives there): wipe and replace.
rm -f "$dir"/agents/*.md
cp -f "$cache"/agents/*.md "$dir/agents/" 2>/dev/null || true

# rules/ also holds project-specific files, so only remove what a *previous*
# sync put there before copying in what's there now (handles renamed/deleted
# shared rules without touching unrelated project rules).
rules_manifest="$dir/.agents-sync-rules-manifest"
[ -f "$rules_manifest" ] && while IFS= read -r f; do [ -n "$f" ] && rm -f "$dir/rules/$f"; done < "$rules_manifest"
cp -f "$cache"/rules/*.md "$dir/rules/" 2>/dev/null || true
(cd "$cache/rules" 2>/dev/null && printf '%s\n' *.md) > "$rules_manifest" || true

# skills/ also holds project-specific skills (lean-workflow, remplir-journal...),
# so only remove the shared skill folders a *previous* sync put there.
skills_manifest="$dir/.agents-sync-skills-manifest"
[ -f "$skills_manifest" ] && while IFS= read -r s; do [ -n "$s" ] && rm -rf "$dir/skills/$s"; done < "$skills_manifest"
if [ -d "$cache/skills" ]; then
  for s in "$cache"/skills/*/; do
    name="$(basename "$s")"
    rm -rf "$dir/skills/$name"
    cp -rf "$s" "$dir/skills/$name"
  done
  (cd "$cache/skills" && printf '%s\n' */) | sed 's#/$##' > "$skills_manifest"
fi

# Keep the project .gitignore's shared-elements block in sync with what was
# actually just synced, so a newly-shared/unshared rule or skill updates the
# ignore list automatically instead of needing a manual edit.
gitignore_file="$(dirname "$dir")/.gitignore"
block_start="# >>> myclaude-sync: shared agents/rules/skills, never commit (auto-generated) >>>"
block_end="# <<< myclaude-sync <<<"
tmp_gitignore="$(mktemp)"
if [ -f "$gitignore_file" ]; then
  awk -v s="$block_start" -v e="$block_end" '
    $0==s {skip=1; next}
    $0==e {skip=0; next}
    skip!=1 {print}
  ' "$gitignore_file" > "$tmp_gitignore"
fi
{
  cat "$tmp_gitignore"
  echo ""
  echo "$block_start"
  echo ".claude/agents/"
  echo ".claude/.agents-sync-rules-manifest"
  echo ".claude/.agents-sync-skills-manifest"
  [ -f "$rules_manifest" ] && while IFS= read -r f; do [ -n "$f" ] && echo ".claude/rules/$f"; done < "$rules_manifest"
  [ -f "$skills_manifest" ] && while IFS= read -r s; do [ -n "$s" ] && echo ".claude/skills/$s/"; done < "$skills_manifest"
  echo "$block_end"
} > "$gitignore_file"
rm -f "$tmp_gitignore"
