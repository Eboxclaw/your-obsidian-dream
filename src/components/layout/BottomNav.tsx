import { useStore } from '@/store';
import { LayoutDashboard, BookOpen, Columns3, GitFork, Bot, FileStack, Settings } from 'lucide-react';
import type { ViewMode } from '@/types';

const items: { view: ViewMode; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'notebook', label: 'Notebook', icon: BookOpen },
  { view: 'kanban', label: 'Kanban', icon: Columns3 },
  { view: 'graph', label: 'Graph', icon: GitFork },
  { view: 'templates', label: 'Templates', icon: FileStack },
  { view: 'agent', label: 'Agent', icon: Bot },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { ui, setView } = useStore();

  return (
    <nav className="flex h-10 shrink-0 items-center justify-center gap-1 border-t bg-background">
      {items.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          onClick={() => setView(view)}
          className={`flex h-7 items-center gap-1.5 rounded-sm px-3 text-xs font-medium aether-transition ${
            ui.activeView === view
              ? 'bg-surface text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
