

# ViBo — Aether Notebook OS (Web Prototype)

Build the three core views — Dashboard, Notebook, and Kanban — with the Aether "Cold Obsidian" dark design system, a fully functional markdown editor, and localStorage persistence. All data layers use typed wrappers that mirror the Tauri `invoke()` API shape for easy future migration.

---

## 1. Design System Foundation
- Implement the Aether palette: `--background: 240 10% 3.9%`, `--surface: 240 10% 6%`, `--border: 240 5% 15%`, `--accent: 210 100% 50%`
- Typography: Geist Sans for UI (`tracking-tight`, `font-medium`), JetBrains Mono for editor/prose
- 4px baseline grid, concentric radius (outer 6px, inner 2px), no scrollbars, no shadows — depth via 1px chamfered borders and value shifts
- Motion: 150ms transitions with `cubic-bezier(0.16, 1, 0.3, 1)`

## 2. Layout Shell — 3-Column Grid
- `grid-cols-[240px_1fr_300px]` layout with collapsible inspector pane
- **Sidebar (240px fixed):** File tree (text-only, no icons), active state = 1.5px accent left border, nested indentation for hierarchy
- **Editor (centered, 720px max):** Expansive prose margins (`py-24`)
- **Inspector (300px, collapsible):** Backlinks panel, note metadata, word count with `tabular-nums`
- 1px vertical gutter lines between panes, no gaps

## 3. Data Layer — localStorage with Tauri-shaped API
- Zustand store with slices: `notes`, `kanban`, `ui`
- Typed service wrappers (`noteService.ts`, `kanbanService.ts`) matching Rust command signatures (e.g., `loadNotes()`, `saveNote()`, `createCard()`, `moveCard()`)
- Notes stored as markdown with YAML frontmatter (title, tags, created, modified)
- Wikilink index built in-memory for bidirectional link resolution

## 4. Dashboard View
- Greeting with current role display, recent notes list, active boards summary
- Quick-capture input at top — instant focus, type title, Tab to create note
- Stats bar: note count, link count, last edited time — noun-heavy, data-dense voice
- "4,821 nodes. 12,042 edges." style metadata display

## 5. Notebook View — Full Markdown Editor
- File tree sidebar with search, create/delete notes
- Markdown editor using a rich-text library (TipTap or similar) with:
  - Live inline rendering of bold, italic, links, code blocks
  - Syntax highlighting for markdown tokens in `text-muted-foreground`
  - `[[wikilink]]` support — type `[[` to trigger search overlay, arrow keys to select, Enter to link
  - YAML frontmatter parsing and display
  - Daily notes support
- Backlinks panel in inspector showing all notes linking to current note
- No toolbar — markdown-only input

## 6. Kanban View
- Board CRUD with columns and draggable cards (dnd-kit)
- Cards link to notes (each card is a note with kanban frontmatter)
- Subtask checkboxes, column management (add/rename/reorder)
- Obsidian Kanban format compatibility in the data model

## 7. Command Palette
- `Cmd+K` to open — `bg-surface/80` with `backdrop-blur-md`, 1px sharp border, no shadow
- Search across notes, actions, and navigation
- Keyboard-driven: arrow keys + Enter

## 8. Navigation & Keyboard Shortcuts
- Bottom bar with Dashboard / Notebook / Kanban navigation
- `Cmd+N` — new note with instant focus
- `Cmd+K` — command palette
- `Cmd+G` — placeholder for graph view (future phase)
- Role selector accessible from settings area

