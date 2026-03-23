import { useStore } from '@/store';
import { useBacklinks } from '@/hooks/use-wikilinks';
import { format } from 'date-fns';

export function Inspector() {
  const { ui, notes, setActiveNote } = useStore();
  const backlinks = useBacklinks(ui.activeNoteId);
  const note = notes.find((n) => n.id === ui.activeNoteId);

  if (!note) {
    return (
      <div className="flex w-72 shrink-0 flex-col items-center justify-center bg-background p-6">
        <p className="text-xs text-muted-foreground">No note selected</p>
      </div>
    );
  }

  const wordCount = note.content
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = note.content.length;

  return (
    <div className="flex w-72 shrink-0 flex-col bg-background overflow-auto">
      {/* Metadata */}
      <div className="border-b p-4">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Metadata
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Created</span>
            <span className="font-mono text-secondary-foreground tabular-nums">
              {format(new Date(note.created), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Modified</span>
            <span className="font-mono text-secondary-foreground tabular-nums">
              {format(new Date(note.modified), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Words</span>
            <span className="font-mono text-secondary-foreground tabular-nums">
              {wordCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Characters</span>
            <span className="font-mono text-secondary-foreground tabular-nums">
              {charCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="border-b p-4">
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border bg-surface px-1.5 py-0.5 text-[10px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks */}
      <div className="p-4">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Backlinks ({backlinks.length})
        </h3>
        {backlinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No backlinks</p>
        ) : (
          <div className="space-y-1">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => setActiveNote(bl.id)}
                className="block w-full rounded-sm px-2 py-1.5 text-left text-xs text-primary hover:bg-surface-hover aether-transition"
              >
                {bl.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
