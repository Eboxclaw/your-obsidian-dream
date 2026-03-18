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
      addNote('New Folder');
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
      {/* FAB Button — fixed bottom-right corner */}
      <button
        onClick={ui.fabOpen ? handleClose : toggleFab}
        className={`fixed bottom-[7.5rem] right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg aether-transition ${
          ui.fabOpen
            ? 'bg-muted text-foreground rotate-45'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Full-screen overlay with centered card */}
      {ui.fabOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-card p-5 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'menu' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Create New</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">What do you want to create?</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CREATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleCreate(opt.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center hover:bg-surface-hover ghost-card aether-transition"
                    >
                      <opt.icon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.subtitle}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setStep('menu')}
                    className="text-xs text-muted-foreground hover:text-foreground aether-transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3">Choose Template</h3>
                <div className="space-y-2">
                  {NOTE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplate(t)}
                      className="flex w-full items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-hover ghost-card aether-transition"
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
