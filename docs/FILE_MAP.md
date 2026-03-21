# FILE_MAP

Canonical mapping between CODEX-referenced component filenames and the current repository filenames.

## One-to-one mappings

| CODEX filename | Current filename | Current file path | Notes |
| --- | --- | --- | --- |
| `DashboardView.tsx` | `Dashboard.tsx` | `src/components/views/Dashboard.tsx` | Safe naming deviation (`View` suffix dropped). |
| `NotebookView.tsx` | `Notebook.tsx` | `src/components/views/Notebook.tsx` | Safe naming deviation (`View` suffix dropped). |
| `AgentsView.tsx` | `AgentView.tsx` | `src/components/views/AgentView.tsx` | Safe singular/plural naming deviation. |
| `OnboardingWizard.tsx` | `OnboardingWizard.tsx` | `src/components/onboarding/OnboardingWizard.tsx` | Exact filename match. |
| `BottomNav.tsx` | `BottomNav.tsx` | `src/components/layout/BottomNav.tsx` | Exact filename match. |

## Intentional deviations

### Safe deviations (allowed)

Safe deviations are **folder grouping and filename style only** (for example, dropping `View` in filenames or using singular naming), while behavior remains aligned with CODEX expectations.

### Unsafe deviations (not allowed)

Any behavioral divergence is unsafe, including:

- Different mount-time data loading behavior.
- Different vault-gating behavior for protected content.
- Different streaming/listener lifecycle behavior.
- Different navigation semantics (for example, route vs sheet behavior).

## Duplicate-name resolution policy

If duplicate component-name mappings are introduced in the future:

1. Remove the oldest duplicate mapping first.
2. Keep only the latest surviving mapping entry.
3. Update the surviving entry to the correct canonical filename/path.

Current status: no duplicate mappings in this file.
