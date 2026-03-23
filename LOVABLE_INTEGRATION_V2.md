# ViBo — Lovable Integration Guide (Visual Reference Edition)
_Written against the actual UI screenshots — March 2026_

---

## What I Can See In Your UI

From all 13 screenshots:

| Screen | Status |
|---|---|
| Onboarding 5-step wizard | ✅ Built, needs wiring |
| Lock screen / PIN setup | ✅ Built, needs wiring |
| Dashboard (Home) | ✅ Built, needs wiring |
| NotebookView | ✅ Built, needs wiring |
| KanbanView (Tasks) | ✅ Built, needs wiring |
| Settings (Appearance, Encryption, Local Models, Cloud Providers, Data) | ✅ Built, needs wiring |
| New Note / Task dialog | ✅ Built, needs wiring |
| Chat ("Ask assistant..." bottom bar) | ✅ Built, needs wiring |

---

## Critical Mismatches to Fix First

These are differences between what the UI shows and what the backend expects.
Fix these BEFORE any wiring, or everything will break.

---

### Mismatch 1 — Model names

**UI shows:** LFM 2.5 Instruct, LFM 2.5 Thinking, LFM 2.5 Vision, LFM 2.5 Audio, LFM 2.5 Japanese

**Backend expects:** GGUF model identifiers passed to `plugin:leap-ai|download_model`

**Fix:** In `OnboardingWizard.tsx`, add a mapping object at the top of the file:

```ts
const MODEL_MAP: Record<string, string> = {
  'LFM 2.5 Instruct':  'LFM2-1.2B-Instruct',
  'LFM 2.5 Thinking':  'LFM2-1.2B-Thinking',
  'LFM 2.5 Vision':    'LFM2-1.2B-Vision',
  'LFM 2.5 Audio':     'LFM2-1.2B-Audio',
  'LFM 2.5 Japanese':  'LFM2-1.2B-JA',
}
// When user selects a model, pass MODEL_MAP[selectedModel] to the download call
```

Keep the display names as-is in the UI. Only translate when calling Leap.

---

### Mismatch 2 — MiniMax provider

**UI shows:** MiniMax card in Cloud Providers settings with `eyJ...` API key

**Backend (`providers.rs`):** Only handles `anthropic`, `openrouter`, `kimi`, `ollama`

**Fix:** In `providers.rs` `providers_stream()`, add:
```rust
"minimax" => stream_openai_compat(&app, clean_messages, api_key,
    "https://api.minimax.chat/v1", model).await,
```
Tell Lovable: MiniMax uses OpenAI-compatible format, add it to the provider list.
Until the Rust side is updated, the MiniMax save/delete UI can work — but
`providers_test()` will return false. Show a "not yet active" state rather than an error.

---

### Mismatch 3 — Exo Labs integration

**UI shows:** "Exo Labs — Distributed inference mesh" toggle in onboarding Step 3

**Backend:** No Exo Labs handler exists yet

**Fix:** Keep the toggle in the UI. Wire it to `keystoreSet('exo_labs_enabled', 'true')`.
When toggled on, show "Coming soon" toast. Do not call any invoke that doesn't exist.

---

### Mismatch 4 — "Ask assistant..." is not a separate view

**UI shows:** A bottom bar input `Ask assistant...` always visible on the dashboard,
NOT a dedicated tab in the bottom nav.

**Backend:** `providers_stream` and `useStream` hook from `lfm.ts` handle this.

**Fix:** The `ChatAssistant.tsx` component should be rendered as an inline bottom
sheet/drawer that slides up when the user taps "Ask assistant...", not as a route.
Wire the input to `useStream` from `lfm.ts`.

---

### Mismatch 5 — Communication style preference

**UI shows:** Step 5 of onboarding lets user pick Direct / Thoughtful / Strategic / Socratic

**Backend:** No dedicated command — but `storage_agent_memory_set` exists

**Fix:** On "Finish setup" in onboarding Step 5:
```ts
import { storage } from '../lib/tauriClient'
await storage.agentMemorySet('user_prefs', 'username', usernameInput)
await storage.agentMemorySet('user_prefs', 'communication_style', selectedStyle)
```
On dashboard load, read these back to populate the greeting ("Goodevening, bioxbt").

---

### Mismatch 6 — Agents count shows "3" hardcoded

**UI shows:** Dashboard stats card shows AGENTS = 3

**Fix:** This should come from the store. The 3 represents available agent types,
not running agents. Wire to `agentTasks.length` or a static count of registered
agent types from `KoogTauriPlugin.kt` (ResearchAgent, TaggerAgent, SummaryAgent
= 3). Keep it as a static `3` until the agent system is live — just don't hardcode
it as a literal number in JSX; put it in a constant.

---

## Onboarding Wizard — Step by Step Wiring

Your wizard already has the 5-step flow and great UI. Wire each step:

---

### Step 1 — Choose your local model

**What you see:** Radio list of LFM 2.5 models with sizes (720MB / 960MB / 900MB)

**What to wire:**
```ts
// Store selected model in local state during onboarding
// Do NOT download yet — download happens after all 5 steps complete

const [selectedModel, setSelectedModel] = useState('LFM 2.5 Instruct')

// On "Continue setup" → advance step, store selection
setOnboardingData(prev => ({ ...prev, localModel: selectedModel }))
```

The actual download trigger comes at the very end when "Finish setup" is pressed.

---

### Step 2 — Cloud fallback

**What you see:** 4 options — Local only, Ollama Cloud, OpenRouter, Custom endpoint

**What to wire:**
```ts
// Store choice in onboarding data
setOnboardingData(prev => ({ ...prev, cloudFallback: selected }))
// 'local_only' | 'ollama' | 'openrouter' | 'custom'

// If OpenRouter selected, show API key input field
// If Custom endpoint, show URL + key inputs
// Save key via keystoreSet after onboarding completes
```

---

### Step 3 — Connect your world

**What you see:** Toggles for Exo Labs, Calendar, Gmail

**What to wire:**
```ts
// Calendar toggle → invoke oauth_start for Google on "Continue"
// Gmail toggle → same OAuth scope (read:gmail)
// Exo Labs toggle → keystoreSet('exo_labs_enabled', 'true') + show "Coming soon" toast

// On "Continue" — if Calendar or Gmail toggled on:
import { oauth } from '../lib/tauriClient'
await oauth.start('google')
// This opens system browser. Listen for oauth_callback to confirm success.
```

"Skip integrations" button → skip this step entirely, set all to false.

---

### Step 4 — Secure your vault

**What you see:** Radio options — Biometrics (selected), Numeric PIN, Passphrase

**What to wire:**

Biometrics selected → on "Continue", attempt biometric enrollment via tauri-plugin-biometric.
If biometric fails or unavailable, fall back to PIN flow automatically.

PIN selected → advance to the PIN entry screen (the "Set Up Encryption" screen with
the PIN input field you showed separately — this is actually a sub-screen of Step 4,
not a separate step).

```ts
import { vaultInit } from '../lib/crypto'

// PIN entry sub-screen "Next" button:
await vaultInit(pinInput)
// On success → advance to Step 5
// On error → show error message inline
```

Passphrase selected → same as PIN but allow longer text input, no numeric restriction.

---

### Step 5 — About you

**What you see:** Text input for username (shows "bioxbt"), 4 style cards

**What to wire:**
```ts
// On "Finish setup":

import { storage } from '../lib/tauriClient'
import { leap } from '../lib/leapClient'

// 1. Save user prefs
await storage.agentMemorySet('user_prefs', 'username', username)
await storage.agentMemorySet('user_prefs', 'communication_style', style)

// 2. Download the selected local model
const modelId = MODEL_MAP[onboardingData.localModel]
await leap.downloadModel(modelId)
// Show progress — use listenToDownloadProgress from lfm.ts

// 3. Save cloud fallback choice
if (onboardingData.cloudFallback === 'openrouter') {
  await keystoreSet('provider_OpenRouter', onboardingData.openRouterKey)
}

// 4. Navigate to dashboard
navigate('dashboard')
```

---

## Dashboard — Wiring

**What you see:**
- "Goodevening, bioxbt" greeting with note/task counts
- Today's Tasks row (0 PENDING, 0/0 COMPLETE)
- NOTES / TASKS / AGENTS stat cards
- Large empty state card ("No notes yet — Create notes with [[wiki-links]]...")
- RECENT NOTES / RECENT TASKS tabs
- "Ask assistant..." bottom bar
- + FAB (opens New Note/Task dialog)
- Bottom nav: Home / Notes / Tasks / Agents / Settings

**Wire the greeting:**
```ts
useEffect(() => {
  const load = async () => {
    const username = await storage.agentMemoryGet('user_prefs', 'username')
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    setGreeting(`${greeting}, ${username ?? 'there'}`)

    await loadNotes()   // fills notes count
    await loadBoards()  // fills tasks count
  }
  load()
}, [])
```

**Wire stat cards:**
```ts
// NOTES → notes.length from store
// TASKS → boardCards['default']?.length or total across all boards
// AGENTS → static 3 (registered agent types) until agent system live
```

**Wire Today's Tasks row:**
```ts
// Call kanban.getOverdue(boardName) and kanban.getDue(boardName, today)
// PENDING = due today cards not in Done column
// COMPLETE = due today cards in Done column
```

**Wire Recent Notes tab:**
```ts
// notes.slice(0, 5) — already sorted by modified from store
// Each row: title + modified timestamp
// Tap → openNote(stub.id + '.md') → navigate('notes')
```

**Wire Recent Tasks tab:**
```ts
// kanban cards sorted by modified, slice(0, 5)
// Each row: title + column + priority badge
```

**Wire empty state card (knowledge graph preview):**
```ts
// If notes.length === 0 → show "No notes yet" empty state
// If notes.length > 0 → show mini graph from graph.getNodes() + graph.getEdges()
```

**Wire "Ask assistant..." bar:**
```ts
// Tapping the bar opens ChatAssistant as a bottom sheet/drawer
// Do NOT navigate — use a Sheet from shadcn/ui
// Inside: useStream hook from lfm.ts
```

**Wire + FAB → New Note Dialog:**
The dialog already shows Note and Task options. Wire:
- Note → `notes.createNote(title)` → navigate to editor
- Task → `kanban.createCard(board, title, 'Inbox')` → navigate to kanban

---

## NotebookView — Wiring

**What you see:** Search bar at top, "No notes found" empty state, + FAB

```ts
// On mount:
await loadNotes()

// Search input onChange:
if (query.length > 2) {
  await searchNotes(query)
  // searchResults from store replaces notes list
} else {
  // show full notes list
}

// Each note row tap:
openNote(stub.id + '.md')
navigate('notes') // sub-route to editor

// + FAB → same New Note dialog as dashboard
```

---

## KanbanView (Tasks) — Wiring

**What you see:** Columns: Inbox / In Progress / Review / Done, card counts, + Add buttons per column, + FAB

```ts
// On mount:
await loadBoards()
// Default board name is 'default' or the first board returned

// Each column "Add" button:
// Open inline card creation input (title only initially)
// On enter → kanban.createCard('default', title, columnName)

// Card drag-and-drop drop handler:
await moveCard('default', card.id, targetColumn)

// Card tap → sheet/modal showing full card detail
// Inside: description, subtasks, due date, priority, links
// Edit → kanban.updateCard(...)
// Delete → kanban.deleteCard(...)
```

---

## Settings — All Sections Wiring

### Appearance section
```ts
// Light Mode toggle
const [lightMode, setLightMode] = useState(true)
const toggle = () => {
  setLightMode(!lightMode)
  await storage.agentMemorySet('user_prefs', 'theme', lightMode ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark')
}
```

### Encryption section
**AES-256-GCM Active badge** → read from `vaultStatus.unlocked`

**Biometrics toggle** → calls tauri-plugin-biometric to enroll/unenroll.
If toggled on: attempt biometric → on success update vault state.
If toggled off: confirm dialog → `vault.lock()` → re-prompt PIN to confirm.

**Reset Encryption & PIN** (red button):
```ts
// Show confirmation dialog: "This will delete all encrypted notes"
// On confirm:
await vault.lock()
// Then clear .salt and .keycheck files — this requires a new Rust command
// Tell Lovable: show destructive confirmation, then call vault_init with new PIN
```

### Local Models section
**What you see:** LFM 2.5 Instruct with "REC" badge + "Active" checkmark,
LFM 2.5 Thinking with "Use" button

```ts
// On mount:
const info = await leap.runtimeInfo()
// info.loadedModel tells you which model is active

// "Use" button on inactive model:
await leap.loadModel(MODEL_MAP['LFM 2.5 Thinking'])
// Show loading spinner, then update active indicator

// "REC" badge = recommended model (hardcode LFM 2.5 Instruct as REC for now)
```

### Cloud Providers section
**What you see:** Ollama, OpenRouter, Anthropic, Kimi, MiniMax — each with API key input

```ts
// On mount:
await loadProviders()

// Each provider API key input onBlur (not onChange — don't save on every keystroke):
await saveProvider(name, baseUrl, type, apiKeyValue)
// This calls providers_save in Rust which stores name/url/type in SQLite
// AND calls keystoreSet for the key

// Eye icon toggle: show/hide the key input value (local state, no invoke)

// Key input placeholder format matches what you see:
// Ollama: URL input (https://ollama.com/api)
// Others: key input (sk-or-..., sk-ant-..., sk-..., eyJ...)
```

---

## Settings Data Section — Wiring

**What you see:** "Export Notes as JSON" + "Delete All Notes" (red)

```ts
// Export Notes as JSON:
const allNotes = await notes.list()
const detailedNotes = await Promise.all(
  allNotes.map(stub => notes.read(stub.id + '.md'))
)
const json = JSON.stringify(detailedNotes, null, 2)
// Use tauri-plugin-fs to write to Downloads, or trigger browser download
const blob = new Blob([json], { type: 'application/json' })
const url = URL.createObjectURL(blob)
// trigger download link

// Delete All Notes (show red confirmation dialog):
// For each note in list → notes.delete(stub.id + '.md')
// Then clear the store
await clearNotes()
```

**Stats section:**
```ts
// TOTAL NOTES → notes.length from store
// TASKS → total kanban cards across all boards
// Load on mount, refresh when returning to settings
```

---

## Header Badge "Local · Private" — Wiring

**What you see:** Top-right corner shows "● Local · Private"

```ts
// This is a status indicator. Two parts:
// "Local" = local model is loaded (green dot)
// "Private" = vault is unlocked (means encrypted, local)

const { vaultStatus } = useStore()
const [modelLoaded, setModelLoaded] = useState(false)

useEffect(() => {
  leap.runtimeInfo().then(info => {
    setModelLoaded(!!info.loadedModel)
  })
}, [])

// Render:
// ● Local   → green if modelLoaded, grey if not
// Private  → always shown (vault is always local)
// If vault unlocked: show "Private", if locked: show "Locked"
```

---

## Bottom Nav — Wiring

**What you see:** Home / Notes / Tasks / Agents / Settings

```ts
// In BottomNav.tsx:
const { route, navigate } = useStore()

// Each tab:
// Home     → navigate('dashboard')
// Notes    → navigate('notes')
// Tasks    → navigate('tasks')
// Agents   → navigate('agents')
// Settings → navigate('settings')

// Active state: route === 'dashboard' for Home tab, etc.
// The tab icons already exist — just wire onClick and active className
```

---

## AgentsView — Wiring

**What you see:** 3 agents shown in dashboard stats (the Agents tab is the 4th nav item)

```ts
// On mount:
// Show the 3 registered agent types as cards:
// ResearchAgent, TaggerAgent, SummaryAgent

// Each card shows:
// - Agent name + description
// - Status: idle / running / done / failed (from agentTasks in store)
// - "Run" button → dispatchAgent(agentType, taskDescription)

// Live status updates:
import { listenToAgentEvents } from '../lib/lfm'
useEffect(() => {
  const unlisten = listenToAgentEvents(
    (agent, task) => updateAgentStatus(agent, 'running', task),
    (agent, result) => updateAgentStatus(agent, 'done', result),
    (agent, error) => updateAgentStatus(agent, 'failed', error),
  )
  return () => unlisten()
}, [])
```

---

## Complete Wiring Priority Order

Do these in order. Each step must work before starting the next.

```
1.  Replace lib files (types, store, tauriClient, leapClient, crypto, lfm)
2.  Wire App.tsx auth gate (vault status check on mount)
3.  Wire OnboardingWizard Step 1 (model selection → store in local state)
4.  Wire OnboardingWizard Step 4 (PIN → vault_init)
5.  Wire OnboardingWizard Step 5 (username + style → agent_memory_set + model download)
6.  Wire Dashboard greeting (agent_memory_get → username)
7.  Wire Dashboard stats (notes.length, kanban count)
8.  Wire NotebookView (loadNotes on mount, search, openNote)
9.  Wire KanbanView (loadBoards, createCard, moveCard)
10. Wire Settings Encryption section (vault status, biometrics toggle)
11. Wire Settings Local Models (leap.runtimeInfo, loadModel)
12. Wire Settings Cloud Providers (saveProvider, keystoreSet per provider)
13. Wire "Ask assistant..." bottom bar (useStream, bottom sheet)
14. Wire Header badge (Local · Private status)
15. Wire AgentsView (static cards + live listenToAgentEvents)
16. Wire OnboardingWizard Steps 2+3 (cloud fallback + integrations)
17. Wire Settings Data section (export JSON, delete all, stats)
```

---

## What NOT to change

- All of `src/components/ui/` — shadcn untouched
- The visual design of every screen — it's excellent as-is
- Tailwind classes and animations
- The 5-step onboarding flow structure
- The bottom nav tab order
- The card/chip/badge component styles

The only changes are: data sources, action handlers, and removing hardcoded mock values.
