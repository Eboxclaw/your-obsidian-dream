#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

missing=0
check_required() {
  local pattern="$1"
  local path="$2"
  local label="$3"
  if rg -n "$pattern" "$path" >/dev/null 2>&1; then
    echo "✅ $label"
  else
    echo "❌ $label"
    missing=1
  fi
}

echo "Running model download wiring audit..."

check_required "export async function downloadModel" "src/lib/leapClient.ts" "leapClient exposes downloadModel wrapper"
check_required "downloadModel\(" "src/components/onboarding/OnboardingWizard.tsx" "OnboardingWizard triggers downloadModel"
check_required "download_model" "src-tauri/src/commands/mod.rs" "Rust command export includes download_model"
check_required "pub async fn download_model" "src-tauri/src/providers.rs" "Rust provider wiring includes download_model"
check_required "leap-ai:allow-download-model" "src-tauri/capabilities/default.json" "Capability file allows model download"
check_required "loadModel\(" "android/app/src/main/kotlin/com/vibo/app/LeapPromptExecutor.kt" "Android prompt executor can load model"

if [ "$missing" -ne 0 ]; then
  echo "❌ Model download audit failed. Missing required wiring."
  exit 1
fi

echo "✅ Model download wiring audit passed."
