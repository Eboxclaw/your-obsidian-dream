

# Plan: UI-Only Changes

## 1. Remove logo from onboarding and app header
- **OnboardingWizard.tsx**: Delete `import logoSvg` (line 23) and the `<img src={logoSvg}>` block (line 166). Keep the text branding.
- **AppShell.tsx**: Delete `import logoSvg` (line 18) and the `<img>` tag (lines 87-91). Keep the view title text.

## 2. Onboarding: Google OAuth card on integration continue
- When user presses Continue on step 2 with at least one integration toggled on, show a Google OAuth popup card instead of advancing to step 3.
- Add a new `subStep` value `'oauth'` that renders a centered card with a Google icon, "Connect to Google" heading, a "Sign in with Google" button (calls `oauthStart('google')` then advances to step 3), and a "Skip" link.
- If no integrations are toggled, Continue goes straight to step 3.

## 3. Simplify onboarding security flow
- Rename all "PIN" labels to "Password" throughout OnboardingWizard (placeholder, heading, description, error text).
- Remove the `subStep === 'biometric'` screen entirely (lines 197-244).
- After password confirm succeeds, call `finishOnboarding()` directly regardless of security method selection.

## 4. Redesign LockScreen component
- Single card, no logo. Shows:
  - Fingerprint icon + "Welcome back" heading
  - "Unlock with Biometrics" primary button (simulates biometric → unlocks)
  - "Use Password" text button → reveals password input + unlock button
- Rename all "PIN" references to "Password".

## 5. FAB follows ChatAssistant sheet state
- FABMenu reads `ui.inlineAgentOpen` from store.
- When chat sheet is open, shift FAB up: `bottom-[calc(72vh+1rem)]`. When closed, keep `bottom-[7.5rem]`.

## 6. Default folder: "MyVault", scoped by default
- Rename `DEFAULT_FOLDER.name` from `'General'` to `'MyVault'` in store.
- Set initial `ui.activeFolderId` to `'default-folder'` so app scopes to MyVault by default.

## 7. Dashboard: remove Skills and Roles from stats
- Remove Skills and Roles from the stats grid array. Change grid to `grid-cols-3`.
- Remove `skills, roles` from the destructured store imports.

## 8. AgentView: local models only, seed 4 agents + 4 roles from onboarding presets
- Replace `MODELS` array with `['LFM2-350M-Extract', 'lfm-instruct', 'lfm-thinking']`.
- Remove Skills tab entirely — keep only Agents and Roles tabs.
- Seed 4 default agents in store matching onboarding presets (Manager, Assistant, Code Assistant, Content Writer) with `LFM2-350M-Extract`.
- Seed 4 default roles matching the same presets in store's initial state.
- Default model in form set to `'LFM2-350M-Extract'`.

## Files to edit
| File | Changes |
|---|---|
| `src/components/onboarding/OnboardingWizard.tsx` | Remove logo, add OAuth sub-step, remove biometric sub-step, rename PIN→Password |
| `src/components/layout/AppShell.tsx` | Remove logo import and `<img>` |
| `src/components/LockScreen.tsx` | Redesign to biometric-first single card, rename PIN→Password |
| `src/components/layout/FABMenu.tsx` | Dynamic bottom offset based on `ui.inlineAgentOpen` |
| `src/components/views/Dashboard.tsx` | Remove Skills/Roles from stats, 3-col grid |
| `src/components/views/AgentView.tsx` | Local models, remove Skills tab, seed defaults |
| `src/lib/store.tsx` | Rename folder to MyVault, set default activeFolderId, seed 4 agents + 4 roles |

