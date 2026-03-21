import { useState } from 'react';
import { useStore } from '@/lib/store';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { FileText, Lock, Search, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function Notebook() {
  const { ui, notes, addNote, setActiveNote, setNotesTab, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);

  const activeNote = notes.find((n) => n.id === ui.activeNoteId);

  // If a note is selected, show the editor with delete button
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
          <span className="text-sm font-medium text-foreground truncate flex-1">{activeNote.title}</span>
          {activeNote.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
          <button
            onClick={() => {
              void deleteNote(activeNote.id);
              setActiveNote(null);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive aether-transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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

  const handleNewNote = async () => {
    const note = await addNote(isPrivateTab ? 'Private Note' : 'Untitled', null, isPrivateTab);
    if (note) {
      setActiveNote(note.id);
    }
  };

  // Biometric-first gate for private notes, PIN as fallback
  if (isPrivateTab && !unlocked) {
    const attemptBiometric = () => {
      // Simulate biometric check - in real app would use WebAuthn
      setBiometricChecked(true);
      setTimeout(() => setUnlocked(true), 800);
    };

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
            className="flex-1 py-3 text-xs font-medium text-foreground border-b-2 border-accent aether-transition"
          >
            <span className="flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Private
            </span>
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {!biometricChecked ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted mb-4">
                <svg className="h-8 w-8 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                  <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6a6 6 0 0 1 5 2.5" />
                  <path d="M8 19c.5-1 1-3 1-7 0-2 1-3.5 3-3.5s3 1.5 3 3.5c0 2-.5 4-1 5" />
                  <path d="M12 12v4" />
                  <path d="M22 12a10 10 0 0 1-5 8.5" />
                  <path d="M18 12c0 3-1 5.5-2 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Unlock Private Notes</p>
              <p className="text-xs text-muted-foreground mb-5 text-center">
                Authenticate with biometrics to access your encrypted notes
              </p>
              <button
                onClick={attemptBiometric}
                className="w-full max-w-[200px] rounded-2xl bg-accent py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 aether-transition mb-3"
              >
                Use Biometrics
              </button>
              <button
                onClick={() => setBiometricChecked(true)}
                className="text-xs text-muted-foreground hover:text-foreground aether-transition"
              >
                Use PIN instead
              </button>
            </>
          ) : !unlocked ? (
            <>
              <Lock className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Enter PIN</p>
              <p className="text-xs text-muted-foreground mb-4">Fallback authentication</p>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setUnlocked(true); }}
                placeholder="PIN"
                className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-sm outline-none focus:border-accent aether-transition"
                autoFocus
              />
              <button
                onClick={() => setUnlocked(true)}
                className="mt-3 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 aether-transition"
              >
                Unlock
              </button>
            </>
          ) : null}
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
            !isPrivateTab ? 'text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setNotesTab('private')}
          className={`flex-1 py-3 text-xs font-medium aether-transition border-b-2 ${
            isPrivateTab ? 'text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Private
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 focus-within:border-accent aether-transition">
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
          className="flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-accent aether-transition"
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
              <div
                key={note.id}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface-hover ghost-card aether-transition group"
              >
                <button
                  onClick={() => setActiveNote(note.id)}
                  className="flex flex-1 items-center gap-3 min-w-0"
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteNote(note.id);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 aether-transition shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
