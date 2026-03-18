// leapClient.ts — Typed wrappers for tauri-plugin-leap-ai commands
// Used directly by ChatAssistant.tsx for the chat UI.
// Agent model calls go through LeapPromptExecutor.kt (Kotlin) — not here.
// This file is TSX → Leap only. Never used by Koog internally.

import { invoke } from '@tauri-apps/api/core'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeapModel {
  id: string
  name: string
  size_bytes: number
  downloaded: boolean
  loaded: boolean
}

export interface LeapDownloadProgress {
  model_id: string
  bytes_downloaded: number
  bytes_total: number
  percent: number
  done: boolean
}

export interface LeapGenerateArgs {
  prompt: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  conversation_id?: string
}

export interface LeapRuntimeInfo {
  backend: 'llama_cpp' | 'leap_sdk'   // desktop vs mobile
  model_loaded: boolean
  model_id: string | null
  context_length: number
  threads: number
}

// ── Model management ──────────────────────────────────────────────────────────

export const leap = {

  // List models that are cached locally
  listCachedModels: () =>
    invoke<LeapModel[]>('plugin:leap-ai|list_cached_models'),

  // Download a model — progress streamed via listen('leap-ai:download-progress')
  downloadModel: (modelId: string) =>
    invoke<void>('plugin:leap-ai|download_model', { model_id: modelId }),

  // Load a downloaded model into inference context
  loadModel: (modelId: string) =>
    invoke<void>('plugin:leap-ai|load_model', { model_id: modelId }),

  // Unload current model — frees RAM
  unloadModel: () =>
    invoke<void>('plugin:leap-ai|unload_model'),

  // Generate a completion — non-streaming
  generate: (args: LeapGenerateArgs) =>
    invoke<{ text: string }>('plugin:leap-ai|generate', {
      prompt: args.prompt,
      max_tokens: args.max_tokens ?? 512,
      temperature: args.temperature ?? 0.7,
      stream: false,
      conversation_id: args.conversation_id ?? null,
    }),

  // Start streaming generation — tokens arrive via listen('leap-ai:token')
  generateStream: (args: LeapGenerateArgs) =>
    invoke<void>('plugin:leap-ai|generate', {
      prompt: args.prompt,
      max_tokens: args.max_tokens ?? 1024,
      temperature: args.temperature ?? 0.7,
      stream: true,
      conversation_id: args.conversation_id ?? null,
    }),

  // Create a conversation context (maintains history on native side)
  createConversation: (systemPrompt?: string) =>
    invoke<{ conversation_id: string }>('plugin:leap-ai|create_conversation', {
      system_prompt: systemPrompt ?? null,
    }),

  // Runtime info — which backend, what model, context size
  runtimeInfo: () =>
    invoke<LeapRuntimeInfo>('plugin:leap-ai|runtime_info'),
}
