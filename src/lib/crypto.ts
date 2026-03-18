/**
 * crypto.ts — Vault encryption/decryption via Rust invoke().
 *
 * All cryptographic operations happen in Rust (vault.rs):
 *   - Key derivation: Argon2id
 *   - Encryption: AES-256-GCM
 *
 * This file NEVER performs any crypto in the frontend.
 * No WebCrypto, no CryptoJS, no key material in JS memory.
 */

import type { VaultStatus } from '@/lib/types';

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
// Vault lifecycle
// ---------------------------------------------------------------------------

/**
 * Initialize the vault for first-time setup with a PIN.
 * Creates the vault database and derives the master key via Argon2id.
 */
export async function vaultInit(pin: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('vault_init', { pin });
  return result === true;
}

/**
 * Unlock the vault for the session using a PIN.
 * Rust derives the key via Argon2id and holds it in memory.
 * Call once per session — never re-derive per request.
 */
export async function vaultUnlock(pin: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('vault_unlock', { pin });
  return result === true;
}

/**
 * Lock the vault — clears the derived key from Rust memory.
 */
export async function vaultLock(): Promise<boolean> {
  const result = await safeInvoke<boolean>('vault_lock');
  return result === true;
}

/**
 * Get full vault status including initialization and biometric state.
 */
export async function vaultGetStatus(): Promise<VaultStatus | null> {
  return safeInvoke<VaultStatus>('vault_status');
}

/**
 * Check whether the vault is currently unlocked (simple boolean).
 */
export async function vaultIsUnlocked(): Promise<boolean> {
  const status = await safeInvoke<VaultStatus>('vault_status');
  return status !== null && status.unlocked === true;
}

/**
 * Guard — throws if vault is not unlocked.
 * Use before any operation requiring vault access.
 */
export async function requireUnlocked(): Promise<void> {
  const unlocked = await vaultIsUnlocked();
  if (!unlocked) {
    throw new Error('Vault is locked. Unlock required before this operation.');
  }
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext. Returns a base64-encoded ciphertext string.
 * Vault must be unlocked first.
 */
export async function vaultEncrypt(plaintext: string): Promise<string | null> {
  return safeInvoke<string>('vault_encrypt', { plaintext });
}

/**
 * Decrypt a base64-encoded ciphertext string back to plaintext.
 * Vault must be unlocked first.
 */
export async function vaultDecrypt(ciphertext: string): Promise<string | null> {
  return safeInvoke<string>('vault_decrypt', { ciphertext });
}

// ---------------------------------------------------------------------------
// PIN management
// ---------------------------------------------------------------------------

/**
 * Set or change the vault PIN. Re-encrypts vault keys with the new PIN.
 */
export async function vaultSetPin(currentPin: string, newPin: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('vault_set_pin', { currentPin, newPin });
  return result === true;
}

/**
 * Check if a vault PIN has been configured (first-time setup check).
 */
export async function vaultHasPin(): Promise<boolean> {
  const result = await safeInvoke<boolean>('vault_has_pin');
  return result === true;
}

// ---------------------------------------------------------------------------
// Biometric enrollment
// ---------------------------------------------------------------------------

/**
 * Enroll biometric auth. Stores the vault key in Android Keystore
 * behind a BiometricPrompt gate. Handled entirely in Rust/Kotlin.
 */
export async function biometricEnroll(): Promise<boolean> {
  const result = await safeInvoke<boolean>('biometric_enroll');
  return result === true;
}

/**
 * Unlock vault via biometric. Retrieves key from Android Keystore.
 */
export async function biometricUnlock(): Promise<boolean> {
  const result = await safeInvoke<boolean>('biometric_unlock');
  return result === true;
}

/**
 * Check if biometric auth is available and enrolled.
 */
export async function biometricAvailable(): Promise<boolean> {
  const result = await safeInvoke<boolean>('biometric_available');
  return result === true;
}

// ---------------------------------------------------------------------------
// Keystore — API key management via vault SQLite
// ---------------------------------------------------------------------------

/**
 * Get an API key from the vault keystore.
 * Keys are stored encrypted in SQLite, never in frontend memory.
 */
export async function keystoreGet(keyName: string): Promise<string | null> {
  return safeInvoke<string>('keystore_get', { keyName });
}

/**
 * Store an API key in the vault keystore.
 * Encrypted at rest via AES-256-GCM.
 */
export async function keystoreSet(keyName: string, value: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('keystore_set', { keyName, value });
  return result === true;
}

/**
 * Delete an API key from the vault keystore.
 */
export async function keystoreDelete(keyName: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('keystore_delete', { keyName });
  return result === true;
}
