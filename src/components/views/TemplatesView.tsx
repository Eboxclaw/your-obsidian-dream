import { useState } from 'react';
import { useStore } from '@/store';
import { getTemplatesForRole, NOTE_TEMPLATES, KANBAN_TEMPLATES, TASK_TEMPLATES } from '@/lib/templates';
import type { NoteTemplate, KanbanTemplate, TaskTemplate } from '@/lib/templates';
import { FileText, Columns3, CheckSquare, Plus, Pencil, Save, X, Trash2 } from 'lucide-react';

type TemplateTab = 'notes' | 'tasks' | 'boards';

interface EditingTemplate {
  type: 'note' | 'task';
  id: string | null; // null = new
  title: string;
  content: string; // for notes
  description: string; // for tasks
  subtasks: string; // comma separated for tasks
  tags: string;
}

export function TemplatesView() {
  const { onboarding, addNote, setActiveNote, setView, addBoard, addCard, boards } = useStore();
  const { notes: noteTemplates, kanban: kanbanTemplates, tasks: taskTemplates } = getTemplatesForRole(onboarding.role);
  const [activeTab, setActiveTab] = useState<TemplateTab>('notes');
  const [editing, setEditing] = useState<EditingTemplate | null>(null);
  const [customNoteTemplates, setCustomNoteTemplates] = useState<NoteTemplate[]>([]);
  const [customTaskTemplates, setCustomTaskTemplates] = useState<TaskTemplate[]>([]);

  const handleUseNoteTemplate = (template: NoteTemplate) => {
    const note = addNote(template.title);
    const store = useStore.getState();
    store.updateNote(note.id, {
      content: template.content,
      tags: template.tags,
    });
    setActiveNote(note.id);
    setView('notebook');
  };

  const handleUseKanbanTemplate = (template: KanbanTemplate) => {
    const board = addBoard(template.title);
    const store = useStore.getState();
    board.columns.forEach((col) => store.deleteColumn(board.id, col.id));
    template.columns.forEach((col) => {
      store.addColumn(board.id, col.title);
      const updatedBoard = store.boards.find((b) => b.id === board.id);
      const newCol = updatedBoard?.columns.find((c) => c.title === col.title);
      if (newCol) {
        col.cards.forEach((cardTitle) => store.addCard(board.id, newCol.id, cardTitle));
      }
    });
    store.setActiveBoard(board.id);
    setView('kanban');
  };

  const handleUseTaskTemplate = (template: TaskTemplate) => {
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
  };

  const handleNewTemplate = (type: 'note' | 'task') => {
    setEditing({
      type,
      id: null,
      title: '',
      content: '',
      description: '',
      subtasks: '',
      tags: '',
    });
  };

  const handleEditTemplate = (type: 'note' | 'task', template: NoteTemplate | TaskTemplate) => {
    if (type === 'note') {
      const t = template as NoteTemplate;
      setEditing({
        type: 'note',
        id: t.id,
        title: t.title,
        content: t.content,
        description: '',
        subtasks: '',
        tags: t.tags.join(', '),
      });
    } else {
      const t = template as TaskTemplate;
      setEditing({
        type: 'task',
        id: t.id,
        title: t.title,
        content: '',
        description: t.description,
        subtasks: t.subtasks.join(', '),
        tags: t.tags.join(', '),
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!editing || !editing.title.trim()) return;
    const tags = editing.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editing.type === 'note') {
      const newTemplate: NoteTemplate = {
        id: editing.id || `custom-nt-${crypto.randomUUID()}`,
        title: editing.title,
        content: editing.content,
        tags,
        roles: ['general'],
        isCustom: true,
      };
      setCustomNoteTemplates((prev) => {
        const filtered = prev.filter((t) => t.id !== newTemplate.id);
        return [...filtered, newTemplate];
      });
    } else {
      const newTemplate: TaskTemplate = {
        id: editing.id || `custom-tt-${crypto.randomUUID()}`,
        title: editing.title,
        description: editing.description,
        subtasks: editing.subtasks.split(',').map((s) => s.trim()).filter(Boolean),
        tags,
        roles: ['general'],
        isCustom: true,
      };
      setCustomTaskTemplates((prev) => {
        const filtered = prev.filter((t) => t.id !== newTemplate.id);
        return [...filtered, newTemplate];
      });
    }
    setEditing(null);
  };

  const handleDeleteCustom = (type: 'note' | 'task', id: string) => {
    if (type === 'note') {
      setCustomNoteTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      setCustomTaskTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const allNoteTemplates = [...noteTemplates, ...customNoteTemplates];
  const allTaskTemplates = [...taskTemplates, ...customTaskTemplates];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground mb-1">Templates</h1>
        <p className="text-xs text-muted-foreground">
          Curated for your role:{' '}
          <span className="text-foreground font-medium">
            {onboarding.role ? onboarding.role.charAt(0).toUpperCase() + onboarding.role.slice(1) : 'General'}
          </span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl bg-muted p-1">
        {(['notes', 'tasks', 'boards'] as TemplateTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setEditing(null); }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium aether-transition ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'notes' ? 'Notes' : tab === 'tasks' ? 'Tasks' : 'Boards'}
          </button>
        ))}
      </div>

      {/* Editor */}
      {editing && (
        <div className="mb-6 rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {editing.id ? 'Edit Template' : 'New Template'}
            </h3>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            placeholder="Template title"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          {editing.type === 'note' ? (
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Markdown content…"
              rows={6}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring font-mono"
            />
          ) : (
            <>
              <input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Description"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <input
                value={editing.subtasks}
                onChange={(e) => setEditing({ ...editing, subtasks: e.target.value })}
                placeholder="Subtasks (comma separated)"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </>
          )}
          <input
            value={editing.tags}
            onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
            placeholder="Tags (comma separated)"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!editing.title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40 aether-transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save Template
          </button>
        </div>
      )}

      {/* Note Templates */}
      {activeTab === 'notes' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Note Templates
              </h2>
            </div>
            <button
              onClick={() => handleNewTemplate('note')}
              className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allNoteTemplates.map((t) => (
              <div
                key={t.id}
                className="group relative flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-muted/50 aether-transition"
              >
                <button
                  onClick={() => handleUseNoteTemplate(t)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {t.tags.join(' · ')}
                  </p>
                </button>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 aether-transition">
                  {t.isCustom && (
                    <>
                      <button
                        onClick={() => handleEditTemplate('note', t)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustom('note', t.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  <Plus className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Task Templates */}
      {activeTab === 'tasks' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Task Templates
              </h2>
            </div>
            <button
              onClick={() => handleNewTemplate('task')}
              className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground aether-transition"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allTaskTemplates.map((t) => (
              <div
                key={t.id}
                className="group relative flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-muted/50 aether-transition"
              >
                <button
                  onClick={() => handleUseTaskTemplate(t)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{t.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {t.subtasks.length} subtasks
                  </p>
                </button>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 aether-transition">
                  {t.isCustom && (
                    <>
                      <button
                        onClick={() => handleEditTemplate('task', t)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustom('task', t.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  <Plus className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Board Templates */}
      {activeTab === 'boards' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Board Templates
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {kanbanTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleUseKanbanTemplate(t)}
                className="group flex items-start justify-between rounded-md border bg-card p-3 text-left hover:bg-muted/50 aether-transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {t.columns.map((c) => c.title).join(' → ')}
                  </p>
                </div>
                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 aether-transition mt-0.5" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
