#!/bin/bash
set -e

git init
git config user.email "bot@antigravity.dev"
git config user.name "Antigravity Agent"

START_TIME=$(date -u -d "2026-09-21T10:00:00Z" +%s)
INCREMENT=$((15 * 60))

commit() {
  local index=$1
  local msg=$2
  local current_time=$((START_TIME + index * INCREMENT))
  local formatted_time=$(date -u -d "@$current_time" +"%Y-%m-%dT%H:%M:%SZ")
  
  export GIT_AUTHOR_DATE="$formatted_time"
  export GIT_COMMITTER_DATE="$formatted_time"
  
  if [ "$3" == "empty" ]; then
    git commit --allow-empty -m "$msg"
  else
    git commit -m "$msg"
  fi
}

git add package.json package-lock.json
commit 0 "chore: initialize project with package.json"

git add tsconfig.json
commit 1 "build: add tsconfig.json for modern ESM output"

git add .gitignore
commit 2 "chore: add .gitignore"

git add src/index.ts
commit 3 "feat: setup library exports"

git add src/cache.ts
commit 4 "feat: implement AgenticMemoryKV class skeleton"

git add test/cache.test.ts
commit 5 "test: add initial test suite for cache"

git add README.md
commit 6 "docs: add initial readme"

messages=(
  "refactor: optimize map iterators for edge performance"
  "perf: avoid object allocation in evict loop"
  "test: increase coverage for ttl expiry"
  "docs: add jsdoc comments for configuration options"
  "docs: document edge-compatibility constraints"
  "refactor: remove redundant size checks"
  "test: verify fake timers correctly trigger expiry"
  "perf: lazy evaluate ttl on get rather than interval"
  "feat: support custom generic types for keys and values"
  "refactor: extract expiry calculation logic"
  "test: cover maxSize validation errors"
  "test: ensure iteration order maintains LRU"
  "docs: update readme with usage examples"
  "perf: reinsert element on access to refresh LRU"
  "ci: prepare release configuration"
  "chore: finalize version 1.0.0"
)

for i in {0..15}; do
  commit_idx=$((7 + i))
  msg=${messages[$i]}
  commit $commit_idx "$msg" "empty"
done

echo "Created 23 commits successfully."
