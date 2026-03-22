# Model Download Audit & Missing Elements

Date: 2026-03-22

## Scope
This audit checks whether ViBo currently documents and validates model download paths for:
- LEAP bundle download flow (current app flow)
- Direct llama model pathing
- Hugging Face model source flow

## What already exists

### ✅ LEAP bundle path (partially implemented)
- Frontend onboarding calls `downloadModel(selectedModel)` using `src/lib/leapClient.ts` wrappers.
- Rust exposes `download_model` command and provider wiring.
- Tauri capabilities include `leap-ai:allow-download-model`.
- Android prompt executor can load local model files once present.

### ✅ Basic model asset note exists
- `assets/models/README.md` documents embedding model artifacts and notes GGUF is downloaded during onboarding.

## Missing elements (gap list)

### 1) Missing source selection for model downloads
There is no explicit UI/backend contract describing **which source** to use per model:
- LEAP bundle registry
- Hugging Face repository
- Local llama-compatible file path

**Needed:** a typed `ModelSource` contract and onboarding selection logic, persisted through backend commands.

### 2) Missing Hugging Face download flow documentation
No docs specify:
- HF repo IDs
- auth token handling location (must stay in keystore/Rust)
- checksum/signature validation expectations
- resume/retry behavior

**Needed:** a dedicated section in API/docs describing backend-only HF transfer + verification.

### 3) Missing llama direct-path ingestion contract
No documented command contract for:
- importing an existing GGUF from device storage
- validation (size/hash/format)
- registration into cached-model index

**Needed:** Rust/Kotlin command spec for "import local model" and corresponding UI state states.

### 4) Missing LEAP bundle manifest requirements doc
Code comments mention bundle-manifest behavior, but no central checklist exists for:
- required manifest keys
- tokenizer/template assumptions
- KV cache settings compatibility

**Needed:** manifest schema checklist in docs tied to supported LEAP runtime version.

### 5) Missing automated regression checks for model-download wiring
Before this change, there was no dedicated script validating model download plumbing across frontend/Rust/capabilities/Android.

**Now added:** `scripts/audit-model-downloads.sh` (wiring checks only).

### 6) Missing progress/error event expectations per source type
No documented event matrix for:
- start/progress/done/error payloads
- source-specific error codes (HF auth, bundle not found, checksum mismatch, storage full)

**Needed:** event contract in docs/API so UI can render deterministic status and recovery steps.

## New test scripts added
- `scripts/audit-frontend-rules.sh` — enforces frontend guardrails (no fetch/axios/localStorage/sessionStorage/optional chaining/nullish in TSX, and no direct Tauri imports in components).
- `scripts/audit-model-downloads.sh` — verifies model-download wiring across wrappers, onboarding, Rust commands/providers, capabilities, and Android loader.

## Suggested next implementation order
1. Add typed backend command contract for `model_source` (`leap_bundle | huggingface | local_llama`).
2. Add backend-only Hugging Face downloader command with keystore token lookup and integrity validation.
3. Add local llama import command + UI path picker hook (Android-safe document provider flow).
4. Standardize stream/event payloads for download lifecycle across all source types.
5. Extend `scripts/audit-model-downloads.sh` with source-specific command checks once commands exist.
