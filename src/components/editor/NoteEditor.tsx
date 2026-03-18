import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useStore } from '@/lib/store';
import type { Note } from '@/lib/types';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote, notes, setActiveNote, getNoteByTitle, addNote } = useStore();
  const [title, setTitle] = useState(note.title);
  const [showWikiSearch, setShowWikiSearch] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<Note[]>([]);
  const [selectedWikiIdx, setSelectedWikiIdx] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: { class: 'code-block' },
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'prose-editor outline-none',
      },
      handleKeyDown: (_view, event) => {
        // Detect [[ for wikilink
        if (event.key === '[' && _view.state.doc.textBetween(
          Math.max(0, _view.state.selection.from - 1),
          _view.state.selection.from
        ) === '[') {
          setShowWikiSearch(true);
          setWikiQuery('');
          setSelectedWikiIdx(0);
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateNote(note.id, { content });

      // Check for wikilink typing
      if (showWikiSearch) {
        const text = editor.getText();
        const cursorPos = editor.state.selection.from;
        const textBeforeCursor = editor.state.doc.textBetween(0, cursorPos);
        const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');
        if (lastDoubleBracket >= 0) {
          const query = textBeforeCursor.slice(lastDoubleBracket + 2);
          if (query.includes(']]')) {
            setShowWikiSearch(false);
          } else {
            setWikiQuery(query);
            const results = notes
              .filter((n) => n.id !== note.id && n.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5);
            setWikiResults(results);
            setSelectedWikiIdx(0);
          }
        }
      }
    },
  });

  // Sync editor when note changes
  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content);
    }
    setTitle(note.title);
  }, [note.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateNote(note.id, { title: e.target.value });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (editor) editor.commands.focus();
    }
  };

  const insertWikilink = useCallback(
    (targetTitle: string) => {
      if (!editor) return;
      const state = editor.state;
      const cursorPos = state.selection.from;
      const textBeforeCursor = state.doc.textBetween(0, cursorPos);
      const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');

      if (lastDoubleBracket >= 0) {
        // Replace from [[ to cursor with the wikilink
        const from = lastDoubleBracket;
        const to = cursorPos;
        // We need to go one character back to include the first [
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(`[[${targetTitle}]]`)
          .run();
      }
      setShowWikiSearch(false);
    },
    [editor]
  );

  // Handle wikilink keyboard navigation
  useEffect(() => {
    if (!showWikiSearch) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedWikiIdx((i) => Math.min(i + 1, wikiResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedWikiIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && wikiResults.length > 0) {
        e.preventDefault();
        insertWikilink(wikiResults[selectedWikiIdx].title);
      } else if (e.key === 'Escape') {
        setShowWikiSearch(false);
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [showWikiSearch, wikiResults, selectedWikiIdx, insertWikilink]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="mx-auto w-full max-w-[720px] px-6 py-16">
        {/* Title */}
        <input
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          className="mb-6 w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          autoFocus={title === 'Untitled'}
        />

        {/* Editor */}
        <div className="tiptap-editor relative">
          <EditorContent editor={editor} />

          {/* Wikilink search overlay */}
          {showWikiSearch && (
            <div className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg animate-fade-in">
              {wikiQuery && (
                <div className="px-2 py-1 text-[10px] text-muted-foreground">
                  Linking to "{wikiQuery}"
                </div>
              )}
              {wikiResults.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  {wikiQuery ? 'No notes found — Enter to create' : 'Type to search notes…'}
                </div>
              ) : (
                wikiResults.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => insertWikilink(n.title)}
                    className={`flex w-full rounded-sm px-2 py-1.5 text-left text-xs aether-transition ${
                      i === selectedWikiIdx
                        ? 'bg-surface-active text-foreground'
                        : 'text-secondary-foreground hover:bg-surface-hover'
                    }`}
                  >
                    {n.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
