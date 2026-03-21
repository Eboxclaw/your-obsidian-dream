import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTemplatesForRole } from '@/lib/templates';
import { FileText, Columns3, CheckSquare, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { NoteTemplate, KanbanTemplate, TaskTemplate } from '@/lib/templates';

export function TemplatesView() {
  const { onboarding, addNote, setActiveNote, setView, addBoard, addCard, boards, customTemplates, addCustomTemplate, updateCustomTemplate, deleteCustomTemplate } = useStore();
  const { notes: noteTemplates, kanban: kanbanTemplates, tasks: taskTemplates } = getTemplatesForRole(onboarding.role);

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorType, setEditorType] = useState<'note' | 'task'>('note');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState('');

  const handleUseNoteTemplate = async (template: NoteTemplate) => {
    const note = await addNote(template.title);
    if (!note) return;
    const store = useStore.getState();
    await store.updateNote(note.id, { content: template.content, tags: template.tags });
    setActiveNote(note.id);
    setView('notebook');
  };

  const handleUseKanbanTemplate = async (template: KanbanTemplate) => {
    const board = await addBoard(template.title);
    if (!board) return;
    const store = useStore.getState();
    board.columns.forEach((col) => store.deleteColumn(board.id, col.id));
    for (const col of template.columns) {
      store.addColumn(board.id, col.title);
      const updatedBoard = store.boards.find((b) => b.id === board.id);
      const newCol = updatedBoard && updatedBoard.columns.find((c) => c.title === col.title);
      if (newCol) {
        for (const cardTitle of col.cards) {
          await store.addCard(board.id, newCol.id, cardTitle);
        }
      }
    }
    store.setActiveBoard(board.id);
    setView('kanban');
  };

  const handleUseTaskTemplate = async (template: TaskTemplate) => {
    const board = boards[0];
    if (!board || !board.columns[0]) return;
    const card = await addCard(board.id, board.columns[0].id, template.title);
    if (!card) return;
    const store = useStore.getState();
    await store.updateCard(card.id, {
      description: template.description,
      subtasks: template.subtasks.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
    });
    setView('kanban');
  };

  const handleUseCustomTemplate = async (ct: typeof customTemplates[0]) => {
    if (ct.type === 'note') {
      const note = await addNote(ct.title);
      if (!note) return;
      await useStore.getState().updateNote(note.id, { content: ct.content, tags: ct.tags });
      setActiveNote(note.id);
      setView('notebook');
    } else {
      const board = boards[0];
      if (!board || !board.columns[0]) return;
      const card = await addCard(board.id, board.columns[0].id, ct.title);
      if (!card) return;
      await useStore.getState().updateCard(card.id, { description: ct.content });
      setView('kanban');
    }
  };

  const openEditor = (type: 'note' | 'task', existing?: typeof customTemplates[0]) => {
    setEditorType(type);
    if (existing) {
      setEditingId(existing.id);
      setEditorTitle(existing.title);
      setEditorContent(existing.content);
      setEditorTags(existing.tags.join(', '));
    } else {
      setEditingId(null);
      setEditorTitle('');
      setEditorContent('');
      setEditorTags('');
    }
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    const tags = editorTags.split(',').map((t) => t.trim()).filter(Boolean);
    if (editingId) {
      updateCustomTemplate(editingId, { title: editorTitle, content: editorContent, tags });
    } else {
      addCustomTemplate({ type: editorType, title: editorTitle, content: editorContent, tags });
    }
    setShowEditor(false);
  };

  const customNotes = customTemplates.filter((t) => t.type === 'note');
  const customTasks = customTemplates.filter((t) => t.type === 'task');

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground mb-1">Templates</h1>
          <p className="text-xs text-muted-foreground">
            Curated for:{' '}
            <span className="text-foreground font-medium">
              {onboarding.role ? onboarding.role.charAt(0).toUpperCase() + onboarding.role.slice(1) : 'General'}
            </span>
          </p>
        </div>
        <button
          onClick={() => openEditor('note')}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 aether-transition"
        >
          <Plus className="h-3.5 w-3.5" /> New Template
        </button>
      </div>

      {/* Note Templates */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Note Templates</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {noteTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleUseNoteTemplate(t)}
              className="group flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-surface-hover aether-transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t.tags.join(' · ')}</p>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 aether-transition mt-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Task Templates — 6 templates */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Task Templates</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {taskTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleUseTaskTemplate(t)}
              className="group flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-surface-hover aether-transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t.description.slice(0, 40)}…</p>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 aether-transition mt-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Board Templates */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Columns3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Board Templates</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {kanbanTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleUseKanbanTemplate(t)}
              className="group flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-surface-hover aether-transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t.columns.map((c) => c.title).join(' → ')}</p>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 aether-transition mt-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Custom Templates */}
      {(customNotes.length > 0 || customTasks.length > 0) && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">My Templates</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {customTemplates.map((ct) => (
              <div
                key={ct.id}
                className="group relative flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-surface-hover aether-transition"
              >
                <button onClick={() => handleUseCustomTemplate(ct)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{ct.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{ct.type}</p>
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 aether-transition">
                  <button onClick={() => openEditor(ct.type, ct)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteCustomTemplate(ct.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowEditor(false)}>
          <div className="w-[calc(100%-2rem)] max-w-md rounded-2xl border bg-card p-5 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {editingId ? 'Edit Template' : 'New Template'}
              </h3>
              <button onClick={() => setShowEditor(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Type selector */}
              <div className="flex gap-2">
                {(['note', 'task'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditorType(t)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium aether-transition ${
                      editorType === t ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t === 'note' ? 'Note' : 'Task'}
                  </button>
                ))}
              </div>

              <input
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Template title"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent aether-transition"
              />
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={editorType === 'note' ? 'Markdown content…' : 'Task description…'}
                rows={6}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent aether-transition resize-none"
              />
              <input
                value={editorTags}
                onChange={(e) => setEditorTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent aether-transition"
              />

              <button
                onClick={handleSaveTemplate}
                disabled={!editorTitle.trim()}
                className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-40 aether-transition"
              >
                {editingId ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
