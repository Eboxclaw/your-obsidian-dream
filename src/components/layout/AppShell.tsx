import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { Fingerprint, Shield, Search } from 'lucide-react';
import { Dashboard } from '@/components/views/Dashboard';
import { Notebook } from '@/components/views/Notebook';
import { KanbanView } from '@/components/views/KanbanView';
import { GraphView } from '@/components/views/GraphView';
import { AgentView } from '@/components/views/AgentView';
import { TemplatesView } from '@/components/views/TemplatesView';
import { SettingsView } from '@/components/views/SettingsView';
import { CommandPalette } from '@/components/CommandPalette';
import { BottomNav } from '@/components/layout/BottomNav';
import { FABMenu } from '@/components/layout/FABMenu';
import { InlineAgent } from '@/components/layout/InlineAgent';
import { FolderSwitcher } from '@/components/layout/FolderSwitcher';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const VIEWS_WITH_FOLDER_SWITCHER: string[] = ['dashboard', 'notebook', 'kanban', 'agent'];

export function AppShell() {
  const { ui, onboarding, toggleCommandPalette, addNote, setActiveNote, setView } = useStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (mod && e.key === 'n') {
        e.preventDefault();
        const note = addNote('Untitled');
        setActiveNote(note.id);
        setView('notebook');
      }
    },
    [toggleCommandPalette, addNote, setActiveNote, setView]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // App-level biometric lock
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);

  if (!onboarding.completed) {
    return <OnboardingWizard />;
  }

  // Show biometric lock screen on app launch
  if (!appUnlocked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="w-full max-w-xs mx-4 rounded-3xl border bg-card p-8 text-center shadow-xl animate-fade-in">
          {!biometricAttempted ? (
            <>
              <div className="mb-5 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-muted">
                  <Fingerprint className="h-10 w-10 text-foreground" />
                </div>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Welcome back</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Authenticate to unlock your vault
              </p>
              <button
                onClick={() => {
                  setBiometricAttempted(true);
                  setTimeout(() => setAppUnlocked(true), 800);
                }}
                className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground aether-transition hover:opacity-90"
              >
                Unlock with Biometrics
              </button>
              <button
                onClick={() => setBiometricAttempted(true)}
                className="mt-3 w-full rounded-2xl border py-3 text-sm text-muted-foreground hover:text-foreground aether-transition"
              >
                Use PIN
              </button>
            </>
          ) : !appUnlocked ? (
            <>
              <h2 className="text-lg font-semibold tracking-tight text-foreground mb-2">Enter PIN</h2>
              <input
                type="password"
                placeholder="PIN"
                className="w-full rounded-xl border bg-background px-4 py-3 text-center text-sm outline-none focus:border-accent aether-transition"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') setAppUnlocked(true); }}
              />
              <button
                onClick={() => setAppUnlocked(true)}
                className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground aether-transition hover:opacity-90"
              >
                Unlock
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  const viewTitle = {
    dashboard: 'Home',
    notebook: 'Notes',
    kanban: 'Tasks',
    graph: 'Graph',
    agent: 'Agents',
    templates: 'Templates',
    settings: 'Settings',
  }[ui.activeView];

  const showFolderSwitcher = VIEWS_WITH_FOLDER_SWITCHER.includes(ui.activeView);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <Shield className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {viewTitle}
          </span>
          {onboarding.workspaceName && ui.activeView === 'dashboard' && (
            <span className="text-[10px] text-muted-foreground">
              / {onboarding.workspaceName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {showFolderSwitcher && <FolderSwitcher />}
          <button
            onClick={toggleCommandPalette}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {ui.activeView === 'dashboard' && <Dashboard />}
        {ui.activeView === 'notebook' && <Notebook />}
        {ui.activeView === 'kanban' && <KanbanView />}
        {ui.activeView === 'graph' && <GraphView />}
        {ui.activeView === 'agent' && <AgentView />}
        {ui.activeView === 'templates' && <TemplatesView />}
        {ui.activeView === 'settings' && <SettingsView />}
      </main>

      {/* Inline agent */}
      <InlineAgent />

      {/* FAB — fixed position */}
      <FABMenu />

      {/* Bottom navigation */}
      <BottomNav />

      {/* Command palette */}
      {ui.commandPaletteOpen && <CommandPalette />}
    </div>
  );
}
