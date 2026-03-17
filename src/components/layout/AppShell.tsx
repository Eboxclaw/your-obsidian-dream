import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { FileSidebar } from '@/components/layout/FileSidebar';
import { Inspector } from '@/components/layout/Inspector';
import { Dashboard } from '@/components/views/Dashboard';
import { Notebook } from '@/components/views/Notebook';
import { KanbanView } from '@/components/views/KanbanView';
import { GraphView } from '@/components/views/GraphView';
import { CommandPalette } from '@/components/CommandPalette';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { PanelRight, PanelLeft } from 'lucide-react';

export function AppShell() {
  const { ui, onboarding, toggleCommandPalette, toggleSidebar, toggleInspector, addNote, setActiveNote, setView } = useStore();

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
      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (mod && e.key === 'g') {
        e.preventDefault();
        setView('graph');
      }
    },
    [toggleCommandPalette, addNote, setActiveNote, setView, toggleSidebar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show onboarding if not completed
  if (!onboarding.completed) {
    return <OnboardingWizard />;
  }

  const showSidebar = ui.activeView === 'notebook' && !ui.sidebarCollapsed;
  const showInspector = ui.activeView === 'notebook' && ui.inspectorOpen;

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-1">
          {ui.activeView === 'notebook' && (
            <button
              onClick={toggleSidebar}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground aether-transition"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-medium tracking-tight text-muted-foreground ml-1">
            ViBo
          </span>
          {onboarding.workspaceName && (
            <span className="text-[10px] text-muted-foreground ml-1">
              / {onboarding.workspaceName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleCommandPalette}
            className="flex h-7 items-center gap-1.5 rounded-sm border px-2 text-xs text-muted-foreground hover:text-foreground aether-transition"
          >
            <span>Search</span>
            <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>
          {ui.activeView === 'notebook' && (
            <button
              onClick={toggleInspector}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground aether-transition"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <>
            <FileSidebar />
            <div className="w-px bg-border shrink-0" />
          </>
        )}

        <main className="flex-1 overflow-auto">
          {ui.activeView === 'dashboard' && <Dashboard />}
          {ui.activeView === 'notebook' && <Notebook />}
          {ui.activeView === 'kanban' && <KanbanView />}
          {ui.activeView === 'graph' && <GraphView />}
        </main>

        {showInspector && (
          <>
            <div className="w-px bg-border shrink-0" />
            <Inspector />
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Command palette */}
      {ui.commandPaletteOpen && <CommandPalette />}
    </div>
  );
}
