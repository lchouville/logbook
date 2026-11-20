#!/usr/bin/env bash
# Sync shared agents/rules from https://github.com/lchouville/MyClaude into
# this project's .claude/agents and .claude/rules. Run automatically by the
# SessionStart hook (see .claude/settings.json); safe to re-run manually.
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
