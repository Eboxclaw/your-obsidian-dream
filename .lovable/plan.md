

# UI/UX Overhaul — Match ViBo Reference Mockups

Based on the 10 reference screenshots, the current app needs significant UI restructuring to match the native ViBo design. Key differences: the reference uses a **light-themed, card-based layout** with a persistent bottom nav (Home/Notes/Tasks/Agents/Settings), a **floating action button (FAB)**, an **inline assistant bar** across all views, **tabbed sub-navigation** in Agents, and **sectioned settings cards**.

---

## 1. Bottom Navigation — 5-Tab Layout
Replace the current 7-item bottom nav with the 5-tab design from mockups:
- **Home** (dashboard), **Notes** (notebook), **Tasks** (kanban), **Agents**, **Settings**
- Remove Graph and Templates as top-level tabs (move to command palette or sub-menus)
- Active tab gets highlighted background + bold label (matching reference)
- Icons above labels, larger touch targets

## 2. Floating Action Button (FAB)
- Add a dark circular `+` button fixed at bottom-right (above nav bar)
- On click, open a **"Create New" modal/dialog** with 4 options: **Note** (Markdown file), **Task** (Kanban card), **Folder** (Organize notes), **Secret** (Encrypted note)
- Each option shows icon + title + subtitle in a 2x2 grid
- For "Note", show a second step with template selection (Blank, Brainstorm, Meeting Notes, Journal)

## 3. Inline Agent Bar
- Add a persistent assistant input bar at the bottom of every view (above bottom nav)
- Shows agent icon + "Ask assistant..." placeholder
- Supports 5 collapsible conversation sessions (tabs with close buttons)
- When a message is sent, the bar expands into a chat panel overlay
- Agent greeting message: "Hey! I can help you create notes, tasks, or just chat."
- Quick action chips: "New Note", "New Task" at bottom-left, "Offline" status at bottom-right

## 4. Dashboard (Home) — Card-Based Layout
Restructure to match the reference:
- **Greeting header**: "{name},{vault}" with subtitle "{n} notes · {n} tasks · All systems local"
- **Today's Tasks card**: Shows pending count left, complete ratio right
- **Stats row**: 3 cards — NOTES count, TASKS count, AGENTS count (with icons)
- **Graph preview card**: Placeholder with "No notes yet" empty state
- **Recent Notes / Recent Tasks tabs**: Toggle between recent items
- Remove the quick-capture input (moved to FAB flow)

## 5. Notes View — Full-Width List
Replace the 3-column notebook with a full-width notes list when no note is selected:
- Top bar: "Notes" tab (active) + "Private" tab (encrypted notes)
- Search bar below header
- Empty state: icon + "No notes found"
- When a note is selected, show the editor (keep existing TipTap editor)
- Session tabs at bottom showing open notes (numbered, closable)

## 6. Agents View — Tabbed Interface
Restructure to match the 3-tab layout:
- **Agents tab**: Shows active agent cards with icon, name, description, Deactivate button + "New Agent" dashed card
- **Skills tab**: "Define what your agents can do" + "Add Skill" card (markdown-based)
- **Roles tab**: "Assign roles to control agent behavior" + "Add Role" card (markdown-based)
- Keep existing chat interface accessible by clicking an agent card

## 7. Settings View — Sectioned Cards
Restructure into card sections matching the reference:
- **APPEARANCE** card: Light Mode toggle (dark/light switch)
- **ENCRYPTION** card: AES-256-GCM status, Biometrics toggle, "Reset Encryption & PIN"
- **LOCAL MODELS — LIQUID AI** card: Model list with Use/Active buttons (LFM 2.5 Instruct, LFM 2.5 Thinking, etc.)
- **CLOUD PROVIDERS** card: Ollama with API key field + model selector dropdown
- Keep existing profile/role/vault settings in a separate section

## 8. Private/Encrypted Notes
- Add `isPrivate` flag to Note type
- Private notes tab in Notes view with lock icon
- Simulated encryption: prompt for PIN/password to view
- Biometrics toggle in Settings (UI only, simulated for web)

## 9. Store & Type Updates
- Add to `Note`: `isPrivate: boolean`
- Add to store: `agents` array with `{id, name, description, active}`, `skills`, `roles`
- Add `agentSessions` for 5 inline chat sessions
- Update `ViewMode` to remove `graph`/`templates` as primary views

## Technical Approach
- 9 files modified, 3-4 new components created
- Reuse existing Zustand store with new slices
- All changes are client-side, localStorage-persisted
- Keep TipTap editor and dnd-kit kanban intact
- New components: `FABMenu`, `InlineAgent`, `CreateNewDialog`, `AgentManagement`

