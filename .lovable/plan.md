

# Plan: Fix Build Error + Roadmap Integration (Phase 1 Steps 4-5)

## 1. Fix Build Error (immediate)

The `src/worker.ts` Cloudflare Workers file is inside `src/` which is compiled by `tsconfig.app.json`. The `Fetcher` type comes from `@cloudflare/workers-types`, not available to the app tsconfig.

**Fix**: Exclude `src/worker.ts` from `tsconfig.app.json` by adding it to the `exclude` array. The Cloudflare build uses its own config and won't be affected.

## 2. Roadmap Violations to Fix

Based on the audit, these violations exist in the current frontend and must be corrected as part of wiring up the real data layer:

| Violation | Location | Fix |
|---|---|---|
| `persist` with `localStorage` | `src/store/index.ts` line 1-2 | Remove `persist` middleware entirely; store becomes ephemeral, hydrated from Rust on mount |
| `?.` and `??` syntax | Throughout `src/store/index.ts` | Replace with ternary and `&&` guards |
| Default model `gpt-4o` | `src/store/index.ts` line 52-53 | Change to `LFM2-350M-Extract` |
| Types in wrong location | `src/types/index.ts` | Move to `src/lib/types.ts`, update all imports |
| Store in wrong location | `src/store/index.ts` | Move to `src/lib/store.tsx`, update all imports |

## 3. Align `tauriClient.ts` with Roadmap Commands

The current `src/lib/tauriClient.ts` is a simplified version. The uploaded `tauriClient.ts` (root-level, from the Rust backend reference) shows the full command surface. The `src/lib/` version needs to be expanded to cover:

- **Notes**: `note_read`, `note_write`, `note_patch`, `note_move`, `note_rename`, `note_search`, `note_search_tags`, `note_get_frontmatter`, `note_set_frontmatter`, `note_get_links`, `note_get_backlinks`, `note_get_orphans`, `note_daily_get`, `note_daily_create`, `note_snapshot`, `note_restore`, `note_stats`
- **Kanban**: `kanban_board_create`, `kanban_board_get`, `kanban_card_create/read/update/delete/move`, subtasks, due/overdue, calendar links, export
- **Vault**: `vault_init`, `vault_unlock_pin`, `vault_unlock_biometric`, `vault_lock`, `vault_status`, `vault_create/read/write/delete/list`, `vault_change_pin`
- **Graph**: `graph_get_nodes`, `graph_get_edges`, `graph_rebuild`, `graph_get_connected`
- **SRI**: `sri_route`, `sri_embed_store`, `sri_cache_query`
- **Storage**: `storage_init`, `storage_note_index/remove`, `storage_search_fulltext`, `storage_agent_memory_*`, `storage_distillation_*`
- **Providers**: `providers_list/save/delete/test/stream`, `keystore_get/set/delete`
- **Google**: `google_calendar_*`, `google_gmail_*`, `google_drive_*`
- **OAuth**: `oauth_start/callback/status/revoke/refresh`

## 4. Align `leapClient.ts` with Roadmap

Add missing commands from the roadmap spec:
- `runtime_info` — device capability check
- `download_model` — with progress events
- `load_model` / `load_cached_model` / `list_cached_models` / `remove_cached_model`
- `create_conversation` / `create_conversation_from_history`
- `generate` — streaming chat
- `stop_generation`
- `unload_model`

## 5. Align `lfm.ts` with Roadmap

Add missing listeners per roadmap:
- `leap-ai:token` — local model streaming (separate from cloud `llm-delta`)
- `listenToAgentEvents` — agent lifecycle events
- `listenToDownloadProgress` — model download progress

## 6. Align `crypto.ts` with Roadmap

Current file is close but needs alignment:
- `vaultInit(pin)` — first-time setup (missing)
- `keystoreGet(keyName)` / `keystoreSet(keyName, value)` — for API key management via vault SQLite (missing)
- `requireUnlocked()` — throws if vault not unlocked (missing, per roadmap spec)

## 7. Wire Store to Tauri Backend

Refactor `src/lib/store.tsx` (after move) to:
- Remove all `persist` middleware and `localStorage`
- Add `hydrate()` action that calls `tauriClient` on app mount
- Each mutation (addNote, deleteNote, etc.) calls the corresponding `tauriClient` function, then updates local state on success
- Return stub/mock data when `safeInvoke` returns null (web preview mode)

## Implementation Order

1. Fix `tsconfig.app.json` exclude for `src/worker.ts`
2. Move `src/types/index.ts` → `src/lib/types.ts` and update all imports
3. Move `src/store/index.ts` → `src/lib/store.tsx` and update all imports
4. Expand `src/lib/tauriClient.ts` to full command surface
5. Expand `src/lib/leapClient.ts` with all plugin commands
6. Expand `src/lib/lfm.ts` with all event listeners
7. Expand `src/lib/crypto.ts` with missing functions
8. Refactor store: remove `persist`/`localStorage`, fix `?.`/`??`, change default model, wire mutations to `tauriClient`

