import { useState } from 'react';
import { useStore } from '@/store';
import { Plus, X, FileText, CheckSquare, FolderPlus, Lock, Bot, ChevronRight } from 'lucide-react';
import { TASK_TEMPLATES, type TaskTemplate } from '@/lib/templates';

type FabTab = 'notes' | 'tasks' | 'ai';

const NOTE_TEMPLATES = [
  { id: 'blank', label: 'Blank', content: '' },
  { id: 'brainstorm', label: 'Brainstorm', content: '# Brainstorm\n\n## Problem\n\n\n## Ideas\n\n- \n\n## Next Steps\n\n' },
  { id: 'meeting', label: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n1. \n\n## Notes\n\n\n## Action Items\n\n- [ ] \n' },
  { id: 'journal', label: 'Journal', content: '# Journal Entry\n\n**Date:** ' + new Date().toLocaleDateString() + '\n\n## Thoughts\n\n\n## Gratitude\n\n1. \n2. \n3. \n' },
];

export function FABMenu() {
  const { ui, toggleFab, addNote, setActiveNote, setView, addCard, boards, toggleInlineAgent } = useStore();
  const [step, setStep] = useState<'menu' | 'note-template' | 'task-template'>('menu');
  const [activeTab, setActiveTab] = useState<FabTab>('notes');

  const handleCreateNote = () => {
    setStep('note-template');
  };

  const handleCreateFolder = () => {
    addNote('New Folder');
    handleClose();
  };

  const handleCreateSecret = () => {
    const note = addNote('Private Note', null, true);
    setActiveNote(note.id);
    setView('notebook');
    handleClose();
  };

  const handleCreateTask = () => {
    setStep('task-template');
  };

  const handleNoteTemplate = (template: typeof NOTE_TEMPLATES[0]) => {
    const note = addNote(template.label === 'Blank' ? 'Untitled' : template.label);
    setActiveNote(note.id);
    setView('notebook');
    handleClose();
  };

  const handleTaskTemplate = (template: TaskTemplate) => {
    const board = boards[0];
    if (board && board.columns[0]) {
      const card = addCard(board.id, board.columns[0].id, template.title);
      const store = useStore.getState();
      store.updateCard(card.id, {
        description: template.description,
        subtasks: template.subtasks.map((text) => ({
          id: crypto.randomUUID(),
          text,
          done: false,
        })),
      });
      setView('kanban');
    }
    handleClose();
  };

  const handleQuickTask = () => {
    const board = boards[0];
    if (board && board.columns[0]) {
      addCard(board.id, board.columns[0].id, 'New Task');
      setView('kanban');
    }
    handleClose();
  };

  const handleAIAction = (action: string) => {
    handleClose();
    if (!ui.inlineAgentOpen) {
      toggleInlineAgent();
    }
  };

  const handleClose = () => {
    toggleFab();
    setStep('menu');
    setActiveTab('notes');
  };

  return (
    <>
      {/* FAB Button — fixed bottom-right */}
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

      {/* Full-screen overlay */}
      {ui.fabOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-card p-5 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'menu' ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Create New</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">What do you want to create?</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted aether-transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Workspace tabs */}
                <div className="flex gap-1 mb-4 rounded-xl bg-muted p-1">
                  {(['notes', 'tasks', 'ai'] as FabTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium aether-transition ${
                        activeTab === tab
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'notes' ? 'Notes' : tab === 'tasks' ? 'Tasks' : 'AI RAG'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === 'notes' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCreateNote}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center hover:bg-muted/50 aether-transition"
                    >
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Note</span>
                      <span className="text-[10px] text-muted-foreground">Markdown file</span>
                    </button>
                    <button
                      onClick={handleCreateFolder}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center hover:bg-muted/50 aether-transition"
                    >
                      <FolderPlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Folder</span>
                      <span className="text-[10px] text-muted-foreground">Organize notes</span>
                    </button>
                    <button
                      onClick={handleCreateSecret}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center hover:bg-muted/50 aether-transition"
                    >
                      <Lock className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Secret</span>
                      <span className="text-[10px] text-muted-foreground">Encrypted note</span>
                    </button>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleQuickTask}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 aether-transition"
                    >
                      <CheckSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">Quick Task</p>
                        <p className="text-[10px] text-muted-foreground">Blank kanban card</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={handleCreateTask}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 aether-transition"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">From Template</p>
                        <p className="text-[10px] text-muted-foreground">Todo, Trading Journal, Research…</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAIAction('Summarize my recent notes')}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 aether-transition"
                    >
                      <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">Summarize Notes</p>
                        <p className="text-[10px] text-muted-foreground">AI summary of recent activity</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAIAction('Find connections between my notes')}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 aether-transition"
                    >
                      <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">Find Connections</p>
                        <p className="text-[10px] text-muted-foreground">Discover linked ideas via RAG</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAIAction('Generate a note from my tasks')}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 aether-transition"
                    >
                      <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">Tasks → Note</p>
                        <p className="text-[10px] text-muted-foreground">Generate note from task context</p>
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : step === 'note-template' ? (
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted aether-transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3">Note Template</h3>
                <div className="space-y-2">
                  {NOTE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleNoteTemplate(t)}
                      className="flex w-full items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted/50 aether-transition"
                    >
                      {t.label}
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted aether-transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3">Task Template</h3>
                <div className="space-y-2">
                  {TASK_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTaskTemplate(t)}
                      className="flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left hover:bg-muted/50 aether-transition"
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                      </div>
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
