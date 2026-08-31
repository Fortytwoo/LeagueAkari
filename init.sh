#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

echo "=== League Akari harness verification ==="

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required." >&2
  exit 1
}
command -v yarn >/dev/null 2>&1 || {
  echo "Yarn 4 is required." >&2
  exit 1
}

echo "=== yarn install --immutable --mode=skip-build ==="
yarn install --immutable --mode=skip-build

echo "=== yarn typecheck ==="
yarn typecheck

echo "=== yarn test ==="
yarn test

echo "=== Verification complete ==="
echo "Next steps: read feature_list.json, work on one feature at a time, and record evidence."
