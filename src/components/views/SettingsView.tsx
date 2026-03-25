import { useState } from 'react';
import { useStore } from '@/store';
import {
  Sun,
  Moon,
  Shield,
  Fingerprint,
  RotateCcw,
  Trash2,
  Cpu,
  Cloud,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Key,
} from 'lucide-react';

const MODELS = [
  { id: 'lfm-instruct', name: 'LFM 2.5 Instruct', size: '3.2B' },
  { id: 'lfm-thinking', name: 'LFM 2.5 Thinking', size: '7B' },
  { id: 'lfm-chat', name: 'LFM 2.5 Chat', size: '1.5B' },
];

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'meta/llama-3.1-70b', name: 'Llama 3.1 70B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
];

export function SettingsView() {
  const { notes, boards, cards } = useStore();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [biometrics, setBiometrics] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Local models
  const [activeLocalModel, setActiveLocalModel] = useState('lfm-chat');
  const [localModelOpen, setLocalModelOpen] = useState(false);

  // OpenRouter
  const [openRouterEnabled, setOpenRouterEnabled] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [openRouterModel, setOpenRouterModel] = useState('anthropic/claude-3.5-sonnet');
  const [openRouterModelOpen, setOpenRouterModelOpen] = useState(false);
  const [showOAuthCard, setShowOAuthCard] = useState(false);

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
    setBiometrics(!biometrics);
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleToggleOpenRouter = () => {
    if (!openRouterEnabled) {
      setShowOAuthCard(true);
    } else {
      setOpenRouterEnabled(false);
      setOpenRouterKey('');
    }
  };

  const handleOAuthConfirm = () => {
    setOpenRouterEnabled(true);
    setShowOAuthCard(false);
  };

  const selectedLocalModel = MODELS.find((m) => m.id === activeLocalModel);
  const selectedCloudModel = OPENROUTER_MODELS.find((m) => m.id === openRouterModel);

  return (
    <div className="mx-auto max-w-lg px-5 py-8 space-y-5 relative">
      <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>

      {/* OAuth / API Key Card Overlay */}
      {showOAuthCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowOAuthCard(false)}>
          <div className="w-full max-w-xs mx-4 rounded-3xl border bg-card p-6 text-center shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowOAuthCard(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Key className="h-7 w-7 text-foreground" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground">Connect OpenRouter</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter your OpenRouter API key to enable cloud model inference.
            </p>
            <div className="mt-4 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30 aether-transition pr-10"
                autoFocus
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
            >
              Get your API key <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <button
              onClick={handleOAuthConfirm}
              disabled={!openRouterKey.trim()}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40 aether-transition hover:opacity-90"
            >
              Connect
            </button>
            <button
              onClick={() => setShowOAuthCard(false)}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground aether-transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Appearance */}
      <section className="rounded-2xl border bg-card p-4">
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

      {/* Security */}
      <section className="rounded-2xl border bg-card p-4 space-y-3">
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

      {/* Local Models — Dropdown selector */}
      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Local Models — Liquid AI
        </h2>
        <div className="relative">
          <button
            onClick={() => setLocalModelOpen(!localModelOpen)}
            className="flex w-full items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-sm aether-transition"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm text-foreground">{selectedLocalModel ? selectedLocalModel.name : 'Select model'}</p>
                {selectedLocalModel && <p className="text-[10px] text-muted-foreground">{selectedLocalModel.size} params</p>}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground aether-transition ${localModelOpen ? 'rotate-180' : ''}`} />
          </button>
          {localModelOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border bg-card shadow-lg overflow-hidden animate-fade-in">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setActiveLocalModel(model.id);
                    setLocalModelOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-hover aether-transition ${
                    activeLocalModel === model.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{model.name}</p>
                      <p className="text-[10px] text-muted-foreground">{model.size} params</p>
                    </div>
                  </div>
                  {activeLocalModel === model.id && (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cloud Providers — OpenRouter */}
      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Cloud Providers
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-sm text-foreground">OpenRouter</span>
              <p className="text-[10px] text-muted-foreground">Cloud model inference</p>
            </div>
          </div>
          <button
            onClick={handleToggleOpenRouter}
            className={`relative h-6 w-11 rounded-full aether-transition ${
              openRouterEnabled ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full aether-transition ${
                openRouterEnabled ? 'left-[22px] bg-accent-foreground' : 'left-0.5 bg-muted-foreground/40'
              }`}
            />
          </button>
        </div>

        {openRouterEnabled && (
          <>
            {/* API Key display */}
            <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
              <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-xs text-muted-foreground font-mono truncate">
                {openRouterKey ? (showKey ? openRouterKey : '••••••••••••' + openRouterKey.slice(-4)) : 'No key set'}
              </span>
              <button onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button onClick={() => setShowOAuthCard(true)} className="text-[10px] text-accent hover:underline">
                Change
              </button>
            </div>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setOpenRouterModelOpen(!openRouterModelOpen)}
                className="flex w-full items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-sm aether-transition"
              >
                <span className="text-foreground">{selectedCloudModel ? selectedCloudModel.name : 'Select model'}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground aether-transition ${openRouterModelOpen ? 'rotate-180' : ''}`} />
              </button>
              {openRouterModelOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border bg-card shadow-lg overflow-hidden animate-fade-in">
                  {OPENROUTER_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setOpenRouterModel(model.id);
                        setOpenRouterModelOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-hover aether-transition ${
                        openRouterModel === model.id ? 'bg-muted' : ''
                      }`}
                    >
                      <span className="text-sm text-foreground">{model.name}</span>
                      {openRouterModel === model.id && (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Vault Stats */}
      <section className="rounded-2xl border bg-card p-4">
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
