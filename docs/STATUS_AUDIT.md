# Repository Reorganization Audit (2026-03-21)

## DONE
- Re-homed Rust/Tauri sources under `src-tauri/`.
- Re-homed Android Kotlin sources under `android/app/src/main/kotlin/com/vibo/app/`.
- Added required scaffolding files and directories (`ios/.gitkeep`, `src-tauri/icons/.gitkeep`, roles/models stubs).
- Added root `CODEX.md` and mirrored `docs/CODEX.md`.
- Replaced `src/pages/Index.tsx` with the migrated implementation and removed `localStorage` migration logic.

## TODO
- Complete SQL plugin 2.x API migration in:
  - `src-tauri/src/storage.rs`
  - `src-tauri/src/graph.rs`
  - `src-tauri/src/oauth.rs`
  - `src-tauri/src/providers.rs`
- Update `KoogTauriPlugin.kt` to current Koog ToolRegistry + direct invoke tool calls.
- Verify `src-tauri/capabilities/default.json` validates against Tauri schema.

## TO REVIEW
- Build orchestration after move (`cargo check`, Android Gradle sync).
- Rust <-> Kotlin command names alignment for agent tool calls.
- Vault gating and typed wrapper usage consistency in UI components.
