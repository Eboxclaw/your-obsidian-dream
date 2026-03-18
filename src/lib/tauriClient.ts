/**
 * tauriClient.ts — Typed wrappers around Tauri invoke() commands.
 * All data flows through here. No localStorage, no fetch().
 *
 * When the Rust backend is not available (web preview), these
 * return stub data so the UI can render without crashing.
 */

import type {
  Note,
  KanbanBoard,
  KanbanCard,
  Folder,
  AgentConfig,
  AgentSkill,
  AgentRole,
  AgentSession,
  GraphNode,
  GraphEdge,
  VaultStatus,
  VaultEntry,
  ProviderConfig,
  OAuthStatus,
  SearchResult,
  AgentMemory,
  SRIRoute,
  CustomTemplate,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tauriAvailable: boolean | null = null;

async function isTauri(): Promise<boolean> {
  if (tauriAvailable !== null) return tauriAvailable;
  try {
    const mod = await import('@tauri-apps/api/core');
    tauriAvailable = typeof mod.invoke === 'function';
  } catch {
    tauriAvailable = false;
  }
  return tauriAvailable;
}

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!(await isTauri())) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function noteList(): Promise<Note[] | null> {
  return safeInvoke<Note[]>('note_list');
}

export async function noteGet(id: string): Promise<Note | null> {
  return safeInvoke<Note>('note_get', { id });
}

export async function noteRead(id: string): Promise<string | null> {
  return safeInvoke<string>('note_read', { id });
}

export async function noteWrite(id: string, content: string): Promise<boolean | null> {
  return safeInvoke<boolean>('note_write', { id, content });
}

export async function noteCreate(title: string, content: string, folderId: string | null): Promise<Note | null> {
  return safeInvoke<Note>('note_create', { title, content, folderId });
}

export async function notePatch(id: string, updates: Partial<Note>): Promise<Note | null> {
  return safeInvoke<Note>('note_patch', { id, updates });
}

export async function noteUpdate(id: string, title: string, content: string, tags: string[]): Promise<Note | null> {
  return safeInvoke<Note>('note_update', { id, title, content, tags });
}

export async function noteDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('note_delete', { id });
}

export async function noteMove(id: string, folderId: string | null): Promise<boolean | null> {
  return safeInvoke<boolean>('note_move', { id, folderId });
}

export async function noteRename(id: string, title: string): Promise<boolean | null> {
  return safeInvoke<boolean>('note_rename', { id, title });
}

export async function noteSearch(query: string): Promise<Note[] | null> {
  return safeInvoke<Note[]>('note_search', { query });
}

export async function noteSearchTags(tags: string[]): Promise<Note[] | null> {
  return safeInvoke<Note[]>('note_search_tags', { tags });
}

export async function noteGetFrontmatter(id: string): Promise<Record<string, unknown> | null> {
  return safeInvoke<Record<string, unknown>>('note_get_frontmatter', { id });
}

export async function noteSetFrontmatter(id: string, frontmatter: Record<string, unknown>): Promise<boolean | null> {
  return safeInvoke<boolean>('note_set_frontmatter', { id, frontmatter });
}

export async function noteGetLinks(id: string): Promise<string[] | null> {
  return safeInvoke<string[]>('note_get_links', { id });
}

export async function noteGetBacklinks(id: string): Promise<string[] | null> {
  return safeInvoke<string[]>('note_get_backlinks', { id });
}

export async function noteGetOrphans(): Promise<Note[] | null> {
  return safeInvoke<Note[]>('note_get_orphans');
}

export async function noteDailyGet(date: string): Promise<Note | null> {
  return safeInvoke<Note>('note_daily_get', { date });
}

export async function noteDailyCreate(date: string): Promise<Note | null> {
  return safeInvoke<Note>('note_daily_create', { date });
}

export async function noteSnapshot(id: string): Promise<string | null> {
  return safeInvoke<string>('note_snapshot', { id });
}

export async function noteRestore(id: string, snapshotId: string): Promise<boolean | null> {
  return safeInvoke<boolean>('note_restore', { id, snapshotId });
}

export async function noteStats(): Promise<{ total: number; private_: number; orphans: number } | null> {
  return safeInvoke<{ total: number; private_: number; orphans: number }>('note_stats');
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function folderList(): Promise<Folder[] | null> {
  return safeInvoke<Folder[]>('folder_list');
}

export async function folderCreate(name: string, parentId: string | null): Promise<Folder | null> {
  return safeInvoke<Folder>('folder_create', { name, parentId });
}

export async function folderRename(id: string, name: string): Promise<boolean | null> {
  return safeInvoke<boolean>('folder_rename', { id, name });
}

export async function folderDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('folder_delete', { id });
}

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------

export async function boardList(): Promise<KanbanBoard[] | null> {
  return safeInvoke<KanbanBoard[]>('board_list');
}

export async function boardGet(id: string): Promise<KanbanBoard | null> {
  return safeInvoke<KanbanBoard>('board_get', { id });
}

export async function boardCreate(title: string, folderId: string | null): Promise<KanbanBoard | null> {
  return safeInvoke<KanbanBoard>('board_create', { title, folderId });
}

export async function boardUpdate(board: KanbanBoard): Promise<KanbanBoard | null> {
  return safeInvoke<KanbanBoard>('board_update', { board });
}

export async function boardDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('board_delete', { id });
}

export async function cardList(boardId: string): Promise<KanbanCard[] | null> {
  return safeInvoke<KanbanCard[]>('card_list', { boardId });
}

export async function cardCreate(card: Omit<KanbanCard, 'id' | 'created'>): Promise<KanbanCard | null> {
  return safeInvoke<KanbanCard>('card_create', { card });
}

export async function cardRead(id: string): Promise<KanbanCard | null> {
  return safeInvoke<KanbanCard>('card_read', { id });
}

export async function cardUpdate(card: KanbanCard): Promise<KanbanCard | null> {
  return safeInvoke<KanbanCard>('card_update', { card });
}

export async function cardDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('card_delete', { id });
}

export async function cardMove(cardId: string, fromColId: string, toColId: string, index: number): Promise<boolean | null> {
  return safeInvoke<boolean>('card_move', { cardId, fromColId, toColId, index });
}

export async function kanbanExport(boardId: string, format: string): Promise<string | null> {
  return safeInvoke<string>('kanban_export', { boardId, format });
}

// ---------------------------------------------------------------------------
// Vault
// ---------------------------------------------------------------------------

export async function vaultInit(pin: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_init', { pin });
}

export async function vaultUnlockPin(pin: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_unlock_pin', { pin });
}

export async function vaultUnlockBiometric(): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_unlock_biometric');
}

export async function vaultLock(): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_lock');
}

export async function vaultStatus(): Promise<VaultStatus | null> {
  return safeInvoke<VaultStatus>('vault_status');
}

export async function vaultCreate(key: string, value: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_create', { key, value });
}

export async function vaultRead(key: string): Promise<string | null> {
  return safeInvoke<string>('vault_read', { key });
}

export async function vaultWrite(key: string, value: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_write', { key, value });
}

export async function vaultDeleteEntry(key: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_delete', { key });
}

export async function vaultListEntries(): Promise<VaultEntry[] | null> {
  return safeInvoke<VaultEntry[]>('vault_list');
}

export async function vaultChangePin(currentPin: string, newPin: string): Promise<boolean | null> {
  return safeInvoke<boolean>('vault_change_pin', { currentPin, newPin });
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

export async function graphGetNodes(): Promise<GraphNode[] | null> {
  return safeInvoke<GraphNode[]>('graph_get_nodes');
}

export async function graphGetEdges(): Promise<GraphEdge[] | null> {
  return safeInvoke<GraphEdge[]>('graph_get_edges');
}

export async function graphRebuild(): Promise<boolean | null> {
  return safeInvoke<boolean>('graph_rebuild');
}

export async function graphGetConnected(nodeId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] } | null> {
  return safeInvoke<{ nodes: GraphNode[]; edges: GraphEdge[] }>('graph_get_connected', { nodeId });
}

export async function graphData(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] } | null> {
  return safeInvoke<{ nodes: GraphNode[]; edges: GraphEdge[] }>('graph_data');
}

// ---------------------------------------------------------------------------
// SRI (Smart Routing Intelligence)
// ---------------------------------------------------------------------------

export async function sriRoute(prompt: string, context: string): Promise<SRIRoute | null> {
  return safeInvoke<SRIRoute>('sri_route', { prompt, context });
}

export async function sriEmbedStore(noteId: string, text: string): Promise<boolean | null> {
  return safeInvoke<boolean>('sri_embed_store', { noteId, text });
}

export async function sriCacheQuery(query: string): Promise<string | null> {
  return safeInvoke<string>('sri_cache_query', { query });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function storageInit(): Promise<boolean | null> {
  return safeInvoke<boolean>('storage_init');
}

export async function storageNoteIndex(noteId: string, title: string, content: string): Promise<boolean | null> {
  return safeInvoke<boolean>('storage_note_index', { noteId, title, content });
}

export async function storageNoteRemove(noteId: string): Promise<boolean | null> {
  return safeInvoke<boolean>('storage_note_remove', { noteId });
}

export async function storageSearchFulltext(query: string, limit: number): Promise<SearchResult[] | null> {
  return safeInvoke<SearchResult[]>('storage_search_fulltext', { query, limit });
}

export async function storageAgentMemoryStore(memory: Omit<AgentMemory, 'id'>): Promise<AgentMemory | null> {
  return safeInvoke<AgentMemory>('storage_agent_memory_store', { memory });
}

export async function storageAgentMemorySearch(sessionId: string, query: string, topK: number): Promise<AgentMemory[] | null> {
  return safeInvoke<AgentMemory[]>('storage_agent_memory_search', { sessionId, query, topK });
}

export async function storageAgentMemoryClear(sessionId: string): Promise<boolean | null> {
  return safeInvoke<boolean>('storage_agent_memory_clear', { sessionId });
}

export async function storageDistillationStore(key: string, value: string): Promise<boolean | null> {
  return safeInvoke<boolean>('storage_distillation_store', { key, value });
}

export async function storageDistillationGet(key: string): Promise<string | null> {
  return safeInvoke<string>('storage_distillation_get', { key });
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export async function providersList(): Promise<ProviderConfig[] | null> {
  return safeInvoke<ProviderConfig[]>('providers_list');
}

export async function providersSave(config: ProviderConfig): Promise<boolean | null> {
  return safeInvoke<boolean>('providers_save', { config });
}

export async function providersDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('providers_delete', { id });
}

export async function providersTest(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('providers_test', { id });
}

export async function providersStream(providerId: string, prompt: string, sessionId: string): Promise<boolean | null> {
  return safeInvoke<boolean>('providers_stream', { providerId, prompt, sessionId });
}

// ---------------------------------------------------------------------------
// Keystore (API keys via vault SQLite)
// ---------------------------------------------------------------------------

export async function keystoreGet(keyName: string): Promise<string | null> {
  return safeInvoke<string>('keystore_get', { keyName });
}

export async function keystoreSet(keyName: string, value: string): Promise<boolean | null> {
  return safeInvoke<boolean>('keystore_set', { keyName, value });
}

export async function keystoreDelete(keyName: string): Promise<boolean | null> {
  return safeInvoke<boolean>('keystore_delete', { keyName });
}

// ---------------------------------------------------------------------------
// Google integrations
// ---------------------------------------------------------------------------

export async function googleCalendarList(): Promise<unknown[] | null> {
  return safeInvoke<unknown[]>('google_calendar_list');
}

export async function googleCalendarEvents(calendarId: string): Promise<unknown[] | null> {
  return safeInvoke<unknown[]>('google_calendar_events', { calendarId });
}

export async function googleCalendarCreateEvent(calendarId: string, event: Record<string, unknown>): Promise<unknown | null> {
  return safeInvoke<unknown>('google_calendar_create_event', { calendarId, event });
}

export async function googleGmailList(query: string, maxResults: number): Promise<unknown[] | null> {
  return safeInvoke<unknown[]>('google_gmail_list', { query, maxResults });
}

export async function googleGmailRead(messageId: string): Promise<unknown | null> {
  return safeInvoke<unknown>('google_gmail_read', { messageId });
}

export async function googleGmailSend(to: string, subject: string, body: string): Promise<boolean | null> {
  return safeInvoke<boolean>('google_gmail_send', { to, subject, body });
}

export async function googleDriveList(folderId: string | null): Promise<unknown[] | null> {
  return safeInvoke<unknown[]>('google_drive_list', { folderId });
}

export async function googleDriveUpload(name: string, content: string, folderId: string | null): Promise<unknown | null> {
  return safeInvoke<unknown>('google_drive_upload', { name, content, folderId });
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export async function oauthStart(provider: string): Promise<string | null> {
  return safeInvoke<string>('oauth_start', { provider });
}

export async function oauthCallback(provider: string, code: string): Promise<boolean | null> {
  return safeInvoke<boolean>('oauth_callback', { provider, code });
}

export async function oauthStatus(provider: string): Promise<OAuthStatus | null> {
  return safeInvoke<OAuthStatus>('oauth_status', { provider });
}

export async function oauthRevoke(provider: string): Promise<boolean | null> {
  return safeInvoke<boolean>('oauth_revoke', { provider });
}

export async function oauthRefresh(provider: string): Promise<boolean | null> {
  return safeInvoke<boolean>('oauth_refresh', { provider });
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export async function agentList(): Promise<AgentConfig[] | null> {
  return safeInvoke<AgentConfig[]>('agent_list');
}

export async function agentCreate(agent: Omit<AgentConfig, 'id'>): Promise<AgentConfig | null> {
  return safeInvoke<AgentConfig>('agent_create', { agent });
}

export async function agentUpdate(agent: AgentConfig): Promise<AgentConfig | null> {
  return safeInvoke<AgentConfig>('agent_update', { agent });
}

export async function agentDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('agent_delete', { id });
}

export async function skillList(): Promise<AgentSkill[] | null> {
  return safeInvoke<AgentSkill[]>('skill_list');
}

export async function roleList(): Promise<AgentRole[] | null> {
  return safeInvoke<AgentRole[]>('role_list');
}

export async function sessionList(): Promise<AgentSession[] | null> {
  return safeInvoke<AgentSession[]>('session_list');
}

export async function sessionCreate(title: string): Promise<AgentSession | null> {
  return safeInvoke<AgentSession>('session_create', { title });
}

export async function sessionDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('session_delete', { id });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function templateList(): Promise<CustomTemplate[] | null> {
  return safeInvoke<CustomTemplate[]>('template_list');
}

export async function templateCreate(template: Omit<CustomTemplate, 'id' | 'created'>): Promise<CustomTemplate | null> {
  return safeInvoke<CustomTemplate>('template_create', { template });
}

export async function templateUpdate(template: CustomTemplate): Promise<CustomTemplate | null> {
  return safeInvoke<CustomTemplate>('template_update', { template });
}

export async function templateDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('template_delete', { id });
}
