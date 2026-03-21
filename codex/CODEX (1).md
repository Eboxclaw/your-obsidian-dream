# CODEX.md — ViBo AI Assistant Guide
# Read this file first. Every time. No exceptions.
# Version: March 2026

---

## What Is ViBo

ViBo is a privacy-first, sovereign AI notebook OS.
It is a Tauri v2 cross-platform app: macOS first, Android second, iOS Phase 4.
It has a React/TSX frontend, Rust core, and a Kotlin agent layer (Koog + LEAP).
All AI inference is local and on-device. No data leaves the device unscrubbed.

---

## Current Repo State

The repo root contains all source files dumped flat. They are NOT wired
into a buildable Tauri project yet. The job is scaffolding them into the
correct structure described below, then fixing compile errors.

STATUS per file category:
  CORRECT, do not rewrite: notes.rs, kanban.rs, vault.rs, scheduler.rs,
    sri.rs, event_system.rs, google.rs, providers.rs, LeapPromptExecutor.kt,
    AgentForegroundService (1).kt, AgentWorker.kt, EmbeddingPlugin (1).kt,
    MainActivity.kt, build.gradle (1).kts, config.toml, types (1).ts,
    store (4).tsx, crypto (2).ts, lfm (2).ts, leapClient.ts, tauriClient.ts,
    tailwind.config.ts, default (2).json, tauri.conf.json, build.rs

  NEEDS DB API FIX (tauri-plugin-sql 2.x): storage.rs, graph.rs, oauth.rs

  NEEDS KOTLIN FIX (serialization + ToolRegistry API): KoogTauriPlugin.kt

  DELETE: default.json (has leap-ai:default wildcard - forbidden)
  DELETE: AgentForegroundService.kt (no async cleanup - ANR risk)
  USE INSTEAD: AgentForegroundService (1).kt (has async cleanup, correct)

  MISSING: src/worker.ts (Cloudflare SPA entrypoint, referenced by wrangler.jsonc)

---

## Target Directory Structure

Every file below must end up in its listed path.
Files that are missing are marked [CREATE STUB].
Files that exist at root are marked [MOVE FROM ROOT].

```
vibo/                                        <- repo root
|
+-- CODEX.md                                 [THIS FILE - stays at root]
+-- README.md                                [stays at root]
+-- VIBO_ROADMAP_FINAL_0000.md               [stays at root]
+-- .gitignore                               [stays at root]
+-- package.json                             [stays at root]
+-- package-lock.json                        [stays at root]
+-- bun.lock                                 [stays at root]
+-- tailwind.config.ts                       [stays at root]
+-- vite.config.ts                           [stays at root]
+-- tsconfig.json                            [stays at root]
+-- tsconfig.app.json                        [stays at root]
+-- tsconfig.node.json                       [stays at root]
+-- index.html                               [stays at root]
+-- components.json                          [stays at root]
+-- eslint.config.js                         [stays at root]
+-- postcss.config.js                        [stays at root]
+-- wrangler.jsonc                           [stays at root]
+-- playwright.config.ts                     [stays at root]
+-- playwright-fixture.ts                    [stays at root]
+-- vitest.config.ts                         [stays at root]
|
+-- src/                                     <- React TSX frontend
|   +-- main.tsx                             [already in src/ - verify]
|   +-- App.tsx                              [already in src/ - verify]
|   +-- App.css                              [already in src/ - verify]
|   +-- index.css                            [already in src/ - verify]
|   +-- worker.ts                            [MISSING - CREATE STUB]
|   |
|   +-- lib/
|   |   +-- types.ts                         [MOVE: types (1).ts -> src/lib/types.ts]
|   |   +-- store.tsx                        [MOVE: store (4).tsx -> src/lib/store.tsx]
|   |   +-- tauriClient.ts                   [MOVE: tauriClient.ts -> src/lib/tauriClient.ts]
|   |   +-- leapClient.ts                    [MOVE: leapClient.ts -> src/lib/leapClient.ts]
|   |   +-- lfm.ts                           [MOVE: lfm (2).ts -> src/lib/lfm.ts]
|   |   +-- crypto.ts                        [MOVE: crypto (2).ts -> src/lib/crypto.ts]
|   |   +-- utils.ts                         [CREATE STUB if missing]
|   |   +-- wiki-links.ts                    [CREATE STUB if missing]
|   |   +-- models.ts                        [CREATE STUB if missing]
|   |
|   +-- hooks/
|   |   +-- use-mobile.tsx                   [already in src/ - verify]
|   |   +-- use-toast.ts                     [already in src/ - verify]
|   |
|   +-- pages/
|   |   +-- Index.tsx                        [MOVE: Index page lovable.tsx -> src/pages/Index.tsx]
|   |
|   +-- components/
|       +-- ui/                              [shadcn - already in src/ - verify]
|       +-- DashboardView.tsx                [already in src/ - verify]
|       +-- NotebookView.tsx                 [already in src/ - verify]
|       +-- KanbanView.tsx                   [already in src/ - verify]
|       +-- KnowledgeGraph.tsx               [already in src/ - verify]
|       +-- AgentsView.tsx                   [already in src/ - verify]
|       +-- ChatAssistant.tsx                [already in src/ - verify]
|       +-- SettingsView.tsx                 [already in src/ - verify]
|       +-- CommandPalette.tsx               [already in src/ - verify]
|       +-- BottomNav.tsx                    [already in src/ - verify]
|       +-- NewNoteDialog.tsx                [already in src/ - verify]
|       +-- LockScreen.tsx                   [already in src/ - verify]
|       +-- OnboardingWizard.tsx             [already in src/ - verify]
|       +-- AppSidebar.tsx                   [already in src/ - verify]
|       +-- NavLink.tsx                      [already in src/ - verify]
|       +-- settings/
|           +-- CloudProvidersSection.tsx    [already in src/ - verify]
|           +-- LocalModelsSection.tsx       [already in src/ - verify]
|
+-- src-tauri/                               <- Tauri/Rust layer
|   +-- Cargo.toml                           [MOVE: Cargo.toml -> src-tauri/Cargo.toml]
|   +-- build.rs                             [MOVE: build.rs -> src-tauri/build.rs]
|   +-- tauri.conf.json                      [MOVE: tauri.conf.json -> src-tauri/tauri.conf.json]
|   |
|   +-- .cargo/
|   |   +-- config.toml                      [MOVE: config.toml -> src-tauri/.cargo/config.toml]
|   |
|   +-- capabilities/
|   |   +-- default.json                     [MOVE: default (2).json -> src-tauri/capabilities/default.json]
|   |                                         NOTE: this is default (2).json NOT default.json
|   |                                         default.json (wildcard version) must be DELETED
|   |
|   +-- icons/                               [CREATE EMPTY DIR - Tauri requires it]
|   |   +-- .gitkeep                         [CREATE]
|   |
|   +-- src/
|       +-- main.rs                          [MOVE: main (2).rs -> src-tauri/src/main.rs]
|       +-- notes.rs                         [MOVE: notes.rs -> src-tauri/src/notes.rs]
|       +-- kanban.rs                        [MOVE: kanban (1).rs -> src-tauri/src/kanban.rs]
|       +-- storage.rs                       [MOVE: storage.rs -> src-tauri/src/storage.rs]
|       |                                     THEN FIX: tauri-plugin-sql 2.x DB API
|       +-- vault.rs                         [MOVE: vault.rs -> src-tauri/src/vault.rs]
|       +-- graph.rs                         [MOVE: graph.rs -> src-tauri/src/graph.rs]
|       |                                     THEN FIX: tauri-plugin-sql 2.x DB API
|       +-- sri.rs                           [MOVE: sri.rs -> src-tauri/src/sri.rs]
|       +-- event_system.rs                  [MOVE: event_system.rs -> src-tauri/src/event_system.rs]
|       +-- scheduler.rs                     [MOVE: scheduler.rs -> src-tauri/src/scheduler.rs]
|       +-- providers.rs                     [MOVE: providers.rs -> src-tauri/src/providers.rs]
|       |                                     THEN FIX: tauri-plugin-sql 2.x DB API
|       +-- google.rs                        [MOVE: google.rs -> src-tauri/src/google.rs]
|       +-- oauth.rs                         [MOVE: oauth.rs -> src-tauri/src/oauth.rs]
|                                             THEN FIX: tauri-plugin-sql 2.x DB API
|
+-- android/                                 <- Android project (tauri android init)
|   +-- app/
|       +-- build.gradle.kts                 [MOVE: build.gradle (1).kts -> android/app/build.gradle.kts]
|       +-- proguard-rules.pro               [CREATE STUB]
|       +-- src/
|           +-- main/
|               +-- AndroidManifest.xml      [MOVE: AndroidManifest (1).xml -> android/app/src/main/AndroidManifest.xml]
|               +-- assets/
|               |   +-- models/
|               |       +-- .gitkeep         [CREATE - ONNX files go here at build time]
|               +-- kotlin/com/vibo/app/
|                   +-- MainActivity.kt      [MOVE: MainActivity.kt]
|                   +-- KoogTauriPlugin.kt   [MOVE: KoogTauriPlugin.kt]
|                   |                         THEN FIX: serialization + ToolRegistry API
|                   +-- LeapPromptExecutor.kt [MOVE: LeapPromptExecutor (3).kt]
|                   +-- EmbeddingPlugin.kt   [MOVE: EmbeddingPlugin (1).kt]
|                   +-- AgentForegroundService.kt [MOVE: AgentForegroundService (1).kt]
|                   |                              USE (1) version - NOT the plain version
|                   +-- AgentWorker.kt       [MOVE: AgentWorker.kt]
|
+-- ios/                                     <- iOS project (Phase 4 - stub only now)
|   +-- .gitkeep                             [CREATE - reserve the directory]
|
+-- assets/
|   +-- roles/
|   |   +-- default.md                       [CREATE STUB]
|   |   +-- researcher.md                    [CREATE STUB]
|   |   +-- writer.md                        [CREATE STUB]
|   |   +-- project_manager.md               [CREATE STUB]
|   |   +-- developer.md                     [CREATE STUB]
|   |   +-- analyst.md                       [CREATE STUB]
|   +-- models/
|       +-- .gitkeep                         [CREATE - ONNX model files go here]
|       +-- README.md                        [CREATE STUB - explains what goes here]
|
+-- docs/
    +-- CODEX.md                             [COPY of this file]
    +-- ARCHITECTURE.md                      [CREATE STUB]
    +-- API.md                               [CREATE STUB]
    +-- AGENTS.md                            [CREATE STUB]
```

---

## Git Commands to Reorganize

Run these in order from the repo root.
Do NOT run all at once. Check after each block.

### Block 1: Create directories

```bash
mkdir -p src-tauri/src
mkdir -p src-tauri/.cargo
mkdir -p src-tauri/capabilities
mkdir -p src-tauri/icons
mkdir -p android/app/src/main/kotlin/com/vibo/app
mkdir -p android/app/src/main/assets/models
mkdir -p ios
mkdir -p assets/roles
mkdir -p assets/models
mkdir -p docs
mkdir -p src/lib
mkdir -p src/pages
mkdir -p src/hooks
```

### Block 2: Move Rust files into src-tauri/src/

```bash
git mv main\ \(2\).rs       src-tauri/src/main.rs
git mv notes.rs              src-tauri/src/notes.rs
git mv kanban\ \(1\).rs     src-tauri/src/kanban.rs
git mv storage.rs            src-tauri/src/storage.rs
git mv vault.rs              src-tauri/src/vault.rs
git mv graph.rs              src-tauri/src/graph.rs
git mv sri.rs                src-tauri/src/sri.rs
git mv event_system.rs       src-tauri/src/event_system.rs
git mv scheduler.rs          src-tauri/src/scheduler.rs
git mv providers.rs          src-tauri/src/providers.rs
git mv google.rs             src-tauri/src/google.rs
git mv oauth.rs              src-tauri/src/oauth.rs
```

### Block 3: Move Tauri config files

```bash
git mv Cargo.toml            src-tauri/Cargo.toml
git mv build.rs              src-tauri/build.rs
git mv tauri.conf.json       src-tauri/tauri.conf.json
git mv config.toml           src-tauri/.cargo/config.toml
git mv default\ \(2\).json  src-tauri/capabilities/default.json
```

### Block 4: Delete the bad files

```bash
git rm default.json
git rm AgentForegroundService.kt
```

### Block 5: Move Android files

```bash
git mv build.gradle\ \(1\).kts          android/app/build.gradle.kts
git mv AndroidManifest\ \(1\).xml       android/app/src/main/AndroidManifest.xml
git mv MainActivity.kt                  android/app/src/main/kotlin/com/vibo/app/MainActivity.kt
git mv KoogTauriPlugin.kt               android/app/src/main/kotlin/com/vibo/app/KoogTauriPlugin.kt
git mv LeapPromptExecutor\ \(3\).kt     android/app/src/main/kotlin/com/vibo/app/LeapPromptExecutor.kt
git mv EmbeddingPlugin\ \(1\).kt        android/app/src/main/kotlin/com/vibo/app/EmbeddingPlugin.kt
git mv AgentForegroundService\ \(1\).kt android/app/src/main/kotlin/com/vibo/app/AgentForegroundService.kt
git mv AgentWorker.kt                   android/app/src/main/kotlin/com/vibo/app/AgentWorker.kt
```

### Block 6: Move frontend files

```bash
git mv types\ \(1\).ts         src/lib/types.ts
git mv store\ \(4\).tsx         src/lib/store.tsx
git mv tauriClient.ts           src/lib/tauriClient.ts
git mv leapClient.ts            src/lib/leapClient.ts
git mv lfm\ \(2\).ts            src/lib/lfm.ts
git mv crypto\ \(2\).ts         src/lib/crypto.ts
git mv Index\ page\ lovable.tsx src/pages/Index.tsx
```

### Block 7: Create missing stub files

```bash
touch ios/.gitkeep
touch src-tauri/icons/.gitkeep
touch assets/models/.gitkeep
echo "# ONNX model files go here.\n# all-MiniLM-L6-v2.onnx (22MB) - download from HuggingFace\n# tokenizer.json\n# special_tokens_map.json\n# LFM2-350M-Extract.gguf is NOT bundled - downloaded at onboarding via plugin" > assets/models/README.md
```

---

## Files That Still Need Fixes After Moving

These files are structurally correct but have compile errors.
Fix AFTER the directory scaffold is complete and verified.

### 1. storage.rs, graph.rs, oauth.rs, providers.rs
**Problem:** All use `app.state::<DbPool>()` and call `.execute()` / `.select()`
directly on the pool. tauri-plugin-sql 2.x API changed.

**Correct pattern:**
```rust
use tauri_plugin_sql::Database;

// At init time, open the DB:
let db = Database::get(&app, "sqlite:vibo.db").await
    .map_err(|e| e.to_string())?;

// Execute (mutations):
db.execute("INSERT INTO ...", vec![JsonValue::String("val".into())])
    .await.map_err(|e| e.to_string())?;

// Select (queries):
let rows = db.select("SELECT * FROM ...", vec![])
    .await.map_err(|e| e.to_string())?;
// rows is Vec<HashMap<String, JsonValue>>
```

**Files to rewrite DB layer in:**
- src-tauri/src/storage.rs (all 12 db.execute / db.select calls)
- src-tauri/src/graph.rs (all db calls)
- src-tauri/src/oauth.rs (all db calls)
- src-tauri/src/providers.rs (keystore db calls)

### 2. KoogTauriPlugin.kt
**Problem A (BUG 4):** `emitToolRequest()` uses `Map<String, Any>` with
kotlinx serialization. `Any` is not Serializable. Will not compile.

**Fix:**
```kotlin
private suspend fun emitToolRequest(tool: String, args: Map<String, Any>): String {
    val jsonArgs = buildJsonObject {
        args.forEach { (k, v) -> put(k, JsonPrimitive(v.toString())) }
    }
    // use jsonArgs directly, do not call encodeToString on Map<String, Any>
}
```

**Problem B (BUG 5):** `app.tauri.plugin.ToolRegistry` does not exist in Koog 0.5.x.
Koog's AIAgent builder takes tools as a list, not a ToolRegistry.

**Fix:**
```kotlin
val agent = AIAgent(
    promptExecutor = leapExecutor,
    toolRegistry = ToolRegistry { tools(noteReadTool, noteCreateTool, ...) },
    // OR depending on exact 0.5.x API - check koog-agents source
)
```

**Problem C (BUG 7 resolved):** The current emitToolRequest uses trigger/listen
event bus. Per architecture decision: Koog tools must call Rust via direct
invoke() ONLY. The event bus path in emitToolRequest must be replaced with
direct plugin.invoke() calls for each tool.

### 3. src/pages/Index.tsx (was Index page lovable.tsx)
**Problem:** Contains `localStorage.getItem("zettel-notes")` in handleUnlock().
This is a migration remnant. localStorage is forbidden per hard constraints.

**Fix:** Remove the localStorage block entirely. If vault is empty, return [].
```tsx
// DELETE this entire block:
// const raw = localStorage.getItem("zettel-notes")
// const notes = raw ? JSON.parse(raw) : []
// setInitialNotes(notes)
// localStorage.removeItem("zettel-notes")

// REPLACE WITH:
setInitialNotes([])
```

---

## Communication Patterns (never deviate)

```
TSX -> Rust:               invoke('command_name', args)           via tauriClient.ts
TSX -> Leap (chat only):   invoke('plugin:leap-ai|generate')      via leapClient.ts
Rust -> TSX (local):       app.emit('leap-ai:token', token)
Rust -> TSX (cloud):       app.emit('llm-delta' / 'llm-done' / 'llm-error')
Koog -> Leap (agent):      LeapPromptExecutor.execute()           in-process Kotlin
Koog tool -> Rust:         plugin.invoke("command", args)         direct, NO event bus
Rust internal:             event_system.rs                        job dispatch only
Background jobs:           AgentWorker.kt via WorkManager
```

---

## Hard Constraints (never break any of these)

```
Android min SDK:            API 31
Model format:               GGUF only
Model quantization:         Q4_K_M only on mobile
Koog loop limit:            maxAgentIterations = 5
API keys:                   vault SQLite only - never TSX, never Kotlin, never env
All cloud HTTP:             through Rust providers.rs only
Vector storage:             tauri-plugin-velesdb (NOT sqlite-vec)
Tor:                        Arti crate in providers.rs Phase 3 only
TSX syntax:                 NO ?. or ?? - use ternary and && only
localStorage:               FORBIDDEN in all TSX files
fetch() / axios:            FORBIDDEN in all TSX files
runBlocking:                FORBIDDEN in all Kotlin files
navigate():                 from Zustand store only - never Link or href
ChatAssistant:              Sheet only - never a nav route
leap-ai:default wildcard:   FORBIDDEN in capabilities
leap-ai:allow-export-conv:  Phase 5 only - do not add before
mcp_server.rs:              Phase 6 only - do not create before
training.rs:                Phase 5 only - do not create before
event bus for tool calls:   FORBIDDEN - tools use direct invoke() only
```

---

## Phase Status

```
Phase 1 - Android MVP:   IN PROGRESS
  Scaffold:              PENDING (this reorganization)
  Rust data layer:       WRITTEN, needs DB API fix
  Android agent layer:   WRITTEN, needs KoogTauriPlugin fix
  Frontend:              WRITTEN, needs Index.tsx localStorage fix
  Onboarding:            STUB
  Build target:          macOS first, then Android

Phase 2 - Agents:        NOT STARTED - do not implement agents yet
Phase 3 - Cloud/Privacy: NOT STARTED - do not add Arti yet
Phase 4 - iOS/Desktop:   NOT STARTED - ios/ dir is stub only
Phase 5 - Distillation:  NOT STARTED
Phase 6 - Ecosystem/MCP: NOT STARTED
```

---

## Open Questions (contact Liquid AI, non-blocking)

1. Is kv_cache_type=q4_0 baked into the LFM2-350M-Extract bundle manifest?
2. What does LEAP mobile runtime default to for KV cache on 3GB devices?
3. Can two ModelRunners be loaded simultaneously, or must one unload first?
4. Are both LFM models available on leap.liquid.ai/models?
5. Is LeapModelAdapter available in koog-core 0.1.0 or needs separate artifact?

---

## After Reorganization: Verification Checklist

```
[ ] git status shows no untracked files at root (except the ones that belong there)
[ ] src-tauri/src/ has all .rs files
[ ] src-tauri/Cargo.toml exists
[ ] src-tauri/build.rs exists
[ ] src-tauri/tauri.conf.json exists
[ ] src-tauri/.cargo/config.toml exists
[ ] src-tauri/capabilities/default.json is the (2) version (explicit permissions)
[ ] android/app/src/main/AndroidManifest.xml exists
[ ] android/app/src/main/kotlin/com/vibo/app/ has all .kt files
[ ] android/app/build.gradle.kts exists
[ ] src/lib/ has types.ts, store.tsx, tauriClient.ts, leapClient.ts, lfm.ts, crypto.ts
[ ] src/pages/Index.tsx exists
[ ] src/worker.ts exists
[ ] default.json (root, wildcard version) is DELETED
[ ] AgentForegroundService.kt (root, no-cleanup version) is DELETED
[ ] cd src-tauri && cargo check   <- run this, fix all errors before anything else
```

---

ViBo CODEX v1 - March 2026
Tauri v2 / Android-first / macOS dev target
LEAP 0.1.1 + Koog 0.5.x + LeapPromptExecutor
