import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Search, Trash2 } from 'lucide-react';

export function FileSidebar() {
  const { notes, ui, addNote, setActiveNote, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = notes
    .filter((n) => !n.isFolder)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  const handleNew = () => {
    const note = addNote('Untitled');
    setActiveNote(note.id);
  };

  return (
    <div className="flex w-60 shrink-0 flex-col bg-background">
      {/* Search + New */}
      <div className="flex items-center gap-1 p-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-sm border bg-surface px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={handleNew}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground aether-transition"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto px-1 pb-2">
        <div className="px-2 py-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Notes ({filtered.length})
          </span>
        </div>
        {filtered.map((note) => (
          <button
            key={note.id}
            onClick={() => setActiveNote(note.id)}
            onMouseEnter={() => setHoveredId(note.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs aether-transition ${
              ui.activeNoteId === note.id
                ? 'border-l-[1.5px] border-primary bg-surface text-foreground'
                : 'text-secondary-foreground hover:bg-surface-hover'
            }`}
          >
            <span className="truncate">{note.title || 'Untitled'}</span>
            {hoveredId === note.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
