# ViBo Final Architecture and Roadmap
Version 5 - March 2026 - Merged from V2 + V4 with corrections applied

---

## Core Architecture Principle

Koog has a `PromptExecutor` abstract interface with `execute()` and
`executeStreaming()` methods. You can implement it with any backend.

This means:
- Write `LeapPromptExecutor : PromptExecutor`
- It wraps `tauri-plugin-leap-ai` calls internally
- Koog uses Leap as a native provider, same as OpenAI or Anthropic
- Leap and Koog are unified in one Kotlin plugin
- No event bus needed for model calls - it is all in-process Kotlin

Koog tools call Rust directly via plugin invoke(). No event bus for tool
calls. event_system.rs exists only for internal Rust job dispatch.

---

## What Is Confirmed

| Fact | Source |
|---|---|
| tauri-plugin-leap-ai is a real Rust crate on crates.io | docs.rs/crate/tauri-plugin-leap-ai/0.1.1 |
| It has android/ and ios/ folders, handles native bridges | docs.rs source tree |
| Desktop uses llama-cpp-2 as optional feature | Cargo.toml deps |
| Koog PromptExecutor is implementable with any backend | docs.koog.ai |
| Koog has built-in PII log redaction | brightcoding.dev audit |
| Koog has AIAgentService for multi-agent management | koog releases 0.5.0 |
| Koog has persistence and checkpointing (survives Android kill) | JetBrains blog |
| Koog supports Ollama natively (desktop fallback) | docs.koog.ai/llm-providers |
| Koog maxAgentIterations controls loop runaway | docs.koog.ai |
| LFM2-350M-Extract is optimized for tool use | liquid4all/cookbook |
| Koog Android target added in recent release | koog releases |

---

## Stack

```
React TSX (Tauri WebView / Android System WebView / V8)
  └─ invoke() / listen()   [via tauriClient.ts and leapClient.ts]
      └─ Rust Core (src-tauri/src/)
          │  storage.rs   vault.rs    notes.rs    kanban.rs
          │  graph.rs     sri.rs      providers.rs
          │  event_system.rs          (internal Rust job dispatch ONLY)
          │  scheduler.rs google.rs   oauth.rs
          │
          ├─ tauri-plugin-leap-ai     Kotlin Tauri plugin. NOT a sidecar. NOT a spawned process.
          │     KoogTauriPlugin.kt    @TauriPlugin - AIAgentService + all agents + all tools
          │     LeapPromptExecutor.kt implements PromptExecutor, wraps tauri-plugin-leap-ai
          │     EmbeddingPlugin.kt    ONNX all-MiniLM-L6-v2
          │     AgentForegroundService.kt  user-initiated tasks >15s ONLY
          │     AgentWorker.kt        WorkManager - all background-triggered tasks
          │
          ├─ tauri-plugin-velesdb     vector store (ONLY vector store)
          ├─ tauri-plugin-sql         SQLite
          ├─ tauri-plugin-fs
          ├─ tauri-plugin-http
          └─ tauri-plugin-biometric
```

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|  React TSX (Tauri WebView)                                       |
|  NoteEditor  Kanban  Graph  Agents  Chat  Settings               |
|                                                                  |
|  invoke('note_create', ...)           notes/vault                |
|  invoke('plugin:leap-ai|generate')    direct chat UI only        |
|  listen('leap-ai:token', ...)         streaming UI tokens        |
|  invoke('sri_route', prompt)          SRI before agents          |
+------------------------------+-----------------------------------+
                               | Tauri IPC
+------------------------------v-----------------------------------+
|  Rust Core - security gatekeeper, data, routing                  |
|                                                                  |
|  notes.rs     kanban.rs     storage.rs    vault.rs               |
|  graph.rs     sri.rs        providers.rs  google.rs              |
|  oauth.rs     scheduler.rs                                       |
|  event_system.rs  (internal job dispatch ONLY - not tool calls)  |
+---------------------------+------------------+-------------------+
                            |                  |
            Official plugins|                  | Direct plugin invoke()
                            |                  | (tool calls only - NO event bus)
+--------------------------v-+  +--------------v------------------+
|  tauri-plugin-leap-ai      |  |  KoogTauriPlugin.kt             |
|  (official Liquid AI)      |  |  @TauriPlugin                   |
|                            |  |                                 |
|  Exposes to Rust/TSX:      |  |  LeapPromptExecutor.kt          |
|  download_model            |  |  implements PromptExecutor      |
|  load_model                |  |  wraps tauri-plugin-leap-ai     |
|  generate (streaming)      |  |  Koog uses Leap natively        |
|  create_conversation       |  |                                 |
|  unload_model              |  |  AIAgentService                 |
|                            |  |  manages all running agents     |
|  Mobile: Leap SDK KMP      |  |                                 |
|  Desktop: llama-cpp-2      |  |  Agents (all via Leap):         |
|                            |  |  ResearchAgent                  |
|  tauri-plugin-velesdb      |  |  TaggerAgent                    |
|  vector store              |  |  SummaryAgent                   |
|  knowledge graph           |  |  PlannerAgent                   |
|  70us search               |  |                                 |
|  BM25 + vector hybrid      |  |  Tools call Rust directly:      |
|                            |  |  tool.invoke("note_get", args)  |
|  tauri-plugin-biometric    |  |  NO trigger/emit event bus      |
|  tauri-plugin-sql          |  |                                 |
|  tauri-plugin-fs           |  |  AgentForegroundService.kt      |
|  tauri-plugin-http         |  |  tasks >15s only                |
+----------------------------+  |                                 |
                                |  AgentWorker.kt                 |
                                |  WorkManager background jobs    |
                                |  DailyMaintenance, SyncRequest  |
                                |                                 |
                                |  Cloud fallback via Koog        |
                                |  MultiLLMPromptExecutor:        |
                                |  Leap local -> Rust providers.rs|
                                |  -> Anthropic/OpenRouter/Kimi   |
                                +---------------------------------+
```

---

## Rules That Never Change

1. All network calls go through Rust - no exceptions, ever
2. API keys never in Kotlin or TSX - Rust keystore only
3. Leap called via LeapPromptExecutor inside Koog - unified model layer
4. Koog tools call Rust directly via plugin invoke() - NO event bus for tool calls
5. event_system.rs is for internal Rust job dispatch only (NoteCreated, DailyMaint, etc.)
6. Agent memory routes through Rust storage.rs - not Koog's own SQLite
7. Vectors live in velesdb - not sqlite-vec, not raw SQLite
8. Encrypted notes = vault.rs / Normal notes = notes.rs - never mixed
9. Model format = GGUF
10. Tor = Arti crate inside providers.rs - no binary sidecar (Phase 3)
11. ForegroundService = only tasks >15s
12. Background scheduled tasks = AgentWorker.kt via WorkManager
13. Koog loop limit = maxAgentIterations = 5 (mobile RAM constraint)
14. Conversation history serialized via LeapJson to vault SQLite between sessions

---

## Communication Patterns

```
TSX -> Rust:                   invoke('command_name', args)
TSX -> Leap (chat UI):         invoke('plugin:leap-ai|generate', args)
Rust -> TSX (local stream):    app.emit('leap-ai:token', token)
Rust -> TSX (cloud stream):    app.emit('llm-delta', token)
                               app.emit('llm-done')
                               app.emit('llm-error', error)

Koog -> Leap (agent model):    LeapPromptExecutor.execute(prompt)
                               [direct Kotlin call, in-process, no IPC]

Koog tool -> Rust:             plugin.invoke("note_get", args)
                               [direct invoke - no trigger/emit event bus]

Rust internal job dispatch:    event_system.rs emits to scheduler.rs
                               NoteCreated -> enqueue embed job
                               NoteEdited -> re-embed job
                               KanbanMoved -> calendar check
                               UserPrompt -> SRI -> Koog
                               DailyMaintenance -> distillation run
                               SyncRequest -> google sync

Background jobs:               AgentWorker.kt (WorkManager)
                               DailyMaintenance, SyncRequest

Koog cloud escalation:         MultiLLMPromptExecutor
                               -> LeapPromptExecutor (local first)
                               -> invoke('providers_stream', ...) if RAM < 500MB
                               -> Rust providers.rs -> Tor -> cloud API
                               -> emits llm-delta / llm-done / llm-error to TSX
```

---

## Models

| Model | Size | Purpose | When |
|---|---|---|---|
| LFM2-350M-Extract | ~350MB | Agent tool use, structured output | Phase 1 default |
| LFM2-1.2B-Extract | ~1.2GB | Better reasoning, upgrade path | Phase 2+ |
| all-MiniLM-L6-v2 | 22MB | Embeddings, SRI | Phase 1, bundled in APK |
| Anthropic / OpenRouter / Kimi | - | Cloud escalation, opt-in only | Phase 3 |

---

## Complete File List

```
vibo/
|
+-- package.json
+-- tailwind.config.ts
+-- vite.config.ts
+-- tsconfig.json
+-- tsconfig.app.json
+-- tsconfig.node.json
+-- index.html
+-- components.json
+-- CODEX.md                         AI assistant guide
+-- README.md
|
+-- src/                             React TSX frontend
|   +-- main.tsx
|   +-- App.tsx                      route switching, auth gate
|   +-- App.css
|   +-- index.css
|   |
|   +-- lib/
|   |   +-- types.ts                 Note, Card, Agent, Provider types
|   |   |                            AppRoute is type not interface
|   |   |                            Mirrors every Rust struct exactly
|   |   +-- store.tsx                Zustand - invoke() only, no localStorage
|   |   |                            Slices: vault, notes, kanban, agent, google, ui
|   |   |                            navigate() exported here - never use Link or href
|   |   +-- tauriClient.ts           typed invoke() wrappers for Rust commands
|   |   +-- leapClient.ts            typed wrappers for plugin:leap-ai commands
|   |   |                            runtimeInfo, downloadModel, loadModel
|   |   |                            agentProcess, agentStream, stopGeneration, embed
|   |   +-- lfm.ts                   listen() to streaming events only - no fetch
|   |   |                            useStream(onChunk, onDone, onError)
|   |   |                            listenToProviderStream(onChunk, onDone, onError)
|   |   |                            listenToAgentEvents(onEvent)
|   |   |                            listenToDownloadProgress(onProgress)
|   |   |                            all listeners return unlisten functions
|   |   +-- crypto.ts                invoke() wrappers for vault ops only - no frontend AES
|   |   |                            vaultInit, unlockWithPin, unlockWithBiometric
|   |   |                            vaultLock, vaultStatus
|   |   |                            keystoreSet, keystoreGet
|   |   |                            requireUnlocked() - throws if vault not unlocked
|   |   +-- wiki-links.ts            pure MD parser
|   |   +-- models.ts                provider config types
|   |   +-- utils.ts
|   |
|   +-- hooks/
|   |   +-- use-mobile.tsx
|   |   +-- use-toast.ts
|   |
|   +-- components/
|       +-- ui/                      shadcn - all as-is
|       +-- NoteEditor.tsx           MD editor + wikilinks
|       +-- NotebookView.tsx         note list + SRI search
|       +-- KanbanView.tsx           boards from .md files
|       +-- KnowledgeGraph.tsx       from velesdb graph data
|       +-- AgentsView.tsx           agent status + task queue
|       +-- ChatAssistant.tsx        streaming via leapClient.ts
|       |                            SHEET only - never a nav route
|       +-- DashboardView.tsx
|       +-- LockScreen.tsx           biometric / PIN unlock
|       +-- OnboardingWizard.tsx     PIN + model download + ONNX unpack
|       +-- SettingsView.tsx         providers, Tor, accounts
|       +-- CommandPalette.tsx
|       +-- AppSidebar.tsx
|       +-- BottomNav.tsx
|       +-- NavLink.tsx
|       +-- NewNoteDialog.tsx
|       +-- settings/
|           +-- CloudProvidersSection.tsx
|           +-- LocalModelsSection.tsx
|
+-- src-tauri/
|   +-- Cargo.toml
|   +-- build.rs
|   +-- tauri.conf.json              Android + iOS + desktop targets
|   +-- capabilities/
|   |   +-- default.json
|   |
|   +-- src/
|       +-- main.rs                  plugin init + command registration
|       |
|       +-- notes.rs                 MD CRUD, wikilinks, backlinks,
|       |                            frontmatter, daily notes, snapshots,
|       |                            search, tags, orphans
|       |                            22 commands - Obsidian compatible
|       |
|       +-- kanban.rs                boards as .md
|       |                            each card = task.md
|       |                            columns, move, subtasks, calendar links
|       |                            16 commands
|       |
|       +-- storage.rs               SQLite via tauri-plugin-sql:
|       |                            notes_index
|       |                            kanban_index
|       |                            routing_signals
|       |                            semantic_cache
|       |                            agent_memory  <- Koog memory lives here
|       |                            distillations
|       |                            vectors live in velesdb NOT here
|       |
|       +-- vault.rs                 AES-256-GCM encrypted notes
|       |                            Argon2id key derivation
|       |                            #[cfg(target_os="android")] -> 15MB
|       |                            #[cfg(not(target_os="android"))] -> 64MB
|       |                            biometric unlock via plugin
|       |                            key zeroed from memory on vault_lock()
|       |
|       +-- graph.rs                 wikilink edge index, feeds velesdb
|       |
|       +-- sri.rs                   Semantic Routing Intelligence:
|       |                            1. routing_signals regex    ~1ms
|       |                            2. semantic_cache lookup    ~5ms
|       |                            3. velesdb vector search   ~70us
|       |                            returns SriDecision {
|       |                              action, confidence,
|       |                              can_parallelize,
|       |                              escalate_cloud
|       |                            }
|       |
|       +-- event_system.rs          INTERNAL RUST JOB DISPATCH ONLY
|       |                            NOT used for Koog tool calls
|       |                            Event enum + dispatcher:
|       |                            NoteCreated  -> embed + tag jobs
|       |                            NoteEdited   -> re-embed job
|       |                            KanbanMoved  -> calendar check
|       |                            UserPrompt   -> SRI -> Koog
|       |                            DailyMaint.  -> distillation run
|       |                            SyncRequest  -> google sync
|       |
|       +-- scheduler.rs             Priority queue:
|       |                            HIGH / MEDIUM / LOW / IDLE
|       |                            enforces task time limits
|       |                            Android Doze safe
|       |                            delegates to WorkManager via Kotlin side
|       |
|       +-- providers.rs             Anthropic, OpenRouter, Kimi, Ollama
|       |                            streaming SSE
|       |                            PII scrubber before cloud calls
|       |                            Arti crate for Tor (Phase 3 only)
|       |                            API keys from vault SQLite only
|       |                            sole HTTP exit point for the entire app
|       |
|       +-- google.rs                Calendar read/write
|       |                            Gmail read-only
|       |                            Drive read-only
|       |                            Direct API - no MCP
|       |
|       +-- oauth.rs                 OAuth2 tokens in encrypted SQLite
|                                    refresh logic, scope management
|                                    Google (Phase 1)
|                                    Proton (Phase 3)
|                                    iCloud (Phase 4)
|
+-- android/
|   +-- app/src/main/
|       +-- AndroidManifest.xml      permissions:
|       |                            INTERNET
|       |                            FOREGROUND_SERVICE
|       |                            FOREGROUND_SERVICE_DATA_SYNC
|       |                            USE_BIOMETRIC
|       |                            USE_FINGERPRINT
|       |                            POST_NOTIFICATIONS
|       |
|       +-- kotlin/com/vibo/app/
|           |
|           +-- MainActivity.kt      extends TauriActivity
|           |                        registers KoogTauriPlugin
|           |                        registers EmbeddingPlugin
|           |
|           +-- KoogTauriPlugin.kt   @TauriPlugin
|           |                        instantiates LeapPromptExecutor
|           |                        instantiates AIAgentService
|           |                        registers all Koog agents and tools
|           |                        all tools call Rust via direct invoke()
|           |                        starts/stops AgentForegroundService
|           |                        starts/stops AgentWorker jobs
|           |
|           +-- LeapPromptExecutor.kt  implements PromptExecutor
|           |                          execute() -> plugin:leap-ai|generate
|           |                          executeStreaming() -> LeapEvent stream
|           |                          Koog uses Leap as native provider
|           |
|           +-- AgentForegroundService.kt
|           |                          Android Service for tasks >15s only
|           |                          START_STICKY
|           |                          PRIORITY_LOW notification
|           |                          explicit STOP_SERVICE action
|           |                          CoroutineScope(SupervisorJob() + Dispatchers.IO)
|           |                          never runBlocking
|           |
|           +-- AgentWorker.kt         WorkManager for all background-triggered tasks
|           |                          Jobs: DailyMaintenance, SyncRequest
|           |                          Emits result back to TSX via Tauri event on completion
|           |                          never runBlocking
|           |
|           +-- EmbeddingPlugin.kt     ONNX Runtime + all-MiniLM-L6-v2
|                                      copy APK assets to context.filesDir on init
|                                      WordPiece tokenizer, mean pooling, L2 norm
|                                      embed_text -> 384 floats
|                                      embed_batch -> bulk vault indexing
|                                      result -> velesdb via invoke()
|
+-- assets/
|   +-- roles/
|   |   +-- default.md               General assistant, Zettelkasten note template
|   |   +-- researcher.md            Hypothesis -> findings -> open questions
|   |   +-- writer.md                Audience -> argument -> outline -> draft
|   |   +-- project_manager.md       Context -> options -> decision -> follow-up
|   |   +-- developer.md             ADR format: context -> options -> decision
|   |   +-- analyst.md               Question -> data -> findings -> caveats
|   |
|   +-- models/
|       +-- all-MiniLM-L6-v2.onnx    22MB - download HuggingFace before build
|       +-- tokenizer.json
|       +-- special_tokens_map.json
|       NOTE: LFM2-350M-Extract.gguf downloaded at onboarding via plugin
|             not bundled in APK
|
+-- docs/
    +-- CODEX.md                     AI assistant guide
    +-- ARCHITECTURE.md
    +-- API.md                       all Tauri command signatures
    +-- AGENTS.md                    agent types, tools, escalation rules
```

---

## Cargo.toml

```toml
[dependencies]
tauri                  = { version = "^2.10", features = ["protocol-asset"] }
tauri-plugin-leap-ai   = "0.1.1"
tauri-plugin-velesdb   = "0.1.0"
tauri-plugin-sql       = { version = "^2", features = ["sqlite"] }
tauri-plugin-fs        = "^2"
tauri-plugin-http      = "^2"
tauri-plugin-biometric = "^2"
serde                  = { version = "^1.0", features = ["derive"] }
serde_json             = "^1.0"
tokio                  = { version = "^1", features = ["full"] }
aes-gcm                = "^0.10"
argon2                 = "^0.5"
reqwest                = { version = "^0.12", features = ["json", "stream"] }

# Phase 3 only - do NOT add before Phase 3:
# arti-client           = "^0.23"
# tor-rtcompat          = "^0.23"
```

---

## Plugin Capabilities (default.json)

Never use leap-ai:default wildcard.

```json
[
  "leap-ai:allow-runtime-info",
  "leap-ai:allow-download-model",
  "leap-ai:allow-load-model",
  "leap-ai:allow-load-cached-model",
  "leap-ai:allow-list-cached-models",
  "leap-ai:allow-remove-cached-model",
  "leap-ai:allow-unload-model",
  "leap-ai:allow-create-conversation",
  "leap-ai:allow-create-conversation-from-history",
  "leap-ai:allow-generate",
  "leap-ai:allow-stop-generation",
  "tauri-plugin-sql:default",
  "tauri-plugin-fs:default",
  "tauri-plugin-http:default",
  "tauri-plugin-biometric:default"
]
```

leap-ai:allow-export-conversation - Phase 5 ONLY. Do not add before then.

---

## Agent Types (Phase 2)

Do not implement agents before Phase 2.

| Agent | Trigger | Tools used |
|---|---|---|
| ResearchAgent | Manual or scheduled | sri_route, note_get, note_create |
| TaggerAgent | On note save | ModelOrchestrator.extractJson(), note_save |
| SummaryAgent | On note save / manual | note_get, extractJson(), note_save |
| PlannerAgent | Manual | kanban_board_get, kanban_card_create, calendar_events_list |

All agents run inside KoogTauriPlugin.kt via AIAgentService.
All agents use LeapPromptExecutor as the model backend.
All tool calls are direct Kotlin invoke() to Rust - no event bus.
maxAgentIterations = 5 for all agents.
Conversation history serialized via LeapJson to vault SQLite between sessions.

---

## Phase 1 - Android MVP

Deliverable: Notes + Kanban + Biometrics + Local LFM + SRI + Google

```
STEP 1 - Scaffold
  tauri init (React/Vite)
  Cargo.toml with all Phase 1 deps (pinned versions)
  tauri.conf.json - Android target, permissions
  capabilities/default.json
  android/app/build.gradle.kts - Koog + ONNX deps
  AndroidManifest.xml - all permissions
  .cargo/config.toml with 16KB page alignment for all Android targets

STEP 2 - Rust data layer
  storage.rs     SQLite schema: notes, kanban, agent_memory, distillations, graph_edges, vault_meta
  vault.rs       AES-256-GCM + Argon2id, mobile/desktop #[cfg] params
  notes.rs       full Obsidian-compatible MD CRUD
  kanban.rs      board + task.md per card
  graph.rs       wikilink edges -> velesdb

STEP 3 - Register in main.rs
  All note_* commands
  All kanban_* commands
  All storage_* commands
  All vault_* commands
  tauri_plugin_leap_ai::init()
  tauri_plugin_velesdb::init()
  tauri_plugin_biometric::init()
  tauri_plugin_sql::Builder::default().build()

STEP 4 - Frontend data layer
  types.ts          mirrors every Rust struct exactly
  tauriClient.ts    typed invoke() wrappers
  leapClient.ts     typed plugin:leap-ai wrappers
  store.tsx         Zustand, invoke() only, no localStorage
  lfm.ts            listen() to streaming events only
  crypto.ts         vault invoke wrappers + requireUnlocked()

STEP 5 - SRI + vectors
  sri.rs             3-step routing pipeline
  event_system.rs    NoteCreated -> enqueue embed job (internal dispatch only)
  scheduler.rs       priority queue
  EmbeddingPlugin.kt ONNX + APK-to-filesDir unpack

STEP 6 - Android agent layer
  LeapPromptExecutor.kt     implements PromptExecutor wrapping leap plugin
  KoogTauriPlugin.kt        @TauriPlugin - AIAgentService + all tools via direct invoke()
  AgentForegroundService.kt tasks >15s only
  AgentWorker.kt            WorkManager for background jobs
  MainActivity.kt           register KoogTauriPlugin + EmbeddingPlugin

STEP 7 - Onboarding (real calls, no mocks)
  OnboardingWizard.tsx:
    PIN setup       -> invoke('vault_init', { pin })
    ONNX check      -> EmbeddingPlugin filesDir check on load()
    LFM download    -> invoke('plugin:leap-ai|download_model', { model })
    Google OAuth    -> invoke('oauth_start', { provider: 'google' })

STEP 8 - Lock screen
  LockScreen.tsx -> tauri-plugin-biometric
  vault.rs unlock on success
  App state gated behind auth

STEP 9 - Google integration
  google.rs       Calendar R/W + Gmail read + Drive read
  oauth.rs        encrypted token storage + refresh
  SettingsView    Google login flow end-to-end

STEP 10 - Build and test
  cargo check
  tauri android build
  Physical device: Android API 31+, 3GB+ RAM
  Test: note create -> embed -> SRI search -> retrieve
  Test: agent task -> ForegroundService -> complete -> stop
  Test: vault lock -> biometric -> unlock
  Test: Google calendar read via agent tool
```

### Phase 1 Gate Criteria

- App installs and runs on Android API 31+ device
- Onboarding completes end-to-end (all steps)
- Model downloads (Q4_K_M) and loads via LeapPromptExecutor
- PIN vault locks/unlocks correctly
- Note CRUD works (create, edit, search, delete)
- Kanban board works (columns, cards, drag-and-drop)
- Chat streams tokens from local LLM to UI via Koog + LeapPromptExecutor
- Cloud fallback streams via providers.rs (Anthropic minimum)
- EmbeddingPlugin produces 384-dim vectors

---

## Phase 2 - Agents End-to-End

- All Koog agents live (Research, Tagger, Summary, Planner)
- AIAgentService managing concurrent agents
- Agent memory persists via storage.rs agent_memory table
- Koog checkpointing tested (kill app mid-task, confirm resume)
- Kanban <-> Calendar sync via agent
- All tool calls confirmed as direct invoke() - no event bus regression

### Phase 2 Gate Criteria

- All 4 agent types run end-to-end
- Koog checkpointing verified (kill + resume)
- Agent memory persists in storage.rs across sessions
- TaggerAgent tags notes via jsonSchemaConstraint on primary model
- Concurrent agents do not crash RAM
- maxAgentIterations = 5 enforced for all agents

---

## Phase 3 - Cloud + Privacy

- Arti crate in providers.rs (replace reqwest direct for cloud calls)
- PII scrubber pipeline before all cloud calls in Rust
- MultiLLMPromptExecutor in Koog: Leap local -> cloud fallback (opt-in only)
- All provider API keys via vault SQLite
- Proton Calendar + Mail OAuth (read-only)

### Privacy latency messages (shown in TSX during intentional waits)

- "Scrubbing personal data..." during PII scrub (5-20ms)
- "Routing privately..." during Tor circuit setup (2-5s first connection)
- "Thinking locally..." during local LLM inference
- "Downloading model..." during model download progress

### Phase 3 Gate Criteria

- Cloud requests route through Tor (verify with tcpdump: no plaintext DNS)
- PII scrubber strips test PII before egress
- Fallback triggers correctly when RAM < 500MB
- Fallback is opt-in only - never automatic without user consent
- UI shows correct privacy latency messages

---

## Phase 4 - iOS + Desktop

- iOS: tauri-plugin-leap-ai has ios/ folder - verify and test before starting
- LeapPlugin.swift implementing same interface as Kotlin side
- BGTaskScheduler for iOS background tasks (WorkManager equivalent)
- tauri ios init and test on simulator first
- Desktop: tauri-plugin-leap-ai uses llama-cpp-2 feature flag
- Ollama as desktop fallback when llama-cpp-2 unavailable
- iCloud Calendar read via OAuth
- Argon2id params: 64MB for desktop (already #[cfg] gated in vault.rs)

### Phase 4 Gate Criteria

- iOS app installs and onboards on real device
- Desktop app runs on macOS and Windows
- All Phase 1 features work on all 3 platforms

---

## Phase 5 - Knowledge and Training

- Knowledge distillation UI (distillations table -> MD export)
- Add leap-ai:allow-export-conversation to default.json (FIRST TIME)
- training.rs written for the first time here (forbidden before Phase 5)
- Unsloth fine-tuning pipeline
- LFM2-350M-Extract -> LFM2-1.2B-Extract upgrade path (4GB+ devices, explicit user action)

### Phase 5 Gate Criteria

- Distillations browsable and exportable
- Model upgrade flow works on 4GB device
- No regression on 3GB devices

---

## Phase 6 - Ecosystem

- QLoRA / skills marketplace
- MCP integrations:
  - Public services (no auth) -> Koog MCP client directly
  - Auth services -> local tool -> direct invoke() -> Rust
- Community plugin system
- mcp_server.rs written for the first time here (forbidden before Phase 6)

---

## Files NOT To Write (unless specified per phase)

| File | Why |
|---|---|
| event_system.rs for tool calls | Koog tools call Rust directly via invoke() |
| TauriIpc.kt | no event bus for tool calls |
| agent_runtime.rs | Koog + AIAgentService is the runtime |
| model_manager.rs | plugin manages lifecycle |
| agents/*.rs (any Rust agent file) | agents are Kotlin/Koog |
| LeapPromptExecutor.kt (old pattern) | use new PromptExecutor impl |
| NoteTool.kt / KanbanTool.kt as separate files | tools are methods in KoogTauriPlugin.kt |
| core/crypto.rs / core/storage.rs | duplicates of vault.rs and storage.rs |
| mcp_server.rs | Phase 6 only |
| training.rs | Phase 5 only |
| leap-ai:allow-export-conversation in default.json | Phase 5 only |

---

## Hard Constraints - Never Break

```
Android min SDK:          API 31
Android target SDK:       API 36
Android min RAM:          3GB+ (LFM inference)
LFM model format:         GGUF
Default agent model:      LFM2-350M-Extract (tool use optimized)
Model quantization:       Q4_K_M only - never Q8 or F16 on mobile
ONNX files:               copy APK assets -> context.filesDir before ONNX loads
Argon2id params:          15MB mobile / 64MB desktop - #[cfg] enforced
ForegroundService:        only tasks >15s
Background jobs:          AgentWorker.kt via WorkManager only
Koog loop limit:          maxAgentIterations = 5
Koog memory:              direct invoke() to storage.rs agent_memory table
Conversation history:     serialized via LeapJson to vault SQLite between sessions
Leap model download:      via plugin invoke - not manual HTTP
All cloud HTTP calls:     through Rust providers.rs - never Kotlin directly
Vector storage:           tauri-plugin-velesdb - not sqlite-vec
Tor:                      Arti crate in providers.rs Phase 3 - never binary sidecar
TSX syntax:               no ?. optional chaining, no ?? nullish coalescing
                          use ternary expressions and && guards only
API keys:                 vault SQLite via keystore_get only
                          never in TSX, never in Kotlin, never in env vars
navigate():               exported from Zustand store - never use Link or href
ChatAssistant:            Sheet only - never a nav route
runBlocking:              forbidden in all Kotlin files
fetch() / axios:          forbidden in all TSX files
localStorage:             forbidden in all TSX files
```

---

## TSX Frontend Checklist (per component before marking complete)

- No fetch() or axios - use invoke() via tauriClient.ts
- No localStorage or sessionStorage
- No hardcoded mock data
- Vault-gated content checks vaultStatus.unlocked before rendering
- All API keys via keystoreGet / keystoreSet
- Local streaming via useStream (leap-ai:token)
- Cloud streaming via listenToProviderStream (llm-delta / llm-done / llm-error)
- navigate() from store - not Link or href
- All invoke() calls have error handling (Rust Err(String) must not fail silently)
- All listeners call unlisten on component unmount
- No ?. or ?? syntax anywhere
- ChatAssistant is a Sheet, never a nav route

---

## Open Items (Contact Liquid AI)

1. Is kv_cache_type=q4_0 baked into the LFM2-350M-Extract bundle manifest?
2. What does the LEAP mobile runtime default to for KV cache on 3GB devices?
3. Can two ModelRunners be loaded simultaneously, or must one unload first?
4. Are both LFM models available on leap.liquid.ai/models for download via LeapModelDownloader?
5. Is LeapModelAdapter available in koog-core 0.1.0, or is a separate koog-leap artifact required?
   (If confirmed available, replace LeapPromptExecutor with official LeapModelAdapter)

These are monitoring items - not blocking Phase 1.

---

ViBo Roadmap V5 - Tauri v2, Android-first, No Sidecars
LEAP SDK 0.1.1 + Koog 0.5.0 + LeapPromptExecutor (self-implemented PromptExecutor)
