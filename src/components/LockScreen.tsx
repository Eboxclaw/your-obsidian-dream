import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Fingerprint, KeyRound } from 'lucide-react';

export function LockScreen() {
  const { unlockWithPin, unlockWithBiometric, vaultStatus } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordUnlock = async () => {
    try {
      const ok = await unlockWithPin(password);
      if (!ok) {
        setError('Incorrect password.');
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
            <Fingerprint className="h-8 w-8 text-foreground" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-xs text-muted-foreground">Unlock to access your vault.</p>

        {!showPassword && (
          <>
            <button
              onClick={handleBiometricUnlock}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              Unlock with Biometrics
            </button>
            <button
              onClick={() => setShowPassword(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" />
              Use Password
            </button>
          </>
        )}

        {showPassword && (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-4 w-full rounded-xl border bg-background px-3 py-2 text-center text-sm outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordUnlock();
                }
              }}
            />
            <button
              onClick={handlePasswordUnlock}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              Unlock
            </button>
            <button
              onClick={() => { setShowPassword(false); setError(''); }}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Back to biometrics
            </button>
          </>
        )}

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
