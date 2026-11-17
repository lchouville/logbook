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

mkdir -p "$dir/agents" "$dir/rules"
cp -f "$cache"/agents/*.md "$dir/agents/" 2>/dev/null || true
cp -f "$cache"/rules/*.md "$dir/rules/" 2>/dev/null || true
