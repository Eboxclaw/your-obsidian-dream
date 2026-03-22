# Roadmap Delta Audit (2026-03-22)

Source of truth compared: `VIBO_ROADMAP_FINAL_0000.md` (Version 5, March 2026).

## Executive Delta Summary

### ✅ Aligned with roadmap
- **Rust + Android project layout is aligned** with roadmap structure (`src-tauri/`, `android/app/src/main/kotlin/com/vibo/app/`, role/model assets). 
- **Frontend IPC wrappers exist** (`src/lib/tauriClient.ts`, `src/lib/leapClient.ts`, `src/lib/crypto.ts`, `src/lib/lfm.ts`) and components largely consume store/wrappers instead of calling `invoke()` directly.
- **Capability policy is explicit/least-privilege** for `leap-ai` commands in `src-tauri/capabilities/default.json` (no wildcard default).
- **Vault gating exists at app-shell level** before protected views are rendered.

### 🟨 Partially aligned / needs verification
- **SQL plugin migration items previously marked TODO appear mostly migrated** (core modules now import/use `tauri_plugin_sql`), but full runtime verification is still required (`cargo check` + app smoke test).
- **Route model is mixed**: app still boots under `BrowserRouter`, while primary in-app navigation is Zustand view switching.
- **Notebook private-tab unlock state has local component gating** in addition to global vault gating; behavior should be reviewed for consistency with single-source vault status.

### ❌ Not aligned (clear roadmap divergence)
- **Koog tool calls are still wired through an event-bus bridge in Kotlin plugin** (`emitToolRequest`, comments explicitly stating event bus), while roadmap requires direct Rust invoke-style tool calls (no trigger/listen bus for tools).

---

## Delta vs previous audit (2026-03-21 → 2026-03-22)

### Closed / improved since prior audit
- Prior TODO: SQL migration in `storage.rs`, `graph.rs`, `oauth.rs` is materially improved (now using `tauri_plugin_sql` imports in those modules).
- Prior TODO: capability-file validation risk reduced by explicit permissions and roadmap-oriented comments in `default.json`.

### Still open from prior audit
- **Koog ToolRegistry/direct invoke migration remains open** in `KoogTauriPlugin.kt`.
- **Build/orchestration verification remains open** (no definitive green `cargo check` + Android sync evidence captured in this doc).
- **Rust↔Kotlin agent tool command alignment remains open** pending replacement of event-bus tool bridge.

---

## Evidence map (quick pointers)

- Roadmap requirements: `VIBO_ROADMAP_FINAL_0000.md`
- Kotlin plugin current tool bridge: `android/app/src/main/kotlin/com/vibo/app/KoogTauriPlugin.kt`
- Tauri capability posture: `src-tauri/capabilities/default.json`
- SQL migration signal files: `src-tauri/src/storage.rs`, `src-tauri/src/graph.rs`, `src-tauri/src/oauth.rs`
- Navigation/gating context: `src/App.tsx`, `src/components/layout/AppShell.tsx`, `src/components/views/Notebook.tsx`

---

## Recommended next actions (ordered)

1. **Refactor Koog tool plumbing first**: replace event-bus request/response path with direct invoke-style Rust command calls per roadmap.
2. **Run hard verification pass**: `cargo check`, frontend lint/typecheck, and Android Gradle sync/build.
3. **Unify navigation strategy**: remove router dependency if Zustand navigation is the intended single model.
4. **Normalize vault gating semantics**: use global vault status as single authority for protected notebook flows.
