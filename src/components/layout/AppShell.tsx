import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';
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
import { Search } from 'lucide-react';
import logoSvg from '@/assets/logo.svg';

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

  if (!onboarding.completed) {
    return <OnboardingWizard />;
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
          <img
            src={logoSvg}
            alt="ViBo"
            className="h-6 w-6 logo-glow ghost-float"
          />
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
