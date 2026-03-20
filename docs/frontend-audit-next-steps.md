# ViBo Frontend Audit & Next Steps (2026-03-19)

## Scope
Quick static audit of the current React/Tauri frontend against the provided implementation constraints:
- Tauri wrappers-only integration (`tauriClient.ts`, `leapClient.ts`, `crypto.ts`, `lfm.ts`)
- No `?.` / `??` in TSX
- No local storage
- No route-style navigation for sheet UX
- Vault gating for sensitive views

## Findings

### 1) `localStorage` usage is still present (must be removed)
- `src/components/views/SettingsView.tsx` calls `localStorage.removeItem('vibo-store')`, which violates the no-storage rule.
- The same file also renders `localStorage` text in the UI, indicating persistence expectations still reference browser storage.

### 2) Optional chaining / nullish coalescing still appear in TSX
Violations of the explicit coding rule (`?.` and `??` disallowed) are present in several TSX files, including:
- `src/components/views/Dashboard.tsx`
- `src/components/views/GraphView.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/chart.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/breadcrumb.tsx`

### 3) Anchor navigation exists in app pages
- `src/pages/NotFound.tsx` contains `<a href="/">...`.
- This should be replaced with store-driven navigation (`navigate()` in Zustand) to align with Tauri app navigation constraints.

### 4) Positive signal: component-level direct `invoke()` calls were not found
- Search across `src/components` and `src/pages` did not show direct `invoke(...)` usage.
- This indicates wrappers are largely being respected in UI components.

### 5) Worker `fetch` is outside UI scope but should be intentionally isolated
- `src/worker.ts` uses `fetch` (Cloudflare worker asset handler).
- This likely does not run in the Tauri UI runtime; document this boundary to prevent accidental reuse in TSX.

## Recommended Next Steps (implementation order)

1. **Remove browser persistence dependencies from Settings and store wiring**
   - Replace storage-clearing behavior with backend-backed reset commands through typed wrappers.
   - If a full reset action is needed, expose a Rust command and call via `tauriClient`.

2. **Run a codemod-style pass to remove `?.` and `??` from TSX**
   - Replace with explicit guards, e.g.:
     - `obj && obj.prop`
     - `value !== null && value !== undefined ? value : fallback`
   - Prioritize user-facing screens first (`Dashboard`, `GraphView`, `Settings`, `Notebook`, `NoteEditor`, `Kanban`, `Agent`).

3. **Replace route anchors with store navigation**
   - Update `NotFound` and any future fallback pages to call `navigate('dashboard')` (or equivalent route key).

4. **Add lint rules to prevent regressions**
   - Enforce no optional chaining and no nullish coalescing in TSX.
   - Forbid `localStorage`/`sessionStorage` usage in `src/**`.
   - Forbid direct `invoke()` in `src/components/**` and `src/pages/**`.

5. **Add vault-gating verification checklist to sensitive views**
   - Ensure each notes/sensitive view checks `vaultStatus.unlocked` before render.
   - Add a simple test/checklist item for PR review.

## Suggested acceptance checks for the next implementation PR
- `rg -n "localStorage|sessionStorage" src` returns no forbidden runtime usage in UI files.
- `rg -n "\?\.|\?\?" src/components src/pages` returns no matches.
- `rg -n "invoke\(" src/components src/pages` returns no matches.
- `rg -n "href=|<Link" src/components src/pages` returns no navigation violations.

