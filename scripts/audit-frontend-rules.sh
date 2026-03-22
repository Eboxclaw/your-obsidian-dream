#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

if rg -n "fetch\(|axios" src --glob "*.tsx" --glob "*.ts"; then
  fail "Forbidden network calls found in frontend source."
else
  pass "No fetch()/axios usage in frontend source."
fi

if rg -n "localStorage|sessionStorage" src --glob "*.tsx" --glob "*.ts"; then
  fail "Forbidden browser storage usage found in frontend source."
else
  pass "No localStorage/sessionStorage usage in frontend source."
fi

if rg -n "\?\." src --glob "*.tsx"; then
  fail "Optional chaining (?.) found in TSX files."
else
  pass "No optional chaining (?.) in TSX files."
fi

if rg -n "\?\?" src --glob "*.tsx"; then
  fail "Nullish coalescing (??) found in TSX files."
else
  pass "No nullish coalescing (??) in TSX files."
fi

if rg -n "@tauri-apps/api/core" src/components --glob "*.tsx"; then
  fail "Direct invoke imports found in components. Use typed wrappers instead."
else
  pass "No direct @tauri-apps/api/core imports in components."
fi

if rg -n "@tauri-apps/api/event" src/components --glob "*.tsx"; then
  fail "Direct listen imports found in components. Use lfm.ts wrappers instead."
else
  pass "No direct @tauri-apps/api/event imports in components."
fi

pass "Frontend rule audit passed."
