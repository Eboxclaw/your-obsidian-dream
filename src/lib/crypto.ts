import { invoke } from '@tauri-apps/api/core';
import type { VaultStatus } from '@/lib/types';

export async function encryptNote(plaintext: string, noteId: string): Promise<string> {
  return invoke<string>('vault_encrypt', { plaintext, noteId });
}

export async function decryptNote(ciphertext: string, noteId: string): Promise<string> {
  return invoke<string>('vault_decrypt', { ciphertext, noteId });
}

export async function unlockVault(pin: string): Promise<void> {
  await invoke('vault_unlock', { pin });
}

export async function lockVault(): Promise<void> {
  await invoke('vault_lock');
}

export async function vaultInit(pin: string): Promise<boolean> {
  const result = await invoke<boolean>('vault_init', { pin });
  return result === true;
}

export async function vaultUnlock(pin: string): Promise<boolean> {
  const result = await invoke<boolean>('vault_unlock_pin', { pin });
  return result === true;
}

export async function vaultGetStatus(): Promise<VaultStatus | null> {
  return invoke<VaultStatus>('vault_status');
}

export async function biometricUnlock(): Promise<boolean> {
  const result = await invoke<boolean>('vault_unlock_biometric');
  return result === true;
}

export async function keystoreGet(keyName: string): Promise<string | null> {
  return invoke<string | null>('vault_read', { key: keyName });
}

export async function keystoreSet(keyName: string, value: string): Promise<boolean> {
  const result = await invoke<boolean>('vault_write', { key: keyName, value });
  return result === true;
}

export async function keystoreDelete(keyName: string): Promise<boolean> {
  const result = await invoke<boolean>('vault_delete', { key: keyName });
  return result === true;
}
