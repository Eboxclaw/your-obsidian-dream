package com.vibo.app

import ai.liquid.leap.Conversation
import ai.liquid.leap.ModelRunner
import ai.liquid.leap.LeapClient
import ai.liquid.leap.GenerationOptions
import ai.liquid.leap.ModelLoadingOptions
import ai.liquid.leap.MessageResponse
import android.app.ActivityManager
import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.withContext

// ---------------------------------------------------------------------------
// ARCHITECTURE NOTES — read before editing
// ---------------------------------------------------------------------------
//
// LEAP SDK REAL API (confirmed from docs.liquid.ai, leap-sdk 0.6.0+):
//
//   ModelLoadingOptions  → { randomSeed: Long?, cpuThreads: Int = 2 }
//   GenerationOptions    → { temperature, topP, minP, repetitionPenalty,
//                            jsonSchemaConstraint, functionCallParser }
//
// CONFIRMED: kvCacheType does NOT exist in the LEAP Android SDK public API.
// Neither in ModelLoadingOptions nor GenerationOptions.
// The KV cache behaviour is controlled by the model bundle manifest.
//
// ACTION REQUIRED: Check the LFM2-350M-Extract bundle manifest JSON to
// confirm whether q4_0 KV cache is already baked in by Liquid AI.
// If not, open an issue at Liquid4All/cookbook or contact Liquid AI support.
// The roadmap's Flag 3 safety constraint cannot be enforced in code
// until this is confirmed.
//
// ChatML: The LEAP SDK applies the chat template internally from the bundle.
// Do NOT manually wrap prompts in <|im_start|> tags — that would
// double-wrap and break generation.
//
// Koog executor path: This class calls the LEAP SDK directly (in-process).
// It does NOT go through invoke("plugin:leap-ai|generate") — that IPC path
// is only for TSX->Rust->LEAP (user-facing chat). Koog agent loops must
// bypass the Tauri IPC entirely (roadmap Communication Patterns).
//
// topK: Not available in GenerationOptions. The research doc recommended
// topK=50 — that field does not exist in the SDK. minP is the closest
// functional equivalent.
//
// ---------------------------------------------------------------------------

private const val TAG = "LeapPromptExecutor"
private const val MIN_FREE_RAM_BYTES = 500L * 1024L * 1024L  // 500 MB

class InsufficientRamException(freeBytes: Long) : Exception(
    "Insufficient RAM for local inference. " +
    "Free: ${freeBytes / 1024 / 1024}MB, required: 500MB. " +
    "Caller must escalate to MultiLLMPromptExecutor."
)

class LeapPromptExecutor(
    private val context: Context,
    private val systemPrompt: String = "You are a helpful assistant.",
    private val cpuThreads: Int = 4
) {
    // Held alive for the lifetime of this executor.
    // If the ModelRunner is destroyed, conversations become read-only.
    private var modelRunner: ModelRunner? = null
    private var conversation: Conversation? = null

    // -----------------------------------------------------------------------
    // RAM pre-flight check
    // Call before loadModel(). If returns false, throw so KoogTauriPlugin
    // can escalate to MultiLLMPromptExecutor (cloud fallback).
    // -----------------------------------------------------------------------
    fun hasEnoughRam(): Boolean {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val info = ActivityManager.MemoryInfo()
        am.getMemoryInfo(info)
        Log.d(TAG, "RAM check: ${info.availMem / 1024 / 1024}MB free (required: 500MB)")
        return info.availMem >= MIN_FREE_RAM_BYTES
    }

    // -----------------------------------------------------------------------
    // Load model via LEAP SDK directly
    //
    // modelPath: absolute local path to the GGUF file.
    // This path must come from LeapDownloader — never constructed in TSX.
    //
    // cpuThreads = 4 is a reasonable starting point. Profile on real devices.
    // -----------------------------------------------------------------------
    suspend fun loadModel(modelPath: String) = withContext(Dispatchers.IO) {
        if (!hasEnoughRam()) {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val info = ActivityManager.MemoryInfo()
            am.getMemoryInfo(info)
            throw InsufficientRamException(info.availMem)
        }

        val options = ModelLoadingOptions.build {
            cpuThreads = this@LeapPromptExecutor.cpuThreads
        }

        modelRunner = LeapClient.loadModel(modelPath, options)
        conversation = modelRunner!!.createConversation(systemPrompt = systemPrompt)
        Log.d(TAG, "Model loaded: ${modelRunner!!.modelId}")
    }

    // -----------------------------------------------------------------------
    // execute() — Koog agent loop entry point. In-process, no Tauri IPC.
    //
    // Sampling params (confirmed available in GenerationOptions):
    //   temperature = 0.1f       → deterministic, needed for JSON tool output
    //   minP = 0.1f              → replaces topK (not in SDK); filters low-prob tokens
    //   repetitionPenalty = 1.05f → prevents looping
    //   topP: null               → fall back to bundle default
    //
    // Plain text only — no ChatML wrapping. SDK handles the template.
    // -----------------------------------------------------------------------
    suspend fun execute(prompt: String): String = withContext(Dispatchers.IO) {
        val conv = conversation
            ?: error("LeapPromptExecutor: call loadModel() before execute()")

        val options = GenerationOptions.build {
            temperature = 0.1f
            minP = 0.1f
            repetitionPenalty = 1.05f
        }

        val buffer = StringBuilder()

        conv.generateResponse(
            userTextMessage = prompt,
            generationOptions = options
        ).collect { response ->
            when (response) {
                is MessageResponse.Chunk -> buffer.append(response.text)
                is MessageResponse.Complete -> Unit
                else -> Unit
            }
        }

        buffer.toString()
    }

    // -----------------------------------------------------------------------
    // Reset conversation — between agent tasks, not between tokens.
    // -----------------------------------------------------------------------
    fun resetConversation(newSystemPrompt: String = systemPrompt) {
        conversation = modelRunner?.createConversation(systemPrompt = newSystemPrompt)
            ?: error("LeapPromptExecutor: model not loaded")
    }

    // -----------------------------------------------------------------------
    // Unload — call from onDestroy() inside a Dispatchers.IO coroutine.
    // Never block the main thread (ANR risk — roadmap Flag 2).
    //
    // Usage in AgentForegroundService.onDestroy():
    //   CoroutineScope(SupervisorJob() + Dispatchers.IO).launch { executor.unload() }
    // -----------------------------------------------------------------------
    suspend fun unload() = withContext(Dispatchers.IO) {
        modelRunner?.unload()
        modelRunner = null
        conversation = null
        Log.d(TAG, "Model unloaded and memory released")
    }
}
