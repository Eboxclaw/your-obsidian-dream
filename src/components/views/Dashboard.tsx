import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { FileText, CheckSquare, Bot, GitFork, Sparkles, Shield, ArrowRight } from 'lucide-react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

interface MiniNode extends SimulationNodeDatum {
  id: string;
  title: string;
  linkCount: number;
}

interface MiniLink extends SimulationLinkDatum<MiniNode> {
  source: string | MiniNode;
  target: string | MiniNode;
}

function MiniGraph({ notes }: { notes: { id: string; title: string; content: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 300, height: 180 });
  const nodesRef = useRef<MiniNode[]>([]);
  const linksRef = useRef<MiniLink[]>([]);

  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, MiniNode>();
    const graphLinks: MiniLink[] = [];
    notes.forEach((note) => {
      nodeMap.set(note.id, { id: note.id, title: note.title, linkCount: 0 });
    });
    notes.forEach((note) => {
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        const target = notes.find((n) => n.title.toLowerCase() === match![1].toLowerCase());
        if (target && target.id !== note.id) {
          graphLinks.push({ source: note.id, target: target.id });
          const s = nodeMap.get(note.id);
          const t = nodeMap.get(target.id);
          if (s) s.linkCount++;
          if (t) t.linkCount++;
        }
      }
    });
    return { nodes: Array.from(nodeMap.values()), links: graphLinks };
  }, [notes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dims.width, dims.height);

    const dark = document.documentElement.classList.contains('dark');

    ctx.strokeStyle = dark ? 'hsl(0, 0%, 18%)' : 'hsl(0, 0%, 82%)';
    ctx.lineWidth = 0.5;
    linksRef.current.forEach((link) => {
      const s = link.source as MiniNode;
      const t = link.target as MiniNode;
      if (s.x == null || t.x == null) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y!);
      ctx.lineTo(t.x, t.y!);
      ctx.stroke();
    });

    nodesRef.current.forEach((node) => {
      if (node.x == null || node.y == null) return;
      const r = Math.max(2, Math.min(5, 2 + node.linkCount));
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.linkCount > 0
        ? (dark ? 'hsl(0, 0%, 60%)' : 'hsl(0, 0%, 45%)')
        : (dark ? 'hsl(0, 0%, 30%)' : 'hsl(0, 0%, 70%)');
      ctx.fill();
    });
  }, [dims]);

  useEffect(() => {
    nodesRef.current = nodes.map((n) => ({ ...n }));
    linksRef.current = links.map((l) => ({ ...l }));

    const sim = forceSimulation<MiniNode>(nodesRef.current)
      .force('link', forceLink<MiniNode, MiniLink>(linksRef.current).id((d) => d.id).distance(40).strength(0.5))
      .force('charge', forceManyBody().strength(-60))
      .force('center', forceCenter(dims.width / 2, dims.height / 2))
      .force('collide', forceCollide(8))
      .alphaDecay(0.05);

    sim.on('tick', draw);
    return () => { sim.stop(); };
  }, [nodes, links, dims, draw]);

  if (notes.length <= 1) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <GitFork className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[10px] text-muted-foreground">Create notes to see your graph</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} style={{ width: dims.width, height: dims.height }} className="block" />
    </div>
  );
}

export function Dashboard() {
  const { notes, boards, cards, agents, skills, roles, setActiveNote, setView, setActiveBoard, onboarding, ui } = useStore();
  const [tab, setTab] = useState<'notes' | 'tasks'>('notes');

  const folderNotes = ui.activeFolderId ? notes.filter((n) => n.folderId === ui.activeFolderId) : notes;
  const folderBoards = ui.activeFolderId ? boards.filter((b) => b.folderId === ui.activeFolderId) : boards;
  const folderCards = ui.activeFolderId ? cards.filter((c) => folderBoards.some((b) => b.id === c.boardId)) : cards;

  const recentNotes = [...folderNotes].sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()).slice(0, 3);

  const totalTasks = folderCards.length;
  const doneTasks = folderCards.filter((c) => {
    const board = boards.find((b) => b.id === c.boardId);
    if (!board) return false;
    const doneCol = board.columns.find((col) => col.title.toLowerCase() === 'done');
    return doneCol?.cardIds.includes(c.id);
  }).length;
  const pendingTasks = totalTasks - doneTasks;
  const activeAgents = agents.filter((a) => a.active).length;

  const greeting = onboarding.name || 'there';

  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-5 py-4 sm:py-6 space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {greeting}, <span className="text-muted-foreground font-normal">{onboarding.workspaceName}</span>
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
          {folderNotes.length} notes · {totalTasks} tasks · All systems local
        </p>
      </div>

      {/* Knowledge Graph — TOP, live preview */}
      <div
        className="relative rounded-2xl border bg-card overflow-hidden ghost-card cursor-pointer"
        onClick={() => setView('graph')}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">Knowledge Graph</p>
            <span className="font-mono text-[9px] text-muted-foreground">{notes.length} nodes</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setView('graph'); }}
            className="flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent/80 aether-transition"
          >
            Explore <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="h-44 sm:h-56 px-2 pb-2">
          <div className="h-full rounded-xl bg-muted/30 border border-border/50 overflow-hidden">
            <MiniGraph notes={notes} />
          </div>
        </div>
      </div>

      {/* Stats row — 5 metrics */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { icon: FileText, value: folderNotes.length, label: 'Notes' },
          { icon: CheckSquare, value: totalTasks, label: 'Tasks' },
          { icon: Bot, value: activeAgents, label: 'Agents' },
          { icon: Sparkles, value: skills.length, label: 'Skills' },
          { icon: Shield, value: roles.length, label: 'Roles' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl border bg-card p-2 sm:p-3 text-center ghost-card">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-muted-foreground mb-0.5" />
            <p className="text-base sm:text-lg font-bold text-foreground">{value}</p>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        ))}
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

      {/* Recent tabs — capped at 3 */}
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
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-surface-hover aether-transition"
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
            {folderCards.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No tasks yet</p>
            ) : (
              folderCards.slice(0, 3).map((card) => (
                <button
                  key={card.id}
                  onClick={() => { setActiveBoard(card.boardId); setView('kanban'); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-surface-hover aether-transition"
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
