import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '@/lib/store';
import { KanbanCardComponent } from '@/components/kanban/KanbanCard';
import type { KanbanColumn, KanbanCard } from '@/lib/types';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';

interface Props {
  column: KanbanColumn;
  boardId: string;
  cards: KanbanCard[];
}

export function KanbanColumnComponent({ column, boardId, cards }: Props) {
  const { addCard, deleteColumn, renameColumn } = useStore();
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showNewCard, setShowNewCard] = useState(false);
  const [editing, setEditing] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // Sort cards by column order
  const sortedCards = column.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean) as KanbanCard[];

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCard(boardId, column.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowNewCard(false);
    }
  };

  const handleRename = () => {
    if (colTitle.trim()) {
      renameColumn(boardId, column.id, colTitle.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`mr-3 flex w-64 shrink-0 flex-col rounded-md border bg-surface/50 ${
        isOver ? 'border-primary/50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        {editing ? (
          <input
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="flex-1 bg-transparent text-xs font-medium outline-none"
            autoFocus
          />
        ) : (
          <button
            onDoubleClick={() => setEditing(true)}
            className="text-xs font-medium text-secondary-foreground"
          >
            {column.title}
            <span className="ml-1.5 font-mono text-muted-foreground">
              {sortedCards.length}
            </span>
          </button>
        )}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowNewCard(true)}
            className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => deleteColumn(boardId, column.id)}
            className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-1 px-2 pb-2">
        <SortableContext
          items={sortedCards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedCards.map((card) => (
            <KanbanCardComponent key={card.id} card={card} />
          ))}
        </SortableContext>

        {showNewCard && (
          <div className="rounded-sm border bg-background p-2">
            <input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') setShowNewCard(false);
              }}
              placeholder="Card title…"
              className="mb-1.5 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddCard}
                className="rounded-sm bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewCard(false)}
                className="text-[10px] text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
