import { useState } from 'react';
import { useStore } from '@/store';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { FileText, Lock, Search, ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';

export function Notebook() {
  const { ui, notes, addNote, setActiveNote, setNotesTab } = useStore();
  const [search, setSearch] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const activeNote = notes.find((n) => n.id === ui.activeNoteId);

  // If a note is selected, show the editor
  if (activeNote) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <button
            onClick={() => setActiveNote(null)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground aether-transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground truncate">{activeNote.title}</span>
          {activeNote.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex-1 overflow-auto">
          <NoteEditor note={activeNote} />
        </div>
      </div>
    );
  }

  const isPrivateTab = ui.notesTab === 'private';
  const activeFolderId = useStore((s) => s.ui.activeFolderId);
  const filteredNotes = notes
    .filter((n) => (isPrivateTab ? n.isPrivate : !n.isPrivate))
    .filter((n) => !activeFolderId || n.folderId === activeFolderId)
    .filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  const handleNewNote = () => {
    const note = addNote(isPrivateTab ? 'Private Note' : 'Untitled', null, isPrivateTab);
    setActiveNote(note.id);
  };

  // PIN gate for private notes
  if (isPrivateTab && !unlocked) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex gap-0 border-b">
          <button
            onClick={() => setNotesTab('all')}
            className="flex-1 py-3 text-xs font-medium text-muted-foreground hover:text-foreground aether-transition border-b-2 border-transparent"
          >
            Notes
          </button>
          <button
            onClick={() => setNotesTab('private')}
            className="flex-1 py-3 text-xs font-medium text-foreground border-b-2 border-primary aether-transition"
          >
            <span className="flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Private
            </span>
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <Lock className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">Private Notes</p>
          <p className="text-xs text-muted-foreground mb-4">Enter your PIN to unlock</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setUnlocked(true); }}
            placeholder="PIN"
            className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-sm outline-none focus:border-primary aether-transition"
          />
          <button
            onClick={() => setUnlocked(true)}
            className="mt-3 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 aether-transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex gap-0 border-b">
        <button
          onClick={() => setNotesTab('all')}
          className={`flex-1 py-3 text-xs font-medium aether-transition border-b-2 ${
            !isPrivateTab ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setNotesTab('private')}
          className={`flex-1 py-3 text-xs font-medium aether-transition border-b-2 ${
            isPrivateTab ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Private
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 focus-within:border-primary aether-transition">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Inline create button */}
      <div className="px-4 pb-1">
        <button
          onClick={handleNewNote}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary aether-transition"
        >
          <Plus className="h-4 w-4" />
          <span>New {isPrivateTab ? 'Private ' : ''}Note</span>
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-auto px-4 py-1">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notes found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface-hover ghost-card aether-transition group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  {note.isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(note.modified), 'MMM d, yyyy · h:mm a')}
                    {note.tags.length > 0 && ` · ${note.tags.join(', ')}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
