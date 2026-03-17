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
  RotateCcw,
  Trash2,
} from 'lucide-react';

const ROLES: { id: UserRole; label: string; icon: typeof User }[] = [
  { id: 'general', label: 'General', icon: User },
  { id: 'researcher', label: 'Researcher', icon: FlaskConical },
  { id: 'writer', label: 'Writer', icon: PenTool },
  { id: 'pm', label: 'Project Manager', icon: Briefcase },
  { id: 'developer', label: 'Developer', icon: Code2 },
  { id: 'analyst', label: 'Analyst', icon: BarChart3 },
];

const THEMES = [
  { id: 'dark' as const, label: 'Dark', color: 'hsl(240, 10%, 6%)' },
  { id: 'midnight' as const, label: 'Midnight', color: 'hsl(230, 20%, 5%)' },
  { id: 'abyss' as const, label: 'Abyss', color: 'hsl(240, 15%, 3%)' },
];

export function SettingsView() {
  const { onboarding, setOnboarding, notes, boards, cards } = useStore();
  const [name, setName] = useState(onboarding.name);
  const [workspaceName, setWorkspaceName] = useState(onboarding.workspaceName);
  const [role, setRole] = useState<UserRole | null>(onboarding.role);
  const [theme, setTheme] = useState(onboarding.theme);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = () => {
    setOnboarding({ name, workspaceName, role: role!, theme });
  };

  const hasChanges =
    name !== onboarding.name ||
    workspaceName !== onboarding.workspaceName ||
    role !== onboarding.role ||
    theme !== onboarding.theme;

  const handleReset = () => {
    localStorage.removeItem('vibo-store');
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-lg font-semibold tracking-tight text-foreground mb-1">Settings</h1>
      <p className="text-xs text-muted-foreground mb-8">Manage your workspace preferences.</p>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Profile
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:border-primary aether-transition"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Vault Name</label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:border-primary aether-transition"
            />
          </div>
        </div>
      </section>

      {/* Role */}
      <section className="mb-8">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Role
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium aether-transition ${
                role === r.id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <r.icon className="h-3.5 w-3.5" />
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Theme
        </h2>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex-1 rounded-md border p-3 aether-transition ${
                theme === t.id ? 'border-primary' : 'hover:border-muted-foreground'
              }`}
            >
              <div
                className="mx-auto mb-2 h-6 w-6 rounded-sm border"
                style={{ backgroundColor: t.color }}
              />
              <p className="text-[10px] font-medium text-center text-foreground">{t.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Vault Stats
        </h2>
        <div className="rounded-md border bg-surface px-3 py-2.5 text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Notes</span>
            <span className="font-mono tabular-nums text-foreground">{notes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Boards</span>
            <span className="font-mono tabular-nums text-foreground">{boards.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Cards</span>
            <span className="font-mono tabular-nums text-foreground">{cards.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="font-mono tabular-nums text-foreground">localStorage</span>
          </div>
        </div>
      </section>

      {/* Save button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 aether-transition mb-4"
        >
          Save Changes
        </button>
      )}

      {/* Danger zone */}
      <section className="border-t pt-6">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-destructive mb-3">
          Danger Zone
        </h2>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 rounded-md border border-destructive/20 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 aether-transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset All Data
          </button>
        ) : (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-destructive mb-2">
              This will delete all notes, boards, and settings. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 aether-transition"
              >
                <RotateCcw className="h-3 w-3" />
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground aether-transition"
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
