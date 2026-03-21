import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Fingerprint, LockKeyhole } from 'lucide-react';

export function LockScreen() {
  const { unlockWithPin, unlockWithBiometric, vaultStatus } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinUnlock = async () => {
    try {
      const ok = await unlockWithPin(pin);
      if (!ok) {
        setError('Unable to unlock vault with PIN.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed.');
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const ok = await unlockWithBiometric();
      if (!ok) {
        setError('Biometric unlock failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric unlock failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-xs rounded-3xl border bg-card p-6 text-center shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="h-8 w-8 text-foreground" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Vault Locked</h2>
        <p className="mt-1 text-xs text-muted-foreground">Unlock to access notebook, kanban, agents, and settings.</p>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="mt-4 w-full rounded-xl border bg-background px-3 py-2 text-center text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePinUnlock();
            }
          }}
        />

        <button
          onClick={handlePinUnlock}
          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
        >
          Unlock with PIN
        </button>

        {vaultStatus.biometricAvailable && (
          <button
            onClick={handleBiometricUnlock}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm"
          >
            <Fingerprint className="h-4 w-4" />
            Unlock with Biometrics
          </button>
        )}

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
