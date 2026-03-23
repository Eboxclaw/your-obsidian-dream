import { useStore } from '@/store';
import { Home, FileText, CheckSquare, Bot, Settings } from 'lucide-react';
import type { ViewMode } from '@/types';

const items: { view: ViewMode; label: string; icon: typeof Home }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  { view: 'notebook', label: 'Notes', icon: FileText },
  { view: 'kanban', label: 'Tasks', icon: CheckSquare },
  { view: 'agent', label: 'Agents', icon: Bot },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { ui, setView } = useStore();

  return (
    <nav className="flex h-14 shrink-0 items-end justify-around border-t bg-card px-2 pb-1">
      {items.map(({ view, label, icon: Icon }) => {
        const active = ui.activeView === view;
        return (
          <button
            key={view}
            onClick={() => setView(view)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 aether-transition ${
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
