import { useMemo } from 'react';
import { useStore } from '@/store';

export function useBacklinks(noteId: string | null) {
  const notes = useStore((s) => s.notes);

  return useMemo(() => {
    if (!noteId) return [];
    const currentNote = notes.find((n) => n.id === noteId);
    if (!currentNote) return [];

    const title = currentNote.title.toLowerCase();
    return notes.filter((n) => {
      if (n.id === noteId) return false;
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(n.content)) !== null) {
        if (match[1].toLowerCase() === title) return true;
      }
      return false;
    });
  }, [notes, noteId]);
}

export function useWikilinks(noteId: string | null) {
  const notes = useStore((s) => s.notes);

  return useMemo(() => {
    if (!noteId) return [];
    const note = notes.find((n) => n.id === noteId);
    if (!note) return [];

    const links: string[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = regex.exec(note.content)) !== null) {
      links.push(match[1]);
    }
    return links;
  }, [notes, noteId]);
}

export function useLinkCount() {
  const notes = useStore((s) => s.notes);

  return useMemo(() => {
    let count = 0;
    notes.forEach((n) => {
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(n.content)) !== null) {
        count++;
      }
    });
    return count;
  }, [notes]);
}
