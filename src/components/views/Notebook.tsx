import { useCallback } from 'react';
import { useStore } from '@/store';
import { NoteEditor } from '@/components/editor/NoteEditor';

export function Notebook() {
  const { ui, notes, setActiveNote, setView } = useStore();
  const activeNote = notes.find((n) => n.id === ui.activeNoteId);

  if (!activeNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No note selected
          </p>
          <p className="text-xs text-muted-foreground">
            Select a note from the sidebar or press{' '}
            <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">⌘N</kbd>{' '}
            to create one
          </p>
        </div>
      </div>
    );
  }

  return <NoteEditor note={activeNote} />;
}
