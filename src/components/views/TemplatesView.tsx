import { useStore } from '@/store';
import { getTemplatesForRole } from '@/lib/templates';
import { FileText, Columns3, Plus } from 'lucide-react';
import type { NoteTemplate, KanbanTemplate } from '@/lib/templates';

export function TemplatesView() {
  const { onboarding, addNote, setActiveNote, setView, addBoard } = useStore();
  const { notes: noteTemplates, kanban: kanbanTemplates } = getTemplatesForRole(onboarding.role);

  const handleUseNoteTemplate = (template: NoteTemplate) => {
    const note = addNote(template.title);
    // Slight delay to ensure note is created
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
    // Delete default columns and create template columns
    const store = useStore.getState();
    // Remove default columns
    board.columns.forEach((col) => {
      store.deleteColumn(board.id, col.id);
    });
    // Add template columns
    template.columns.forEach((col) => {
      store.addColumn(board.id, col.title);
      // Add pre-filled cards
      const updatedBoard = store.boards.find((b) => b.id === board.id);
      const newCol = updatedBoard?.columns.find((c) => c.title === col.title);
      if (newCol) {
        col.cards.forEach((cardTitle) => {
          store.addCard(board.id, newCol.id, cardTitle);
        });
      }
    });
    store.setActiveBoard(board.id);
    setView('kanban');
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-lg font-semibold tracking-tight text-foreground mb-1">Templates</h1>
        <p className="text-xs text-muted-foreground">
          Curated for your role:{' '}
          <span className="text-foreground font-medium">
            {onboarding.role ? onboarding.role.charAt(0).toUpperCase() + onboarding.role.slice(1) : 'General'}
          </span>
        </p>
      </div>

      {/* Note Templates */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Note Templates
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {noteTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleUseNoteTemplate(t)}
              className="group flex items-start justify-between rounded-md border bg-surface p-3 text-left hover:bg-surface-hover aether-transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {t.tags.join(' · ')}
                </p>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 aether-transition mt-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Kanban Templates */}
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
              className="group flex items-start justify-between rounded-md border bg-surface p-3 text-left hover:bg-surface-hover aether-transition"
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
    </div>
  );
}
