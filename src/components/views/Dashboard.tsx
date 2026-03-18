import { useState } from 'react';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { FileText, CheckSquare, Bot, GitFork, Sparkles, Shield } from 'lucide-react';

export function Dashboard() {
  const { notes, boards, cards, agents, skills, roles, setActiveNote, setView, setActiveBoard, onboarding } = useStore();
  const [tab, setTab] = useState<'notes' | 'tasks'>('notes');

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, 3);

  const recentCards = [...cards]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 3);

  const totalTasks = cards.length;
  const doneTasks = cards.filter((c) => {
    const board = boards.find((b) => b.id === c.boardId);
    if (!board) return false;
    const doneCol = board.columns.find((col) => col.title.toLowerCase() === 'done');
    return doneCol?.cardIds.includes(c.id);
  }).length;
  const pendingTasks = totalTasks - doneTasks;
  const activeAgents = agents.filter((a) => a.active).length;

  const greeting = onboarding.name || 'there';

  // Count wikilinks for graph preview
  const linkCount = notes.reduce((acc, note) => {
    const matches = note.content.match(/\[\[([^\]]+)\]\]/g);
    return acc + (matches ? matches.length : 0);
  }, 0);

  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-5 py-6 sm:py-8 space-y-4 sm:space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {greeting}, <span className="text-muted-foreground font-normal">{onboarding.workspaceName}</span>
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
          {notes.length} notes · {totalTasks} tasks · All systems local
        </p>
      </div>

      {/* Knowledge Graph — TOP, large preview */}
      <div
        className="relative rounded-2xl border bg-card p-4 ghost-card cursor-pointer overflow-hidden"
        onClick={() => setView('graph')}
      >
        <div className="flex items-center gap-2 mb-3">
          <GitFork className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Knowledge Graph</p>
          <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground aether-transition">
            Explore →
          </span>
        </div>
        <div className="flex h-44 sm:h-56 items-center justify-center rounded-xl bg-muted/30 border border-border/50">
          <div className="text-center">
            <GitFork className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              {notes.length <= 1 ? 'Create notes with [[wikilinks]] to build your graph' : `${notes.length} nodes · ${linkCount} edges`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row — 5 columns */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        <div className="rounded-2xl border bg-card p-2.5 text-center ghost-card">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-base font-bold text-foreground">{notes.length}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Notes</p>
        </div>
        <div className="rounded-2xl border bg-card p-2.5 text-center ghost-card">
          <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-base font-bold text-foreground">{totalTasks}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Tasks</p>
        </div>
        <div className="rounded-2xl border bg-card p-2.5 text-center ghost-card">
          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-base font-bold text-foreground">{activeAgents}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Agents</p>
        </div>
        <div className="rounded-2xl border bg-card p-2.5 text-center ghost-card">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-base font-bold text-foreground">{skills.length}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Skills</p>
        </div>
        <div className="rounded-2xl border bg-card p-2.5 text-center ghost-card">
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-base font-bold text-foreground">{roles.length}</p>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Roles</p>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="rounded-2xl border bg-card p-4 ghost-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Today's Tasks</p>
            <p className="text-2xl font-bold text-foreground mt-1">{pendingTasks}</p>
            <p className="text-[10px] text-muted-foreground">pending</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{doneTasks}/{totalTasks}</p>
            <p className="text-[10px] text-muted-foreground">completed</p>
          </div>
        </div>
      </div>

      {/* Recent — max 3 items */}
      <div>
        <div className="flex gap-4 mb-3">
          <button
            onClick={() => setTab('notes')}
            className={`text-xs font-medium pb-1 border-b-2 aether-transition ${
              tab === 'notes' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
            }`}
          >
            Recent Notes
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={`text-xs font-medium pb-1 border-b-2 aether-transition ${
              tab === 'tasks' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
            }`}
          >
            Recent Tasks
          </button>
        </div>

        {tab === 'notes' ? (
          <div className="space-y-1">
            {recentNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No notes yet</p>
            ) : (
              recentNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => { setActiveNote(note.id); setView('notebook'); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 aether-transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{note.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                    {format(new Date(note.modified), 'MMM d')}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {recentCards.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No tasks yet</p>
            ) : (
              recentCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => { setActiveBoard(card.boardId); setView('kanban'); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 aether-transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{card.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                    {format(new Date(card.created), 'MMM d')}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
