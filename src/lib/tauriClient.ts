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
} from '@/types';

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

export async function noteCreate(title: string, content: string, folderId: string | null): Promise<Note | null> {
  return safeInvoke<Note>('note_create', { title, content, folderId });
}

export async function noteUpdate(id: string, title: string, content: string, tags: string[]): Promise<Note | null> {
  return safeInvoke<Note>('note_update', { id, title, content, tags });
}

export async function noteDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('note_delete', { id });
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

export async function folderDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('folder_delete', { id });
}

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------

export async function boardList(): Promise<KanbanBoard[] | null> {
  return safeInvoke<KanbanBoard[]>('board_list');
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

export async function cardCreate(card: Omit<KanbanCard, 'id' | 'created'>): Promise<KanbanCard | null> {
  return safeInvoke<KanbanCard>('card_create', { card });
}

export async function cardUpdate(card: KanbanCard): Promise<KanbanCard | null> {
  return safeInvoke<KanbanCard>('card_update', { card });
}

export async function cardDelete(id: string): Promise<boolean | null> {
  return safeInvoke<boolean>('card_delete', { id });
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

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  title: string;
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export async function graphData(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] } | null> {
  return safeInvoke<{ nodes: GraphNode[]; edges: GraphEdge[] }>('graph_data');
}
