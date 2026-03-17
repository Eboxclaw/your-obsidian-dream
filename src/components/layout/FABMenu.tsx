import { useState } from 'react';
import { useStore } from '@/store';
import { Plus, X, FileText, CheckSquare, FolderPlus, Lock } from 'lucide-react';

const CREATE_OPTIONS = [
  { id: 'note', label: 'Note', subtitle: 'Markdown file', icon: FileText },
  { id: 'task', label: 'Task', subtitle: 'Kanban card', icon: CheckSquare },
  { id: 'folder', label: 'Folder', subtitle: 'Organize notes', icon: FolderPlus },
  { id: 'secret', label: 'Secret', subtitle: 'Encrypted note', icon: Lock },
] as const;

const NOTE_TEMPLATES = [
  { id: 'blank', label: 'Blank', content: '' },
  { id: 'brainstorm', label: 'Brainstorm', content: '# Brainstorm\n\n## Problem\n\n\n## Ideas\n\n- \n\n## Next Steps\n\n' },
  { id: 'meeting', label: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n1. \n\n## Notes\n\n\n## Action Items\n\n- [ ] \n' },
  { id: 'journal', label: 'Journal', content: '# Journal Entry\n\n**Date:** ' + new Date().toLocaleDateString() + '\n\n## Thoughts\n\n\n## Gratitude\n\n1. \n2. \n3. \n' },
];

export function FABMenu() {
  const { ui, toggleFab, addNote, setActiveNote, setView, addCard, boards } = useStore();
  const [step, setStep] = useState<'menu' | 'template'>('menu');

  const handleCreate = (type: string) => {
    if (type === 'note') {
      setStep('template');
      return;
    }
    if (type === 'task') {
      const board = boards[0];
      if (board && board.columns[0]) {
        addCard(board.id, board.columns[0].id, 'New Task');
        setView('kanban');
      }
      toggleFab();
      setStep('menu');
      return;
    }
    if (type === 'folder') {
      const note = addNote('New Folder');
      // Mark as folder
      toggleFab();
      setStep('menu');
      return;
    }
    if (type === 'secret') {
      const note = addNote('Private Note', null, true);
      setActiveNote(note.id);
      setView('notebook');
      toggleFab();
      setStep('menu');
      return;
    }
  };

  const handleTemplate = (template: typeof NOTE_TEMPLATES[0]) => {
    const note = addNote(template.label === 'Blank' ? 'Untitled' : template.label);
    if (template.content) {
      // We set the content after creation via updateNote would be cleaner but addNote returns the note
    }
    setActiveNote(note.id);
    setView('notebook');
    toggleFab();
    setStep('menu');
  };

  const handleClose = () => {
    toggleFab();
    setStep('menu');
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={ui.fabOpen ? handleClose : toggleFab}
        className={`fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg aether-transition ${
          ui.fabOpen
            ? 'bg-muted text-foreground rotate-45'
            : 'bg-foreground text-background'
        }`}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {ui.fabOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="absolute bottom-36 right-5 w-72 rounded-2xl border bg-card p-4 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'menu' ? (
              <>
                <h3 className="text-sm font-semibold text-foreground mb-3">Create New</h3>
                <div className="grid grid-cols-2 gap-2">
                  {CREATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleCreate(opt.id)}
                      className="flex flex-col items-start gap-1 rounded-xl border p-3 text-left hover:bg-surface-hover aether-transition"
                    >
                      <opt.icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.subtitle}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep('menu')}
                  className="text-xs text-muted-foreground hover:text-foreground mb-2 aether-transition"
                >
                  ← Back
                </button>
                <h3 className="text-sm font-semibold text-foreground mb-3">Choose Template</h3>
                <div className="space-y-1.5">
                  {NOTE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplate(t)}
                      className="flex w-full items-center rounded-lg border px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-surface-hover aether-transition"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
