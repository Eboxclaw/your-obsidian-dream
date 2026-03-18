/**
 * lfm.ts — LFM (Liquid Foundation Model) streaming interface.
 *
 * All LLM communication happens through Tauri events.
 * providers.rs handles the actual HTTP calls to model providers.
 * This file ONLY listens to Tauri events — no fetch(), no API keys.
 */

import type { DownloadProgress } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMStreamCallbacks {
  onDelta: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export interface AgentEventCallbacks {
  onThinking: (text: string) => void;
  onToolCall: (tool: string, args: string) => void;
  onToolResult: (tool: string, result: string) => void;
  onDone: (summary: string) => void;
  onError: (error: string) => void;
}

export interface DownloadProgressCallbacks {
  onProgress: (progress: DownloadProgress) => void;
  onComplete: (modelId: string) => void;
  onError: (modelId: string, error: string) => void;
}

interface UnlistenFn {
  (): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tauriAvailable: boolean | null = null;

async function isTauri(): Promise<boolean> {
  if (tauriAvailable !== null) return tauriAvailable;
  try {
    const mod = await import('@tauri-apps/api/event');
    tauriAvailable = typeof mod.listen === 'function';
  } catch {
    tauriAvailable = false;
  }
  return tauriAvailable;
}

// ---------------------------------------------------------------------------
// Cloud LLM stream — llm-delta / llm-done / llm-error (providers.rs)
// ---------------------------------------------------------------------------

export async function subscribeLLMStream(callbacks: LLMStreamCallbacks): Promise<UnlistenFn> {
  if (!(await isTauri())) {
    return () => {};
  }

  const { listen } = await import('@tauri-apps/api/event');
  const unlisteners: UnlistenFn[] = [];

  const u1 = await listen<string>('llm-delta', (e) => {
    callbacks.onDelta(e.payload);
  });
  unlisteners.push(u1);

  const u2 = await listen<string>('llm-done', (e) => {
    callbacks.onDone(e.payload);
  });
  unlisteners.push(u2);

  const u3 = await listen<string>('llm-error', (e) => {
    callbacks.onError(e.payload);
  });
  unlisteners.push(u3);

  return () => {
    unlisteners.forEach((fn) => fn());
  };
}

// ---------------------------------------------------------------------------
// Local model stream — leap-ai:token (LEAP plugin, on-device)
// ---------------------------------------------------------------------------

export async function subscribeLocalStream(callbacks: LLMStreamCallbacks): Promise<UnlistenFn> {
  if (!(await isTauri())) {
    return () => {};
  }

  const { listen } = await import('@tauri-apps/api/event');
  const unlisteners: UnlistenFn[] = [];

  const u1 = await listen<string>('leap-ai:token', (e) => {
    callbacks.onDelta(e.payload);
  });
  unlisteners.push(u1);

  const u2 = await listen<string>('leap-ai:done', (e) => {
    callbacks.onDone(e.payload);
  });
  unlisteners.push(u2);

  const u3 = await listen<string>('leap-ai:error', (e) => {
    callbacks.onError(e.payload);
  });
  unlisteners.push(u3);

  return () => {
    unlisteners.forEach((fn) => fn());
  };
}

// ---------------------------------------------------------------------------
// Agent lifecycle events
// ---------------------------------------------------------------------------

export async function subscribeAgentEvents(callbacks: AgentEventCallbacks): Promise<UnlistenFn> {
  if (!(await isTauri())) {
    return () => {};
  }

  const { listen } = await import('@tauri-apps/api/event');
  const unlisteners: UnlistenFn[] = [];

  const u1 = await listen<string>('agent:thinking', (e) => {
    callbacks.onThinking(e.payload);
  });
  unlisteners.push(u1);

  const u2 = await listen<{ tool: string; args: string }>('agent:tool-call', (e) => {
    callbacks.onToolCall(e.payload.tool, e.payload.args);
  });
  unlisteners.push(u2);

  const u3 = await listen<{ tool: string; result: string }>('agent:tool-result', (e) => {
    callbacks.onToolResult(e.payload.tool, e.payload.result);
  });
  unlisteners.push(u3);

  const u4 = await listen<string>('agent:done', (e) => {
    callbacks.onDone(e.payload);
  });
  unlisteners.push(u4);

  const u5 = await listen<string>('agent:error', (e) => {
    callbacks.onError(e.payload);
  });
  unlisteners.push(u5);

  return () => {
    unlisteners.forEach((fn) => fn());
  };
}

// ---------------------------------------------------------------------------
// Model download progress
// ---------------------------------------------------------------------------

export async function subscribeDownloadProgress(callbacks: DownloadProgressCallbacks): Promise<UnlistenFn> {
  if (!(await isTauri())) {
    return () => {};
  }

  const { listen } = await import('@tauri-apps/api/event');
  const unlisteners: UnlistenFn[] = [];

  const u1 = await listen<DownloadProgress>('model:download-progress', (e) => {
    callbacks.onProgress(e.payload);
  });
  unlisteners.push(u1);

  const u2 = await listen<string>('model:download-complete', (e) => {
    callbacks.onComplete(e.payload);
  });
  unlisteners.push(u2);

  const u3 = await listen<{ modelId: string; error: string }>('model:download-error', (e) => {
    callbacks.onError(e.payload.modelId, e.payload.error);
  });
  unlisteners.push(u3);

  return () => {
    unlisteners.forEach((fn) => fn());
  };
}

// ---------------------------------------------------------------------------
// Prompt — send a prompt to the loaded LFM model via invoke()
// ---------------------------------------------------------------------------

export async function sendPrompt(
  sessionId: string,
  prompt: string,
  modelId: string
): Promise<boolean> {
  if (!(await isTauri())) return false;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<boolean>('llm_prompt', { sessionId, prompt, modelId });
}

// ---------------------------------------------------------------------------
// Cancel — abort an in-flight generation
// ---------------------------------------------------------------------------

export async function cancelGeneration(sessionId: string): Promise<boolean> {
  if (!(await isTauri())) return false;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<boolean>('llm_cancel', { sessionId });
}
