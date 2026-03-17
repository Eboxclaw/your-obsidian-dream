import { useState } from 'react';
import { useStore } from '@/store';
import type { UserRole } from '@/types';
import {
  ChevronRight,
  ChevronLeft,
  Fingerprint,
  KeyRound,
  Shield,
  Calendar,
  Mail,
  Cpu,
  Bot,
  Code2,
  PenTool,
  Target,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import logoSvg from '@/assets/logo.svg';
import { SmokeParticles } from '@/components/effects/SmokeParticles';

type SecurityMethod = 'biometrics' | 'pin' | 'passphrase';
type AgentPreset = 'manager' | 'assistant' | 'code' | 'writer';

const LOCAL_MODELS = [
  { id: 'lfm-instruct', name: 'LFM 2.5 Instruct', desc: 'General-purpose text model for on-device deployment. Fast and efficient.', size: '720 MB' },
  { id: 'lfm-thinking', name: 'LFM 2.5 Thinking', desc: 'Excels at instruction following, tool-use, math, agentic tasks and RAG.', size: '720 MB' },
];

const INTEGRATIONS = [
  { id: 'calendar', name: 'Calendar', desc: 'Sync events & reminders', icon: Calendar },
  { id: 'gmail', name: 'Gmail', desc: 'Email integration', icon: Mail },
];

const SECURITY_OPTIONS: { id: SecurityMethod; name: string; desc: string; icon: typeof Fingerprint }[] = [
  { id: 'biometrics', name: 'Biometrics', desc: 'Face ID / Fingerprint', icon: Fingerprint },
  { id: 'pin', name: 'Numeric PIN', desc: '4-6 digit code', icon: KeyRound },
  { id: 'passphrase', name: 'Passphrase', desc: 'Word-based password', icon: Shield },
];

const AGENT_PRESETS: { id: AgentPreset; name: string; desc: string; icon: typeof Bot; emoji: string }[] = [
  { id: 'manager', name: 'Manager', desc: 'Coordinates tasks and delegates work', icon: Target, emoji: '🎯' },
  { id: 'assistant', name: 'Assistant', desc: 'General-purpose help and note-taking', icon: Sparkles, emoji: '✨' },
  { id: 'code', name: 'Code Assistant', desc: 'Programming help and code review', icon: Code2, emoji: '💻' },
  { id: 'writer', name: 'Content Writer', desc: 'Writing, editing, and summarizing', icon: PenTool, emoji: '✍️' },
];

export function OnboardingWizard() {
  const { setOnboarding, completeOnboarding } = useStore();
  const [step, setStep] = useState(0);

  // Step data
  const [selectedModel, setSelectedModel] = useState('lfm-instruct');
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});
  const [security, setSecurity] = useState<SecurityMethod>('biometrics');
  const [agent, setAgent] = useState<AgentPreset>('assistant');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPinStep, setShowPinStep] = useState(false);

  const totalSteps = 5;

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const canProceed = () => {
    if (step === 5) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step < 5) {
      setStep(step + 1);
    } else if (step === 5 && !showPinStep) {
      setShowPinStep(true);
    } else {
      setOnboarding({
        name,
        role: 'general' as UserRole,
        workspaceName: 'My Vault',
        theme: 'dark',
        features: ['wikilinks', 'kanban', 'graph', 'ai'],
      });
      completeOnboarding();
    }
  };

  // Welcome splash (step 0)
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <SmokeParticles count={8} />
        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <div className="mb-8 flex justify-center">
            <img src={logoSvg} alt="ViBo" className="h-16 w-16 logo-glow ghost-float" />
          </div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            ViBoAI · Virtual Notebook
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Think, Write,
          </h1>
          <h1 className="text-3xl italic text-muted-foreground">
            Plan Privately.
          </h1>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            A private AI notebook on your device. No accounts. No cloud. No tracking. Ever.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="accent-dot" /> LOCAL</span>
            <span className="flex items-center gap-1.5"><span className="accent-dot" /> ENCRYPTED</span>
            <span className="flex items-center gap-1.5"><span className="accent-dot" /> PRIVATE</span>
          </div>
          <button
            onClick={handleNext}
            className="mt-10 w-full rounded-2xl bg-primary py-4 text-sm font-medium text-primary-foreground aether-transition hover:opacity-90"
          >
            Begin setup
          </button>
        </div>
      </div>
    );
  }

  // PIN setup sub-step
  if (showPinStep) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="relative w-full max-w-md px-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Shield className="h-7 w-7 text-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Set Up Encryption</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a PIN to encrypt your notes at rest
          </p>
          <div className="mt-6 relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN..."
              className="w-full rounded-2xl border bg-muted px-4 py-4 text-center text-sm outline-none focus:border-foreground/30 aether-transition pr-12"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && pin.length >= 4 && handleNext()}
            />
            <button
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleNext}
            disabled={pin.length < 4}
            className="mt-4 w-full rounded-2xl bg-primary py-4 text-sm font-medium text-primary-foreground disabled:opacity-40 aether-transition hover:opacity-90"
          >
            Next
          </button>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Your PIN derives an AES-256 key to<br />encrypt all notes locally
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="relative w-full max-w-md px-6">
        {/* Progress bar */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-[3px] w-10 rounded-full aether-transition ${
                i < step ? 'bg-foreground' : i === step ? 'bg-foreground' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step label */}
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Step {step} of {totalSteps}
        </p>

        {/* Step 1: Local Model */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Choose your</h2>
              <h2 className="text-xl italic text-muted-foreground">local model.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Select a nano model for on-device inference. More models available in{' '}
                <span className="font-medium text-foreground">Settings → Liquid AI</span>.
              </p>
            </div>
            <div className="space-y-2">
              {LOCAL_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ghost-card aether-transition ${
                    selectedModel === model.id ? 'border-foreground/30' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{model.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{model.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {model.size}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Integrations */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Connect</h2>
              <h2 className="text-xl italic text-muted-foreground">your world.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Give agents access to your tools. You decide exactly what they can see.
              </p>
            </div>
            <div className="space-y-2">
              {INTEGRATIONS.map((intg) => (
                <div
                  key={intg.id}
                  className="flex items-center justify-between rounded-2xl border p-4 ghost-card"
                >
                  <div className="flex items-center gap-3">
                    <intg.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{intg.name}</p>
                      <p className="text-[11px] text-muted-foreground">{intg.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleIntegration(intg.id)}
                    className={`relative h-6 w-11 rounded-full aether-transition ${
                      integrations[intg.id] ? 'bg-foreground' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full aether-transition ${
                        integrations[intg.id]
                          ? 'left-[22px] bg-background'
                          : 'left-0.5 bg-muted-foreground/40'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Secure your</h2>
              <h2 className="text-xl italic text-muted-foreground">vault.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Choose how you unlock ViBo. Biometrics first, password as fallback.
              </p>
            </div>
            <div className="space-y-2">
              {SECURITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSecurity(opt.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ghost-card aether-transition ${
                    security === opt.id ? 'border-foreground/30' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <opt.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{opt.name}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </div>
                  {security === opt.id && (
                    <div className="h-3 w-3 rounded-full border-2 border-foreground flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Agent */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Your first</h2>
              <h2 className="text-xl italic text-muted-foreground">agent.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Pick a starter agent. You can add more later in Settings.
              </p>
            </div>
            <div className="space-y-2">
              {AGENT_PRESETS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAgent(a.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ghost-card aether-transition ${
                    agent === a.id ? 'border-foreground/30' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">
                    {a.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                  </div>
                  {agent === a.id && (
                    <div className="h-3 w-3 rounded-full border-2 border-foreground flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Name */}
        {step === 5 && (
          <div className="animate-fade-in text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">About</h2>
            <h2 className="text-xl italic text-muted-foreground">you.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              What should we call you?
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              className="mt-6 w-full rounded-2xl border bg-muted px-4 py-4 text-center text-sm outline-none focus:border-foreground/30 aether-transition"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-muted-foreground hover:text-foreground aether-transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-medium text-primary-foreground disabled:opacity-40 aether-transition hover:opacity-90"
          >
            {step === 5 ? 'Finish setup' : step === 2 ? 'Continue' : 'Continue setup'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            className="mt-3 w-full rounded-2xl border py-4 text-sm text-muted-foreground hover:text-foreground aether-transition"
          >
            Skip integrations
          </button>
        )}
      </div>
    </div>
  );
}
