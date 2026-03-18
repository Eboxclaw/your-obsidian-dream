import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { useStore } from '@/store';
import { KanbanColumnComponent } from '@/components/kanban/KanbanColumn';
import { Plus } from 'lucide-react';

export function KanbanView() {
  const { ui, boards, cards, addColumn, moveCard, addCard } = useStore();
  const folderBoards = ui.activeFolderId
    ? boards.filter((b) => b.folderId === ui.activeFolderId)
    : boards;
  const board = folderBoards.find((b) => b.id === ui.activeBoardId) || folderBoards[0];
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [newColTitle, setNewColTitle] = useState('');
  const [showNewCol, setShowNewCol] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No board selected</p>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;

    const cardId = active.id as string;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    let targetColId: string;
    let targetIndex: number;

    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      targetColId = overCard.columnId;
      const col = board.columns.find((c) => c.id === targetColId);
      targetIndex = col ? col.cardIds.indexOf(over.id as string) : 0;
    } else {
      targetColId = over.id as string;
      const col = board.columns.find((c) => c.id === targetColId);
      targetIndex = col ? col.cardIds.length : 0;
    }

    if (card.columnId !== targetColId || true) {
      moveCard(cardId, card.columnId, targetColId, targetIndex);
    }
  };

  const handleAddColumn = () => {
    if (newColTitle.trim()) {
      addColumn(board.id, newColTitle.trim());
      setNewColTitle('');
      setShowNewCol(false);
    }
  };

  const handleNewTask = () => {
    if (board.columns[0]) {
      addCard(board.id, board.columns[0].id, 'New Task');
    }
  };

  const activeCard = cards.find((c) => c.id === activeCardId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          {board.title}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewTask}
            className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary aether-transition"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </button>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {cards.filter((c) => c.boardId === board.id).length} cards · {board.columns.length} columns
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-px overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {board.columns.map((col) => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              boardId={board.id}
              cards={cards.filter(
                (c) => c.boardId === board.id && col.cardIds.includes(c.id)
              )}
            />
          ))}

          <DragOverlay>
            {activeCard ? (
              <div className="w-64 rounded-md border bg-surface p-3 opacity-90 shadow-lg">
                <p className="text-xs text-foreground">{activeCard.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add column */}
        <div className="w-64 shrink-0">
          {showNewCol ? (
            <div className="rounded-md border bg-surface p-2">
              <input
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                placeholder="Column title…"
                className="mb-2 w-full rounded-sm border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddColumn}
                  className="rounded-sm bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewCol(false)}
                  className="rounded-sm px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCol(true)}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground aether-transition"
            >
              <Plus className="h-3 w-3" />
              Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
