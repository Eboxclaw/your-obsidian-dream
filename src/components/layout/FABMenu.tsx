import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, X, FileText, CheckSquare, FolderPlus, Lock, ArrowLeft, FolderOpen, ChevronRight } from 'lucide-react';

const CREATE_OPTIONS = [
  { id: 'note', label: 'Note', subtitle: 'Markdown file', icon: FileText },
  { id: 'task', label: 'Task', subtitle: 'Kanban card', icon: CheckSquare },
  { id: 'folder', label: 'Folder', subtitle: 'Organize content', icon: FolderPlus },
  { id: 'secret', label: 'Secret', subtitle: 'Encrypted note', icon: Lock },
] as const;

const NOTE_TEMPLATES = [
  { id: 'blank', label: 'Blank', content: '' },
  { id: 'brainstorm', label: 'Brainstorm', content: '# Brainstorm\n\n## Problem\n\n\n## Ideas\n\n- \n\n## Next Steps\n\n' },
  { id: 'meeting', label: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n1. \n\n## Notes\n\n\n## Action Items\n\n- [ ] \n' },
  { id: 'journal', label: 'Journal', content: '# Journal Entry\n\n**Date:** ' + new Date().toLocaleDateString() + '\n\n## Thoughts\n\n\n## Gratitude\n\n1. \n2. \n3. \n' },
];

type Step = 'menu' | 'template' | 'folder';

export function FABMenu() {
  const { ui, toggleFab, addNote, setActiveNote, setView, addCard, boards, folders, addFolder, setActiveFolder } = useStore();
  const [step, setStep] = useState<Step>('menu');
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreate = async (type: string) => {
    if (type === 'note') { setStep('template'); return; }
    if (type === 'task') {
      const board = boards[0];
      if (board && board.columns[0]) {
        await addCard(board.id, board.columns[0].id, 'New Task');
        setView('kanban');
      }
      handleClose();
      return;
    }
    if (type === 'folder') { setStep('folder'); return; }
    if (type === 'secret') {
      const note = await addNote('Private Note', null, true);
      if (note) {
        setActiveNote(note.id);
        setView('notebook');
      }
      handleClose();
      return;
    }
  };

  const handleTemplate = async (template: typeof NOTE_TEMPLATES[0]) => {
    const note = await addNote(template.label === 'Blank' ? 'Untitled' : template.label);
    if (note) {
      setActiveNote(note.id);
      setView('notebook');
    }
    handleClose();
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const folder = await addFolder(newFolderName.trim());
      if (folder) {
        setActiveFolder(folder.id);
        setNewFolderName('');
        handleClose();
      }
    }
  };

  const handleSwitchFolder = (folderId: string | null) => {
    setActiveFolder(folderId);
    handleClose();
  };

  const handleClose = () => {
    toggleFab();
    setStep('menu');
    setNewFolderName('');
  };

  return (
    <>
      {/* FAB Button — fixed bottom-LEFT corner */}
      <button
        onClick={ui.fabOpen ? handleClose : toggleFab}
        className={`fixed bottom-[7.5rem] right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg aether-transition ${
          ui.fabOpen
            ? 'bg-muted text-foreground rotate-45'
            : 'bg-accent text-accent-foreground'
        }`}
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Full-screen overlay */}
      {ui.fabOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-card p-5 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'menu' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Create New</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">What do you want to create?</p>
                  </div>
                  <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition">
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
            )}

            {step === 'template' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setStep('menu')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground aether-transition">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3">Choose Template</h3>
                <div className="space-y-2">
                  {NOTE_TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => handleTemplate(t)} className="flex w-full items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-hover ghost-card aether-transition">
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'folder' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setStep('menu')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground aether-transition">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover aether-transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Folders</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Create a new folder or switch to an existing one.</p>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
                    placeholder="New folder name…"
                    className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent aether-transition"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-40 aether-transition"
                  >
                    Create
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  <button onClick={() => handleSwitchFolder(null)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface-hover aether-transition">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">All Folders</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </button>
                  {folders.map((folder) => (
                    <button key={folder.id} onClick={() => handleSwitchFolder(folder.id)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface-hover aether-transition">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{folder.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
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
