import { useState } from 'react';
import { useStore } from '@/store';
import type { UserRole } from '@/types';
import {
  User,
  FlaskConical,
  PenTool,
  BarChart3,
  Code2,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from 'lucide-react';

const ROLES: {
  id: UserRole;
  label: string;
  desc: string;
  icon: typeof User;
}[] = [
  { id: 'general', label: 'General', desc: 'Flexible workspace for everyday use', icon: User },
  { id: 'researcher', label: 'Researcher', desc: 'Deep linking, literature notes, citations', icon: FlaskConical },
  { id: 'writer', label: 'Writer', desc: 'Distraction-free writing, drafts, publishing', icon: PenTool },
  { id: 'pm', label: 'Project Manager', desc: 'Kanban boards, timelines, team tracking', icon: Briefcase },
  { id: 'developer', label: 'Developer', desc: 'Code snippets, architecture docs, debugging logs', icon: Code2 },
  { id: 'analyst', label: 'Analyst', desc: 'Data notes, queries, dashboards, reports', icon: BarChart3 },
];

const THEMES = [
  { id: 'dark' as const, label: 'Dark', color: 'hsl(240, 10%, 6%)' },
  { id: 'midnight' as const, label: 'Midnight', color: 'hsl(230, 20%, 5%)' },
  { id: 'abyss' as const, label: 'Abyss', color: 'hsl(240, 15%, 3%)' },
];

const FEATURES = [
  { id: 'wikilinks', label: 'Wikilinks & Backlinks' },
  { id: 'kanban', label: 'Kanban Boards' },
  { id: 'graph', label: 'Graph View' },
  { id: 'daily', label: 'Daily Notes' },
  { id: 'templates', label: 'Note Templates' },
  { id: 'ai', label: 'AI Assistant' },
];

export function OnboardingWizard() {
  const { onboarding, setOnboarding, completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(onboarding.name);
  const [role, setRole] = useState<UserRole | null>(onboarding.role);
  const [workspaceName, setWorkspaceName] = useState(onboarding.workspaceName || 'My Vault');
  const [theme, setTheme] = useState<'dark' | 'midnight' | 'abyss'>(onboarding.theme || 'dark');
  const [features, setFeatures] = useState<string[]>(onboarding.features || ['wikilinks', 'kanban', 'graph']);

  const toggleFeature = (id: string) => {
    setFeatures((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return role !== null;
    if (step === 2) return workspaceName.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setOnboarding({ name, role: role!, workspaceName, theme, features });
      completeOnboarding();
    }
  };

  const stepLabels = ['Welcome', 'Role', 'Workspace', 'Theme', 'Ready'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(210, 100%, 50%) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative w-full max-w-lg px-6">
        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium aether-transition ${
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-surface-active text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : label}
              </button>
              {i < stepLabels.length - 1 && (
                <div className={`h-px w-6 ${i < step ? 'bg-primary/50' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome / Name */}
        {step === 0 && (
          <div className="animate-fade-in text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-surface">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              Welcome to ViBo
            </h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Your second brain starts here. Let's set up your workspace.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="mx-auto block w-72 rounded-md border bg-surface px-3 py-2.5 text-center text-sm outline-none placeholder:text-muted-foreground focus:border-primary aether-transition"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
            />
          </div>
        )}

        {/* Step 1: Role */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="mb-1 text-center text-lg font-semibold tracking-tight text-foreground">
              How will you use ViBo?
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This tailors your workspace layout and suggestions.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex items-start gap-3 rounded-md border p-3 text-left aether-transition ${
                    role === r.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <r.icon className={`mt-0.5 h-4 w-4 shrink-0 ${role === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-xs font-medium text-foreground">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Workspace name */}
        {step === 2 && (
          <div className="animate-fade-in text-center">
            <h2 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
              Name your vault
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              This is your workspace. You can rename it anytime.
            </p>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Vault"
              className="mx-auto block w-72 rounded-md border bg-surface px-3 py-2.5 text-center text-sm outline-none placeholder:text-muted-foreground focus:border-primary aether-transition"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
            />
          </div>
        )}

        {/* Step 3: Theme */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            <h2 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
              Choose your darkness
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              All themes are dark. Pick your shade.
            </p>
            <div className="mx-auto flex w-72 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex-1 rounded-md border p-3 aether-transition ${
                    theme === t.id ? 'border-primary' : 'hover:border-muted-foreground'
                  }`}
                >
                  <div
                    className="mx-auto mb-2 h-8 w-8 rounded-sm border"
                    style={{ backgroundColor: t.color }}
                  />
                  <p className="text-[10px] font-medium text-foreground">{t.label}</p>
                </button>
              ))}
            </div>

            {/* Feature toggles */}
            <div className="mt-8">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Enable features
              </p>
              <div className="mx-auto flex w-72 flex-wrap justify-center gap-1.5">
                {FEATURES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFeature(f.id)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium aether-transition ${
                      features.includes(f.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <div className="animate-fade-in text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-surface">
                <Check className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
              You're all set, {name}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
              Your vault <span className="text-foreground font-medium">"{workspaceName}"</span> is ready.
            </p>
            <p className="text-xs text-muted-foreground">
              Role: <span className="text-foreground">{ROLES.find((r) => r.id === role)?.label}</span> ·{' '}
              {features.length} features enabled
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground aether-transition"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40 aether-transition hover:bg-primary/90"
          >
            {step === 4 ? 'Enter ViBo' : 'Continue'}
            {step < 4 && <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
