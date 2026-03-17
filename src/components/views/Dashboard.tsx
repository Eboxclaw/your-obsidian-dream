import { useState } from 'react';
import { useStore } from '@/store';
import { useLinkCount } from '@/hooks/use-wikilinks';
import { format } from 'date-fns';
import { ArrowRight, Plus } from 'lucide-react';

export function Dashboard() {
  const { notes, boards, cards, addNote, setActiveNote, setView, setActiveBoard } = useStore();
  const linkCount = useLinkCount();
  const [quickTitle, setQuickTitle] = useState('');

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, 8);

  const handleQuickCapture = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickTitle.trim()) {
      const note = addNote(quickTitle.trim());
      setQuickTitle('');
      setActiveNote(note.id);
      setView('notebook');
    }
  };

  const lastEdited = notes.length > 0
    ? format(new Date(Math.max(...notes.map((n) => new Date(n.modified).getTime()))), 'MMM d, h:mm a')
    : 'Never';

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workspace is ready.
        </p>
      </div>

      {/* Quick capture */}
      <div className="mb-12">
        <div className="flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 focus-within:border-primary aether-transition">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={handleQuickCapture}
            placeholder="Quick capture — type a title, press Enter"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-12 flex gap-8">
        <div>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {notes.length.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-muted-foreground">notes</span>
        </div>
        <div>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {linkCount.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-muted-foreground">links</span>
        </div>
        <div>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {boards.length}
          </span>
          <span className="ml-1.5 text-xs text-muted-foreground">boards</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Last edited {lastEdited}
        </div>
      </div>

      {/* Recent notes */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent Notes
          </h2>
          <button
            onClick={() => setView('notebook')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground aether-transition"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-px">
          {recentNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setActiveNote(note.id);
                setView('notebook');
              }}
              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left hover:bg-surface aether-transition"
            >
              <span className="text-sm text-foreground">{note.title}</span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {format(new Date(note.modified), 'MMM d')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Boards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Active Boards
          </h2>
          <button
            onClick={() => setView('kanban')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground aether-transition"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-px">
          {boards.map((board) => {
            const cardCount = cards.filter((c) => c.boardId === board.id).length;
            return (
              <button
                key={board.id}
                onClick={() => {
                  setActiveBoard(board.id);
                  setView('kanban');
                }}
                className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left hover:bg-surface aether-transition"
              >
                <span className="text-sm text-foreground">{board.title}</span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {cardCount} cards · {board.columns.length} cols
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
