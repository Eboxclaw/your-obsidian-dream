import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Sun,
  Moon,
  Shield,
  Fingerprint,
  RotateCcw,
  Trash2,
  Cpu,
  Cloud,
} from 'lucide-react';

const MODELS = [
  { id: 'lfm-instruct', name: 'LFM 2.5 Instruct', size: '3.2B', active: false },
  { id: 'lfm-thinking', name: 'LFM 2.5 Thinking', size: '7B', active: false },
  { id: 'lfm-chat', name: 'LFM 2.5 Chat', size: '1.5B', active: true },
];

export function SettingsView() {
  const { notes, boards, cards, resetAllData } = useStore();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [biometrics, setBiometrics] = useState(true); // Default ON
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [ollamaKey, setOllamaKey] = useState('');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [models, setModels] = useState(MODELS);

  const handleToggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleBiometrics = () => {
    const next = !biometrics;
    if (next) {
      // Simulate biometric enrollment
      setBiometrics(true);
    } else {
      setBiometrics(false);
    }
  };

  const handleReset = async () => {
    const ok = await resetAllData();
    if (ok) {
      setShowResetConfirm(false);
    }
  };

  const toggleModelActive = (id: string) => {
    setModels((m) => m.map((model) =>
      model.id === id ? { ...model, active: !model.active } : model
    ));
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-8 space-y-5">
      <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>

      {/* Appearance */}
      <section className="rounded-2xl border bg-card p-4 ghost-card">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
            <span className="text-sm text-foreground">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button
            onClick={handleToggleTheme}
            className={`relative h-6 w-11 rounded-full aether-transition ${
              darkMode ? 'bg-foreground' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full aether-transition ${
                darkMode ? 'left-[22px] bg-background' : 'left-0.5 bg-muted-foreground/40'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Encryption & Biometrics */}
      <section className="rounded-2xl border bg-card p-4 space-y-3 ghost-card">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Security
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">AES-256-GCM</p>
              <p className="text-[10px] text-muted-foreground">End-to-end encryption for private notes</p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-foreground" />
            <div>
              <span className="text-sm text-foreground">Biometrics</span>
              <p className="text-[10px] text-muted-foreground">
                {biometrics ? 'Primary unlock method' : 'PIN used as primary'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleBiometrics}
            className={`relative h-6 w-11 rounded-full aether-transition ${
              biometrics ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full aether-transition ${
                biometrics ? 'left-[22px] bg-accent-foreground' : 'left-0.5 bg-muted-foreground/40'
              }`}
            />
          </button>
        </div>
        <button className="w-full rounded-xl border border-destructive/20 py-2 text-xs text-destructive hover:bg-destructive/5 aether-transition">
          Reset Encryption & PIN
        </button>
      </section>

      {/* Local Models */}
      <section className="rounded-2xl border bg-card p-4 space-y-3 ghost-card">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Local Models — Liquid AI
        </h2>
        {models.map((model) => (
          <div key={model.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">{model.name}</p>
                <p className="text-[10px] text-muted-foreground">{model.size} params</p>
              </div>
            </div>
            <button
              onClick={() => toggleModelActive(model.id)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-medium aether-transition ${
                model.active
                  ? 'bg-accent text-accent-foreground'
                  : 'border text-muted-foreground hover:text-foreground'
              }`}
            >
              {model.active ? 'Active' : 'Use'}
            </button>
          </div>
        ))}
      </section>

      {/* Cloud Providers */}
      <section className="rounded-2xl border bg-card p-4 space-y-3 ghost-card">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Cloud Providers
        </h2>
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Ollama</span>
        </div>
        <input
          value={ollamaKey}
          onChange={(e) => setOllamaKey(e.target.value)}
          placeholder="API Key"
          type="password"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent aether-transition"
        />
        <select
          value={ollamaModel}
          onChange={(e) => setOllamaModel(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent aether-transition"
        >
          <option value="llama3">Llama 3</option>
          <option value="mistral">Mistral</option>
          <option value="phi3">Phi-3</option>
          <option value="gemma">Gemma</option>
        </select>
      </section>

      {/* Vault Stats */}
      <section className="rounded-2xl border bg-card p-4 ghost-card">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Vault Stats
        </h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Notes</span>
            <span className="font-mono text-foreground">{notes.length}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Boards</span>
            <span className="font-mono text-foreground">{boards.length}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Cards</span>
            <span className="font-mono text-foreground">{cards.length}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Storage</span>
            <span className="font-mono text-foreground">backend vault</span>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-destructive/20 bg-card p-4">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-destructive mb-3">
          Danger Zone
        </h2>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-destructive/20 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 aether-transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset All Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-destructive">
              This will delete all notes, boards, and settings. Cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-xl bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border px-3 py-1.5 text-xs text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
