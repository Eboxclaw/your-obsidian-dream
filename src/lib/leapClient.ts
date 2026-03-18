/**
 * leapClient.ts — Typed wrappers for tauri-plugin-leap-ai Kotlin plugin.
 * Handles embeddings and agent tool invocations via the plugin bridge.
 *
 * All calls route through invoke('plugin:leap-ai|<command>').
 * No HTTP calls. No fetch(). No API keys in frontend.
 */

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

// ---------------------------------------------------------------------------
// Model lifecycle — LEAP orchestrator
// ---------------------------------------------------------------------------

export async function modelLoad(modelId: string): Promise<boolean | null> {
  return pluginInvoke<boolean>('model_load', { modelId });
}

export async function modelUnload(): Promise<boolean | null> {
  return pluginInvoke<boolean>('model_unload');
}

export interface ModelStatus {
  loaded: boolean;
  modelId: string | null;
  memoryMb: number;
}

export async function modelStatus(): Promise<ModelStatus | null> {
  return pluginInvoke<ModelStatus>('model_status');
}
