

# UI Overhaul — Branding, FAB, Inline Create, Inline Agent

## Changes Overview

### 1. Logo & Branding Colors
- Copy `logo.svg` to `src/assets/logo.svg`
- Replace the entire color system in `index.css` with the Gastly/Haunter/Gengar palette:
  - **White Pearl (light mode)**: `--background: 0 0% 96%`, `--foreground: 270 10% 15%`, cards white, subtle lavender borders
  - **Obsidian Dark Purple (dark mode)**: `--background: 270 20% 6%`, `--foreground: 270 10% 85%`, cards `270 20% 10%`
  - **Lavender Live Purple accent**: `--primary: 270 70% 60%` (Gengar purple), `--ring` and `--accent` match
- Add `.dark` class variant for dark mode (default) + light mode support
- Logo in top bar header with a purple glow: `filter: drop-shadow(0 0 8px hsl(270 70% 60% / 0.5))`
- Add CSS for ghosty/smokey ambient effects: subtle animated gradient backgrounds on cards using purple/lavender tones, a `smoke-glow` keyframe for the logo

### 2. FAB — Smaller & Positioned Relative to Inline Agent
- Currently the FAB is `fixed bottom-20 right-5` with `h-14 w-14`
- Reduce to `h-12 w-12` (slightly smaller)
- Remove fixed positioning — instead, render the FAB as part of the bottom layout flow in `AppShell.tsx`, positioned absolutely relative to the inline agent bar
- The FAB sits in a container that wraps InlineAgent + BottomNav, anchored `right-4` and dynamically positioned just above the inline agent bar (whether collapsed or expanded)
- Use a wrapper div with `relative` positioning so the FAB floats above the agent bar

### 3. Inline Create Buttons on Notes & Tasks Pages
- **Notebook.tsx**: Add a `+ New Note` button at the top of the notes list (below search), styled as a subtle dashed-border row
- **KanbanView.tsx**: Add a `+ New Task` button in the header bar next to the board title, creating a card in the first column

### 4. Inline Agent — No Changes to Session Logic
- The 5-session system already exists and works
- Only change: ensure the FAB moves with it (handled in AppShell layout)

### 5. AppShell Layout Restructure
Current order: `<main>` → `<InlineAgent>` → `<BottomNav>` → `<FABMenu>` (fixed)

New order with a relative wrapper:
```
<main>
<div className="relative">  ← new wrapper
  <FABMenu />  ← absolute, anchored above InlineAgent
  <InlineAgent />
</div>
<BottomNav />
```

### Files to Create/Edit
1. **Copy** `user-uploads://logo.svg` → `src/assets/logo.svg`
2. **Edit** `src/index.css` — full color palette rewrite with light/dark mode CSS variables using the Gastly palette, smoke/glow keyframes
3. **Edit** `tailwind.config.ts` — add `darkMode: ["class"]` (already there), ensure purple-based colors map correctly
4. **Edit** `src/components/layout/AppShell.tsx` — add logo import, show logo with glow in header, restructure bottom section with relative wrapper for FAB positioning
5. **Edit** `src/components/layout/FABMenu.tsx` — reduce size to `h-12 w-12`, change from fixed to absolute positioning within the wrapper (`absolute -top-14 right-4`), adjust menu popup position
6. **Edit** `src/components/views/Notebook.tsx` — add inline `+ New Note` button in the list view
7. **Edit** `src/components/views/KanbanView.tsx` — add `+ New Task` button in header
8. **Edit** `src/components/onboarding/OnboardingWizard.tsx` — use logo with glow on welcome step

