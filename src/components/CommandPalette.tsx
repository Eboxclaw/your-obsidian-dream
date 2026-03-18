import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Search, FileText, LayoutDashboard, BookOpen, Columns3, Plus, GitFork, Bot, FileStack, Settings } from 'lucide-react';

export function CommandPalette() {
  const {
    notes,
    boards,
    toggleCommandPalette,
    setActiveNote,
    setView,
    setActiveBoard,
    addNote,
  } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  type Action = {
    id: string;
    label: string;
    sublabel?: string;
    icon: typeof Search;
    action: () => void;
  };

  const actions: Action[] = [];

  // Navigation
  actions.push(
    { id: 'nav-dash', label: 'Dashboard', sublabel: 'Navigate', icon: LayoutDashboard, action: () => { setView('dashboard'); toggleCommandPalette(); } },
    { id: 'nav-note', label: 'Notebook', sublabel: 'Navigate', icon: BookOpen, action: () => { setView('notebook'); toggleCommandPalette(); } },
    { id: 'nav-kanban', label: 'Kanban', sublabel: 'Navigate', icon: Columns3, action: () => { setView('kanban'); toggleCommandPalette(); } },
    { id: 'nav-graph', label: 'Graph View', sublabel: 'Navigate', icon: GitFork, action: () => { setView('graph'); toggleCommandPalette(); } },
    { id: 'nav-templates', label: 'Templates', sublabel: 'Navigate', icon: FileStack, action: () => { setView('templates'); toggleCommandPalette(); } },
    { id: 'nav-agent', label: 'Agent', sublabel: 'Navigate', icon: Bot, action: () => { setView('agent'); toggleCommandPalette(); } },
    { id: 'nav-settings', label: 'Settings', sublabel: 'Navigate', icon: Settings, action: () => { setView('settings'); toggleCommandPalette(); } },
    { id: 'new-note', label: 'New Note', sublabel: 'Action', icon: Plus, action: () => { const n = addNote('Untitled'); setActiveNote(n.id); setView('notebook'); toggleCommandPalette(); } },
  );

  // Notes
  notes.forEach((n) => {
    actions.push({
      id: `note-${n.id}`,
      label: n.title,
      sublabel: 'Note',
      icon: FileText,
      action: () => { setActiveNote(n.id); setView('notebook'); toggleCommandPalette(); },
    });
  });

  const filtered = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleCommandPalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        filtered[selectedIdx].action();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filtered, selectedIdx, toggleCommandPalette]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={toggleCommandPalette}
      />

      {/* Palette */}
      <div className="relative w-full max-w-md rounded-md border bg-popover animate-fade-in">
        {/* Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, actions…"
            className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1 py-0.5 text-[9px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No results
            </div>
          ) : (
            filtered.map((action, i) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-xs aether-transition ${
                  i === selectedIdx
                    ? 'bg-surface-active text-foreground'
                    : 'text-secondary-foreground hover:bg-surface-hover'
                }`}
              >
                <action.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{action.label}</span>
                {action.sublabel && (
                  <span className="text-[10px] text-muted-foreground">
                    {action.sublabel}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
