import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@/store';
import type { KanbanCard } from '@/types';
import { GripVertical, CheckSquare, Square, Trash2 } from 'lucide-react';

interface Props {
  card: KanbanCard;
}

export function KanbanCardComponent({ card }: Props) {
  const { updateCard, deleteCard } = useStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const toggleSubtask = (subtaskId: string) => {
    updateCard(card.id, {
      subtasks: card.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, done: !st.done } : st
      ),
    });
  };

  const doneCount = card.subtasks.filter((st) => st.done).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-sm border bg-background p-2.5 aether-transition ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 aether-transition"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">{card.title}</p>
          {card.description && (
            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
              {card.description}
            </p>
          )}
          {card.subtasks.length > 0 && (
            <div className="mt-2 space-y-1">
              {card.subtasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => toggleSubtask(st.id)}
                  className="flex w-full items-center gap-1.5 text-left"
                >
                  {st.done ? (
                    <CheckSquare className="h-3 w-3 shrink-0 text-accent" />
                  ) : (
                    <Square className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={`text-[10px] ${
                      st.done
                        ? 'text-muted-foreground line-through'
                        : 'text-secondary-foreground'
                    }`}
                  >
                    {st.text}
                  </span>
                </button>
              ))}
              <div className="mt-1 text-[9px] font-mono text-muted-foreground tabular-nums">
                {doneCount}/{card.subtasks.length}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => deleteCard(card.id)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 aether-transition"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
