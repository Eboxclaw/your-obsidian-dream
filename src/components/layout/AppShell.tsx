import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
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
import { ChatAssistant } from '@/components/layout/ChatAssistant';
import { FolderSwitcher } from '@/components/layout/FolderSwitcher';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Search } from 'lucide-react';
import { LockScreen } from '@/components/LockScreen';
import logoSvg from '@/assets/logo.svg';
import NotFound from '@/pages/NotFound';

const VIEWS_WITH_FOLDER_SWITCHER: string[] = ['dashboard', 'notebook', 'kanban', 'agent'];

export function AppShell() {
  const { ui, onboarding, toggleCommandPalette, addNote, setActiveNote, navigate, vaultStatus, refreshVaultStatus, hydrated, hydrate } = useStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (mod && e.key === 'n') {
        e.preventDefault();
        void (async () => {
          const note = await addNote('Untitled');
          if (note) {
            setActiveNote(note.id);
            navigate('notebook');
          }
        })();
      }
    },
    [toggleCommandPalette, addNote, setActiveNote, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const setup = async () => {
      if (!hydrated) {
        await hydrate();
      }
      await refreshVaultStatus();
    };

    setup();
  }, [hydrate, hydrated, refreshVaultStatus]);


  if (!onboarding.completed) {
    return <OnboardingWizard />;
  }

  const sensitiveViews = ['dashboard', 'notebook', 'kanban', 'agent', 'settings'];
  const needsVault = sensitiveViews.includes(ui.activeView);

  const viewTitleByMode: Record<string, string> = {
    dashboard: 'Home',
    notebook: 'Notes',
    kanban: 'Tasks',
    graph: 'Graph',
    agent: 'Agents',
    templates: 'Templates',
    settings: 'Settings',
  };

  const activeView = ui.activeView;
  const isKnownView = Object.prototype.hasOwnProperty.call(viewTitleByMode, activeView);
  const viewTitle = isKnownView ? viewTitleByMode[activeView] : 'Not found';
  const showFolderSwitcher = isKnownView && VIEWS_WITH_FOLDER_SWITCHER.includes(activeView);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5">
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
        {needsVault && !vaultStatus.unlocked && <LockScreen />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'dashboard' && <Dashboard />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'notebook' && <Notebook />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'kanban' && <KanbanView />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'graph' && <GraphView />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'agent' && <AgentView />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'templates' && <TemplatesView />}
        {(!needsVault || vaultStatus.unlocked) && isKnownView && activeView === 'settings' && <SettingsView />}
        {(!needsVault || vaultStatus.unlocked) && !isKnownView && <NotFound />}
      </main>

      {/* Chat assistant must render as bottom Sheet */}
      <ChatAssistant />

      {/* FAB — fixed position */}
      <FABMenu />

      {/* Bottom navigation */}
      <BottomNav />

      {/* Command palette */}
      {ui.commandPaletteOpen && <CommandPalette />}
    </div>
  );
}
