/**
 * lfm.ts — LFM (Liquid Foundation Model) streaming interface.
 *
 * All LLM communication happens through Tauri events.
 * providers.rs handles the actual HTTP calls to model providers.
 * This file ONLY listens to Tauri events — no fetch(), no API keys.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMStreamCallbacks {
  onDelta: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
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
// Stream listener — subscribe to llm-delta / llm-done / llm-error
// ---------------------------------------------------------------------------

export async function subscribeLLMStream(callbacks: LLMStreamCallbacks): Promise<UnlistenFn> {
  if (!(await isTauri())) {
    // Return a no-op unlisten when not in Tauri
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
