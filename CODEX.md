# CODEX.md — ViBo AI Assistant Guide

Version: March 2026

This repository is organized as a Tauri v2 app with:
- `src/` React + TSX UI
- `src-tauri/` Rust backend and capabilities
- `android/` Kotlin agent/plugin bridge
- `assets/` role and model assets
- `docs/` architecture/API/planning notes

## Current priorities
- Keep all AI/data operations in Rust/Kotlin.
- TSX only handles UI + invoke/listen wiring through typed wrappers in `src/lib`.
- No `localStorage`, `fetch`, or direct secret handling in TSX.
- Kotlin tools must invoke Rust directly (no tool event bus).

## Checklist tracker
### TODO
- Validate Kotlin plugin compile against current Koog API.
- Complete DB API migration for SQL plugin 2.x across Rust modules.

### DONE
- Repository scaffolded into `src-tauri`, `android`, `assets`, and `docs`.
- Root-level duplicate source files moved into platform directories.
- Added required stub files (`ios/.gitkeep`, model/role/docs stubs).

### TO REVIEW
- Capability file permissions and schema compatibility.
- Rust command wiring after moves (`cargo check`).
