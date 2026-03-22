import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Cloud, Shield } from 'lucide-react';
import { keystoreGet, keystoreSet, vaultGetStatus } from '@/lib/crypto';
import { oauthStart } from '@/lib/tauriClient';
import { runtimeInfo } from '@/lib/leapClient';

export function SettingsView() {
  const { notes, boards, cards, ui, vaultStatus, refreshVaultStatus } = useStore();
  const [providerKey, setProviderKey] = useState('');
  const [model, setModel] = useState('llama3');
  const [deviceInfo, setDeviceInfo] = useState('Loading runtime...');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const key = await keystoreGet('provider.ollama.api_key');
        if (key) {
          setProviderKey(key);
        }
        const info = await runtimeInfo();
        if (info) {
          setDeviceInfo(info.deviceName + ' • ' + info.availableRamMb + ' MB RAM');
        } else {
          setDeviceInfo('Runtime unavailable');
        }
      } catch (err) {
        setStatusText(err instanceof Error ? err.message : 'Unable to load settings.');
      }
    };
    loadSettings();
  }, []);

  const handleSaveProvider = async () => {
    try {
      const saved = await keystoreSet('provider.ollama.api_key', providerKey);
      setStatusText(saved ? 'Provider key stored in vault keystore.' : 'Provider key was not saved.');
    } catch (err) {
      setStatusText(err instanceof Error ? err.message : 'Provider key save failed.');
    }
  };

  const handleGoogleOauth = async () => {
    try {
      await oauthStart('google');
      setStatusText('Google OAuth flow started.');
    } catch (err) {
      setStatusText(err instanceof Error ? err.message : 'Unable to start Google OAuth.');
    }
  };

  const handleRefreshVault = async () => {
    try {
      await refreshVaultStatus();
      const status = await vaultGetStatus();
      if (status) {
        setStatusText(status.unlocked ? 'Vault is unlocked.' : 'Vault is locked.');
      }
    } catch (err) {
      setStatusText(err instanceof Error ? err.message : 'Unable to refresh vault status.');
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-8 space-y-5">
      <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>

      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Runtime</h2>
        <p className="text-sm text-foreground">{deviceInfo}</p>
      </section>

      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cloud Provider Key</h2>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Ollama-compatible provider</span>
        </div>
        <input
          value={providerKey}
          onChange={(e) => setProviderKey(e.target.value)}
          placeholder="API Key"
          type="password"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
        />
        <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
          <option value="llama3">Llama 3</option>
          <option value="mistral">Mistral</option>
          <option value="phi3">Phi-3</option>
        </select>
        <button onClick={handleSaveProvider} className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground">Save Key to Keystore</button>
      </section>

      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Security</h2>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Vault: {vaultStatus.unlocked ? 'Unlocked' : 'Locked'}</span>
        </div>
        <button onClick={handleRefreshVault} className="w-full rounded-xl border py-2 text-sm">Refresh Vault Status</button>
        <button onClick={handleGoogleOauth} className="w-full rounded-xl border py-2 text-sm">Connect Google OAuth</button>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Vault Stats</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground"><span>Notes</span><span className="font-mono text-foreground">{notes.length}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Boards</span><span className="font-mono text-foreground">{boards.length}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Cards</span><span className="font-mono text-foreground">{cards.length}</span></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Diagnostics</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground"><span>Store mode</span><span className="font-mono text-foreground">{ui.diagnosticsMode}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Fallback data</span><span className="font-mono text-foreground">{ui.fallbackDataActive ? 'active' : 'off'}</span></div>
        </div>
      </section>

      {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}
    </div>
  );
}
