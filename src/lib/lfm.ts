import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface LLMStreamCallbacks {
  onDelta: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function loadModel(model: string): Promise<string> {
  return invoke<string>('load_model', { model });
}

export async function downloadModel(model: string): Promise<string> {
  return invoke<string>('download_model', { model });
}

export async function createConversation(
  modelId: string,
  systemPrompt: string | null
): Promise<string> {
  return invoke<string>('create_conversation', {
    modelId,
    systemPrompt: systemPrompt !== null && systemPrompt !== undefined ? systemPrompt : null,
  });
}

export async function generateText(
  conversationId: string,
  message: string
): Promise<string> {
  return invoke<string>('generate_text', { conversationId, message });
}

export async function stopGeneration(generationId: string): Promise<void> {
  return invoke<void>('stop_generation', { generationId });
}

export async function onToken(handler: (token: string) => void): Promise<UnlistenFn> {
  return listen<string>('llm-delta', (event) => {
    handler(event.payload);
  });
}

export async function onDone(handler: () => void): Promise<UnlistenFn> {
  return listen('llm-done', () => {
    handler();
  });
}

export async function onError(handler: (error: string) => void): Promise<UnlistenFn> {
  return listen<string>('llm-error', (event) => {
    handler(event.payload);
  });
}

export async function useStream(callbacks: LLMStreamCallbacks): Promise<UnlistenFn> {
  const unlistenToken = await onToken(callbacks.onDelta);
  const unlistenDone = await onDone(callbacks.onDone);
  const unlistenError = await onError(callbacks.onError);

  return () => {
    unlistenToken();
    unlistenDone();
    unlistenError();
  };
}

export async function listenToProviderStream(callbacks: LLMStreamCallbacks): Promise<UnlistenFn> {
  return useStream(callbacks);
}
