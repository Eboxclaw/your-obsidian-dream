/**
 * leapClient.ts — Typed wrappers for tauri-plugin-leap-ai Kotlin plugin.
 * Handles embeddings, agent tool invocations, model lifecycle, and
 * streaming generation via the plugin bridge.
 *
 * All calls route through invoke('plugin:leap-ai|<command>').
 * No HTTP calls. No fetch(). No API keys in frontend.
 */

import type { RuntimeInfo, CachedModel } from '@/lib/types';

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

async function pluginInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!(await isTauri())) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(`plugin:leap-ai|${cmd}`, args);
}

// ---------------------------------------------------------------------------
// Runtime info — device capability check
// ---------------------------------------------------------------------------

export async function runtimeInfo(): Promise<RuntimeInfo | null> {
  return pluginInvoke<RuntimeInfo>('runtime_info');
}

// ---------------------------------------------------------------------------
// Model lifecycle — LEAP orchestrator
// ---------------------------------------------------------------------------

export async function downloadModel(modelId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('download_model', { modelId });
}

export async function loadModel(modelId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('load_model', { modelId });
}

export async function loadCachedModel(modelId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('load_cached_model', { modelId });
}

export async function listCachedModels(): Promise<CachedModel[] | null> {
  return pluginInvoke<CachedModel[]>('list_cached_models');
}

export async function removeCachedModel(modelId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('remove_cached_model', { modelId });
}

export async function unloadModel(): Promise<boolean | null> {
  return pluginInvoke<boolean>('unload_model');
}

export interface ModelStatus {
  loaded: boolean;
  modelId: string | null;
  memoryMb: number;
}

export async function modelStatus(): Promise<ModelStatus | null> {
  return pluginInvoke<ModelStatus>('model_status');
}

// ---------------------------------------------------------------------------
// Conversation management
// ---------------------------------------------------------------------------

export async function createConversation(systemPrompt: string): Promise<string | null> {
  return pluginInvoke<string>('create_conversation', { systemPrompt });
}

export async function createConversationFromHistory(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  return pluginInvoke<string>('create_conversation_from_history', { messages });
}

// ---------------------------------------------------------------------------
// Streaming generation
// ---------------------------------------------------------------------------

export async function generate(conversationId: string, prompt: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('generate', { conversationId, prompt });
}

export async function stopGeneration(): Promise<boolean | null> {
  return pluginInvoke<boolean>('stop_generation');
}

// ---------------------------------------------------------------------------
// Embeddings — ONNX all-MiniLM-L6-v2 (on-device)
// ---------------------------------------------------------------------------

export async function embed(text: string): Promise<number[] | null> {
  return pluginInvoke<number[]>('embed', { text });
}

export async function embedBatch(texts: string[]): Promise<number[][] | null> {
  return pluginInvoke<number[][]>('embed_batch', { texts });
}

// ---------------------------------------------------------------------------
// Semantic search — cosine similarity over embeddings
// ---------------------------------------------------------------------------

export interface SemanticResult {
  noteId: string;
  score: number;
}

export async function semanticSearch(query: string, topK: number): Promise<SemanticResult[] | null> {
  return pluginInvoke<SemanticResult[]>('semantic_search', { query, topK });
}

// ---------------------------------------------------------------------------
// Agent execution — triggers KoogAgent.kt
// ---------------------------------------------------------------------------

export async function agentRun(sessionId: string, prompt: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('agent_run', { sessionId, prompt });
}

export async function agentStop(sessionId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('agent_stop', { sessionId });
}
