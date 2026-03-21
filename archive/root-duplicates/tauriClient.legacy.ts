// tauriClient.ts — Typed invoke() wrappers for all Rust commands
// Every command that exists in main.rs has a typed wrapper here.
// No raw invoke() calls anywhere else in the codebase.
// Return types match the Rust structs exactly via types.ts.

import { invoke } from '@tauri-apps/api/core'
import type {
  Note,
  NoteStub,
  SearchResult,
  VaultStats,
  VaultNote,
  VaultStatus,
  KanbanBoard,
  KanbanCard,
  Priority,
  GraphNode,
  GraphEdge,
  SriDecision,
  Provider,
  CalendarEvent,
  GmailMessage,
  DriveFile,
  OAuthStatus,
  Distillation,
  DistillationType,
} from './types'

// ── Notes ─────────────────────────────────────────────────────────────────────

export const notes = {
  create: (title: string, content?: string, tags?: string[], folder?: string) =>
    invoke<Note>('note_create', { title, content: content ?? null, tags: tags ?? null, folder: folder ?? null }),

  read: (filename: string) =>
    invoke<Note>('note_read', { filename }),

  write: (filename: string, content: string) =>
    invoke<Note>('note_write', { filename, content }),

  patch: (filename: string, append: string) =>
    invoke<Note>('note_patch', { filename, append }),

  delete: (filename: string) =>
    invoke<void>('note_delete', { filename }),

  move: (filename: string, newFolder: string) =>
    invoke<Note>('note_move', { filename, new_folder: newFolder }),

  rename: (filename: string, newTitle: string) =>
    invoke<Note>('note_rename', { filename, new_title: newTitle }),

  list: (folder?: string) =>
    invoke<NoteStub[]>('note_list', { folder: folder ?? null }),

  listFolders: () =>
    invoke<string[]>('note_list_folder'),

  search: (query: string, limit?: number) =>
    invoke<SearchResult[]>('note_search', { query, limit: limit ?? null }),

  searchTags: (tags: string[]) =>
    invoke<NoteStub[]>('note_search_tags', { tags }),

  getFrontmatter: (filename: string) =>
    invoke<Record<string, unknown>>('note_get_frontmatter', { filename }),

  setFrontmatter: (filename: string, key: string, value: unknown) =>
    invoke<Note>('note_set_frontmatter', { filename, key, value }),

  getLinks: (filename: string) =>
    invoke<string[]>('note_get_links', { filename }),

  getBacklinks: (filename: string) =>
    invoke<NoteStub[]>('note_get_backlinks', { filename }),

  getOrphans: () =>
    invoke<NoteStub[]>('note_get_orphans'),

  dailyGet: () =>
    invoke<Note | null>('note_daily_get'),

  dailyCreate: () =>
    invoke<Note>('note_daily_create'),

  snapshot: (filename: string) =>
    invoke<string>('note_snapshot', { filename }),

  restore: (filename: string, snapshotName: string) =>
    invoke<Note>('note_restore', { filename, snapshot_name: snapshotName }),

  stats: () =>
    invoke<VaultStats>('note_stats'),
}

// ── Kanban ────────────────────────────────────────────────────────────────────

export const kanban = {
  boardCreate: (name: string, columns?: string[]) =>
    invoke<KanbanBoard>('kanban_board_create', { name, columns: columns ?? null }),

  boardList: () =>
    invoke<KanbanBoard[]>('kanban_board_list'),

  boardGet: (name: string) =>
    invoke<KanbanCard[]>('kanban_board_get', { name }),

  boardDelete: (name: string) =>
    invoke<void>('kanban_board_delete', { name }),

  cardCreate: (
    board: string,
    title: string,
    column: string,
    opts?: { description?: string; priority?: Priority; due_date?: string; tags?: string[]; note_links?: string[] }
  ) =>
    invoke<KanbanCard>('kanban_card_create', {
      board, title, column,
      description: opts?.description ?? null,
      priority: opts?.priority ?? null,
      due_date: opts?.due_date ?? null,
      tags: opts?.tags ?? null,
      note_links: opts?.note_links ?? null,
    }),

  cardRead: (board: string, cardId: string) =>
    invoke<KanbanCard>('kanban_card_read', { board, card_id: cardId }),

  cardUpdate: (board: string, cardId: string, opts: {
    title?: string; description?: string; priority?: Priority; due_date?: string; tags?: string[]
  }) =>
    invoke<KanbanCard>('kanban_card_update', {
      board, card_id: cardId,
      title: opts.title ?? null,
      description: opts.description ?? null,
      priority: opts.priority ?? null,
      due_date: opts.due_date ?? null,
      tags: opts.tags ?? null,
    }),

  cardDelete: (board: string, cardId: string) =>
    invoke<void>('kanban_card_delete', { board, card_id: cardId }),

  cardMove: (board: string, cardId: string, newColumn: string) =>
    invoke<KanbanCard>('kanban_card_move', { board, card_id: cardId, new_column: newColumn }),

  cardAddSubtask: (board: string, cardId: string, subtaskTitle: string) =>
    invoke<KanbanCard>('kanban_card_add_subtask', { board, card_id: cardId, subtask_title: subtaskTitle }),

  cardCompleteSubtask: (board: string, cardId: string, subtaskId: string) =>
    invoke<KanbanCard>('kanban_card_complete_subtask', { board, card_id: cardId, subtask_id: subtaskId }),

  getDue: (board: string, date: string) =>
    invoke<KanbanCard[]>('kanban_get_due', { board, date }),

  getOverdue: (board: string) =>
    invoke<KanbanCard[]>('kanban_get_overdue', { board }),

  createFromCalendar: (board: string, eventTitle: string, eventDate: string, eventId: string, column?: string) =>
    invoke<KanbanCard>('kanban_create_from_calendar', {
      board, event_title: eventTitle, event_date: eventDate, event_id: eventId,
      column: column ?? null,
    }),

  getByEvent: (board: string, eventId: string) =>
    invoke<KanbanCard | null>('kanban_get_by_event', { board, event_id: eventId }),

  exportBoard: (board: string) =>
    invoke<string>('kanban_export_board', { board }),
}

// ── Vault ─────────────────────────────────────────────────────────────────────

export const vault = {
  init: (pin: string) =>
    invoke<void>('vault_init', { pin }),

  unlockPin: (pin: string) =>
    invoke<boolean>('vault_unlock_pin', { pin }),

  unlockBiometric: (keyBytes: number[]) =>
    invoke<boolean>('vault_unlock_biometric', { key_bytes: keyBytes }),

  lock: () =>
    invoke<void>('vault_lock'),

  status: () =>
    invoke<VaultStatus>('vault_status'),

  create: (id: string, title: string, content: string, tags?: string[]) =>
    invoke<VaultNote>('vault_create', { id, title, content, tags: tags ?? null }),

  read: (id: string) =>
    invoke<VaultNote>('vault_read', { id }),

  write: (id: string, content: string) =>
    invoke<VaultNote>('vault_write', { id, content }),

  delete: (id: string) =>
    invoke<void>('vault_delete', { id }),

  list: () =>
    invoke<VaultNote[]>('vault_list'),

  changePin: (oldPin: string, newPin: string) =>
    invoke<void>('vault_change_pin', { old_pin: oldPin, new_pin: newPin }),
}

// ── Graph ─────────────────────────────────────────────────────────────────────

export const graph = {
  getNodes: () =>
    invoke<GraphNode[]>('graph_get_nodes'),

  getEdges: () =>
    invoke<GraphEdge[]>('graph_get_edges'),

  rebuild: () =>
    invoke<number>('graph_rebuild'),

  getConnected: (nodeId: string, depth?: number) =>
    invoke<GraphEdge[]>('graph_get_connected', { node_id: nodeId, depth: depth ?? null }),
}

// ── SRI ───────────────────────────────────────────────────────────────────────

export const sri = {
  route: (prompt: string) =>
    invoke<SriDecision>('sri_route', { prompt }),

  embedStore: (noteId: string, vector: number[], textPreview: string) =>
    invoke<{ note_id: string; stored: boolean }>('sri_embed_store', {
      note_id: noteId, vector, text_preview: textPreview,
    }),

  cacheQuery: (query: string) =>
    invoke<string | null>('sri_cache_query', { query }),
}

// ── Storage ───────────────────────────────────────────────────────────────────

export const storage = {
  init: () =>
    invoke<void>('storage_init'),

  noteIndex: (id: string, title: string, path: string, tags: string[], wordCount: number, modified: string, created: string) =>
    invoke<void>('storage_note_index', { id, title, path, tags, word_count: wordCount, modified, created }),

  noteRemove: (id: string) =>
    invoke<void>('storage_note_remove', { id }),

  searchFulltext: (query: string, limit?: number) =>
    invoke<unknown[]>('storage_search_fulltext', { query, limit: limit ?? null }),

  agentMemoryGet: (session: string, key: string) =>
    invoke<string | null>('storage_agent_memory_get', { session, key }),

  agentMemorySet: (session: string, key: string, value: string) =>
    invoke<void>('storage_agent_memory_set', { session, key, value }),

  agentMemoryDelete: (session: string, key: string) =>
    invoke<void>('storage_agent_memory_delete', { session, key }),

  distillationSave: (id: string, type: DistillationType, contentMd: string, sourceIds: string[]) =>
    invoke<void>('storage_distillation_save', {
      id, distillation_type: type, content_md: contentMd, source_ids: sourceIds,
    }),

  distillationList: (type?: DistillationType) =>
    invoke<Distillation[]>('storage_distillation_list', { distillation_type: type ?? null }),
}

// ── Providers ─────────────────────────────────────────────────────────────────

export const providers = {
  list: () =>
    invoke<Provider[]>('providers_list'),

  save: (name: string, baseUrl: string, providerType: string, apiKey?: string) =>
    invoke<void>('providers_save', {
      name, base_url: baseUrl, provider_type: providerType, api_key: apiKey ?? null,
    }),

  delete: (name: string) =>
    invoke<void>('providers_delete', { name }),

  test: (name: string) =>
    invoke<boolean>('providers_test', { name }),

  stream: (provider: string, messages: Array<{ role: string; content: string }>, model?: string) =>
    invoke<string>('providers_stream', { provider, messages, model: model ?? null }),

  keystoreGet: (keyName: string) =>
    invoke<string | null>('keystore_get', { key_name: keyName }),

  keystoreSet: (keyName: string, value: string) =>
    invoke<void>('keystore_set', { key_name: keyName, value }),

  keystoreDelete: (keyName: string) =>
    invoke<void>('keystore_delete', { key_name: keyName }),
}

// ── Google ────────────────────────────────────────────────────────────────────

export const google = {
  calendarList: () =>
    invoke<CalendarEvent[]>('google_calendar_list'),

  calendarCreate: (title: string, start: string, end?: string, description?: string) =>
    invoke<CalendarEvent>('google_calendar_create', {
      title, start, end: end ?? null, description: description ?? null,
    }),

  calendarUpdate: (eventId: string, opts: { title?: string; start?: string; end?: string }) =>
    invoke<CalendarEvent>('google_calendar_update', {
      event_id: eventId,
      title: opts.title ?? null,
      start: opts.start ?? null,
      end: opts.end ?? null,
    }),

  calendarDelete: (eventId: string) =>
    invoke<void>('google_calendar_delete', { event_id: eventId }),

  gmailList: () =>
    invoke<GmailMessage[]>('google_gmail_list'),

  gmailGet: (messageId: string) =>
    invoke<GmailMessage>('google_gmail_get', { message_id: messageId }),

  driveList: () =>
    invoke<DriveFile[]>('google_drive_list'),

  driveGet: (fileId: string) =>
    invoke<string>('google_drive_get', { file_id: fileId }),
}

// ── OAuth ─────────────────────────────────────────────────────────────────────

export const oauth = {
  start: (provider: string) =>
    invoke<string>('oauth_start', { provider }),

  callback: (provider: string, code: string) =>
    invoke<OAuthStatus>('oauth_callback', { provider, code }),

  status: (provider: string) =>
    invoke<OAuthStatus>('oauth_status', { provider }),

  revoke: (provider: string) =>
    invoke<void>('oauth_revoke', { provider }),

  refresh: (provider: string) =>
    invoke<OAuthStatus>('oauth_refresh', { provider }),
}
