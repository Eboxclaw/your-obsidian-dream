## CODEX AUDIT REPORT — 2026-03-22

### SECTION 1 — Rust
1.1 cargo check: FAIL — failed to download crates from crates.io (CONNECT tunnel failed, 403). First error:
`error: failed to get 'java-locator' as a dependency of package 'jni v0.21.1'`.
No `error[E...]` compiler lines were produced because dependency resolution failed before compilation.

1.2 providers_stream: MISSING
- `src-tauri/src/providers.rs`: no `pub async fn providers_stream(...)` found.
- Caller still exists: `src-tauri/src/event_system.rs:200` (`crate::providers::providers_stream(...)`).

1.3 LeapEvent: CANNOT_VERIFY
- Import exists in source (`src-tauri/src/lib.rs:25`) and usage exists (`src-tauri/src/lib.rs:70`), but compile did not reach symbol resolution due dependency fetch failure.

1.4 SQL API — storage.rs: OLD
- Uses `app.state::<DbPool>()` + `db.execute(...)` pattern.

1.4 SQL API — graph.rs: OLD
- Uses `app.state::<DbPool>()` + `db.execute(...)` pattern.

1.4 SQL API — oauth.rs: OLD
- Uses `app.state::<DbPool>()` + `db.execute(...)` pattern.

1.5 select_one usage: PRESENT lines 139, 290, 324 (`src-tauri/src/storage.rs`).

1.6 Cargo.toml versions:
- tauri = `{ version = "2", features = ["protocol-asset"] }`
- tauri-plugin-sql = `{ version = "2", features = ["sqlite"] }`
- tauri-plugin-leap-ai = `{ version = "0.1.1" }` (also target-specific entry with `desktop-embedded-llama`)
- tauri-plugin-fs = `"2"`
- tauri-plugin-http = `"2"`
- tauri-plugin-biometric = `"2"`

### SECTION 2 — Android
2.1 Gradle sync: FAILURE
- Exact command output: `/bin/bash: line 1: ./gradlew: No such file or directory`

2.2 emitToolRequest: EVENT_BUS
- `emitToolRequest` exists (`KoogTauriPlugin.kt:209`).
- Uses `trigger("tool-request", payload)` (`KoogTauriPlugin.kt:226`).
- No direct Rust `invoke(...)` tool dispatch found in this file.

2.3 Map<String,Any>: HAS_MAP_ANY lines 209
- `private suspend fun emitToolRequest(tool: String, args: Map<String, Any>): String`
- `buildJsonObject { ... }` not found in this file.

2.4 ToolRegistry: OLD_REGISTRY line 275
- `toolRegistry = app.tauri.plugin.ToolRegistry(allTools),`
- `ToolRegistry { ... }` DSL not found.

2.5 maxAgentIterations: SET_TO 10
- `agentMaxIterations = 10` at `KoogTauriPlugin.kt:264`.

2.6 PromptExecutor: DOES_NOT
- `LeapPromptExecutor.kt` defines `class LeapPromptExecutor(...)` but does not implement/extend any `PromptExecutor` symbol in this file.

2.7 Permissions:
- android.permission.INTERNET: PRESENT
- android.permission.FOREGROUND_SERVICE: PRESENT
- android.permission.FOREGROUND_SERVICE_DATA_SYNC: PRESENT
- android.permission.USE_BIOMETRIC: PRESENT
- android.permission.POST_NOTIFICATIONS: PRESENT

### SECTION 3 — Frontend
3.1 Forbidden patterns: PARTIAL
- Exact command with `cd /repo` failed: `/bin/bash: line 1: cd: /repo: No such file or directory`.
- Equivalent scans run in repository root:
  - `fetch(`: CLEAN
  - `localStorage`: CLEAN
  - `sessionStorage`: CLEAN
  - `process.env`: CLEAN
  - `localhost`: CLEAN

3.2 Optional chaining: PARTIAL
- Exact command using `--include="*.tsx"` failed in this environment (`rg: unrecognized flag --include`).
- Equivalent scans with `-g "*.tsx"`:
  - `?.`: CLEAN
  - `??`: CLEAN

3.3 BrowserRouter: PRESENT `src/App.tsx:2,16,22`
- It wraps the whole app tree.

3.4 navigate() in store: PRESENT, Link usages: PARTIAL
- navigate in store: PRESENT (`src/lib/store.tsx:137,605`).
- `<Link` usage in `src/components/`: CLEAN.
- `useNavigate` usage in `src/`: CLEAN.
- Additional note: `href=` found in `src/pages/NotFound.tsx:16`.

3.5 ChatAssistant: SHEET_ONLY
- Sheet implementation: `src/components/layout/ChatAssistant.tsx:116-159`.
- Mounted in shell, not as a route: `src/components/layout/AppShell.tsx:125`.

3.6 Vault gating: BOTH
- Local state present: `src/components/views/Notebook.tsx:11` (`unlocked` state).
- Local gate check: `Notebook.tsx:62`.
- Global vault gate exists in app shell: `src/components/layout/AppShell.tsx:114-121`.

3.7 tsc: PARTIAL
- Exact command with `cd /repo` failed: `/bin/bash: line 1: cd: /repo: No such file or directory`.
- Equivalent run in repository root: no TypeScript errors; only npm warning:
  - `npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.`

3.8 src/lib/ files:
- src/lib/types.ts: EXISTS
- src/lib/store.tsx: EXISTS
- src/lib/tauriClient.ts: EXISTS
- src/lib/leapClient.ts: EXISTS
- src/lib/lfm.ts: EXISTS
- src/lib/crypto.ts: EXISTS
- src/lib/utils.ts: EXISTS
- src/lib/models.ts: EXISTS
- src/lib/wiki-links.ts: EXISTS

### SECTION 4 — GitHub Actions
4.1 CI last run: rust-check [MISSING], frontend-check [MISSING], android-check [MISSING]
- Workflow file exists (`.github/workflows/ci.yml`), but run history cannot be queried in this environment (`gh` CLI not installed).

4.2 Release last run: MISSING
- Workflow file exists (`.github/workflows/release.yml`), but run history/tags cannot be queried in this environment (`gh` CLI not installed).

4.3 Audit last run: MISSING
- Workflow file exists (`.github/workflows/audit.yml`), but run history cannot be queried in this environment (`gh` CLI not installed).

### SECTION 5 — Invariants
5.1–5.2 Agent/training files: ABSENT
- `src-tauri/src/agents/`: absent
- `src-tauri/src/training.rs`: absent
- `src-tauri/src/mcp_server.rs`: absent

5.3 allow-export-conversation: ABSENT (correct)
- Not present in permissions array (only mentioned in comment).

5.4 leap-ai:default wildcard: ABSENT (correct)
- Not present in permissions array (only mentioned in description/comment).

5.5 runBlocking: FOUND (comments only)
- `android/app/src/main/kotlin/com/vibo/app/AgentForegroundService.kt:13,72`
- `android/app/src/main/kotlin/com/vibo/app/AgentWorker.kt:94`

5.6 API keys in env/Kotlin: CLEAN
- No `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, or `api_key =` matches under `android/`.
- No `process.env.` matches under `src/`.

### BLOCKERS FOR NEXT INSTRUCTION SET
- Rust compile cannot proceed (`cargo check`) due dependency fetch/network 403.
- `providers_stream` function missing in `src-tauri/src/providers.rs` while called from `event_system.rs`.
- Android gradle wrapper missing for requested command (`android/gradlew` absent).
- Koog plugin still uses event-bus dispatch (`emitToolRequest` + `trigger`) instead of direct invoke.
- `agentMaxIterations` configured to 10 (>5 rule).
- `LeapPromptExecutor` does not implement PromptExecutor in current source.
- BrowserRouter wraps full app (`src/App.tsx`) despite store-based navigation requirement.
