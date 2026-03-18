

# UI Fixes & FAB Repositioning

## Issues to Address

1. **FAB position**: Move from centered to bottom-right corner (like the reference screenshot), but when pressed opens a full-screen overlay with centered "Create New" menu card (matching the mockup exactly)
2. **Dark mode purples**: Remove remaining purple tints from dark mode CSS variables — use pure charcoal/obsidian black with only lavender accents on `--accent`, `--ring`, `--glow-color`
3. **Inline agent quick buttons**: Currently `handleQuickAction` sets `setInput(action)` but doesn't auto-send or open the agent panel reliably — fix to open agent + prefill input
4. **Onboarding biometric popup**: Already exists at `subStep === 'biometric'` — verify flow works (welcome → model → integrations → security → agent → name → PIN → PIN confirm → biometric)
5. **Mobile responsiveness**: Ensure all views use responsive classes, FAB doesn't overlap content
6. **Dashboard cleanup**: Remove any leftover purple visual effects on stat cards

## Changes

### 1. FABMenu.tsx — Corner Position + Centered Overlay Menu
- Move FAB button from `absolute -top-6 left-1/2 -translate-x-1/2` to `fixed bottom-[7.5rem] right-5` (above bottom nav + inline agent)
- Keep `h-12 w-12` size
- When open: full-screen overlay with centered card matching the reference (larger cards with centered icons, title "Create New", subtitle "What do you want to create?", close X button top-right)
- Card items: centered icon above label above subtitle (not left-aligned)
- Remove from relative wrapper in AppShell, render as fixed element

### 2. AppShell.tsx — Remove FAB from relative wrapper
- Remove the `<div className="relative">` wrapper, render FAB independently as fixed position
- Keep InlineAgent in normal flow above BottomNav

### 3. index.css — Dark mode pure charcoal
- Light mode `--background`: keep `270 10% 95%` (pearl white with very slight warmth)
- Dark mode: change all purple-tinted values to pure neutral:
  - `--background: 0 0% 5%` (already correct)
  - `--card: 0 0% 8%` (already correct)
  - Keep `--accent: 270 50% 65%` and `--ring: 270 50% 65%` as the ONLY purple values
  - `--smoke-color: 0 0% 15%` (neutral smoke, not purple)
- Light mode: remove purple tints from `--background`, `--muted`, `--border`, `--surface` — use neutral grays instead of `270` hue values

### 4. InlineAgent.tsx — Fix quick action buttons
- `handleQuickAction` should: open agent if closed → set input text → focus the input
- Add `useEffect` to auto-focus input when `inlineAgentOpen` changes to true

### 5. Dashboard.tsx — Remove purple smoke effects
- Remove `<SmokeParticles>` from the Knowledge Graph card (it creates purple blobs)
- Keep smoke only on onboarding welcome splash

### 6. Onboarding flow verification
- Flow already implements: welcome(0) → model(1) → integrations(2) → security(3) → agent(4) → name(5) → PIN(sub) → PIN confirm(sub) → biometric(sub)
- Double PIN confirmation exists
- Biometric popup exists
- No code changes needed for onboarding

## Files to Edit
1. `src/components/layout/FABMenu.tsx` — fixed bottom-right position, centered overlay with reference-matching card layout
2. `src/components/layout/AppShell.tsx` — remove relative wrapper around FAB
3. `src/index.css` — neutralize purple tints in both light and dark mode variables
4. `src/components/layout/InlineAgent.tsx` — fix quick action auto-open + focus
5. `src/components/views/Dashboard.tsx` — remove SmokeParticles from graph card

