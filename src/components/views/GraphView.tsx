import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { useStore } from '@/store';
import { Filter, X, Calendar, Tag, Link2, Hash } from 'lucide-react';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  linkCount: number;
  tags: string[];
  created: string;
  type: 'note' | 'task';
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface FilterState {
  open: boolean;
  tags: string[];
  wikilinks: string[];
  dateFrom: string;
  dateTo: string;
  type: 'all' | 'notes' | 'tasks';
}

export function GraphView() {
  const { notes, cards, setActiveNote, setView } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const dragRef = useRef<{ node: GraphNode; offsetX: number; offsetY: number } | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    open: false,
    tags: [],
    wikilinks: [],
    dateFrom: '',
    dateTo: '',
    type: 'all',
  });

  // Collect all tags and wikilink targets for filter options
  const { allTags, allWikilinks } = useMemo(() => {
    const tagSet = new Set<string>();
    const wikiSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((t) => tagSet.add(t));
      const matches = note.content.match(/\[\[([^\]]+)\]\]/g);
      if (matches) matches.forEach((m) => wikiSet.add(m.slice(2, -2)));
    });
    return { allTags: Array.from(tagSet).sort(), allWikilinks: Array.from(wikiSet).sort() };
  }, [notes]);

  // Build graph data with filters
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const graphLinks: GraphLink[] = [];

    // Filter notes
    let filteredNotes = notes;
    if (filters.tags.length > 0) {
      filteredNotes = filteredNotes.filter((n) => filters.tags.some((t) => n.tags.includes(t)));
    }
    if (filters.dateFrom) {
      filteredNotes = filteredNotes.filter((n) => n.created >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filteredNotes = filteredNotes.filter((n) => n.created <= filters.dateTo + 'T23:59:59');
    }
    if (filters.wikilinks.length > 0) {
      filteredNotes = filteredNotes.filter((n) => {
        const matches = n.content.match(/\[\[([^\]]+)\]\]/g);
        if (!matches) return false;
        const targets = matches.map((m) => m.slice(2, -2).toLowerCase());
        return filters.wikilinks.some((w) => targets.includes(w.toLowerCase()));
      });
    }
    if (filters.type === 'tasks') {
      filteredNotes = [];
    }

    if (filters.type !== 'tasks') {
      filteredNotes.forEach((note) => {
        nodeMap.set(note.id, {
          id: note.id,
          title: note.title,
          linkCount: 0,
          tags: note.tags,
          created: note.created,
          type: 'note',
        });
      });
    }

    // Add task nodes if showing all or tasks
    if (filters.type !== 'notes') {
      cards.forEach((card) => {
        nodeMap.set(card.id, {
          id: card.id,
          title: card.title,
          linkCount: 0,
          tags: [],
          created: card.created,
          type: 'task',
        });
        // Link task to its note if exists
        if (card.noteId && nodeMap.has(card.noteId)) {
          graphLinks.push({ source: card.id, target: card.noteId });
          const taskNode = nodeMap.get(card.id);
          const noteNode = nodeMap.get(card.noteId);
          if (taskNode) taskNode.linkCount++;
          if (noteNode) noteNode.linkCount++;
        }
      });
    }

    // Build wikilink edges
    filteredNotes.forEach((note) => {
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        const targetTitle = match[1];
        const targetNote = notes.find((n) => n.title.toLowerCase() === targetTitle.toLowerCase());
        if (targetNote && targetNote.id !== note.id && nodeMap.has(targetNote.id)) {
          graphLinks.push({ source: note.id, target: targetNote.id });
          const srcNode = nodeMap.get(note.id);
          const tgtNode = nodeMap.get(targetNote.id);
          if (srcNode) srcNode.linkCount++;
          if (tgtNode) tgtNode.linkCount++;
        }
      }
    });

    return { nodes: Array.from(nodeMap.values()), links: graphLinks };
  }, [notes, cards, filters]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Initialize simulation
  useEffect(() => {
    nodesRef.current = nodes.map((n) => ({ ...n }));
    linksRef.current = links.map((l) => ({ ...l }));

    const sim = forceSimulation<GraphNode>(nodesRef.current)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(linksRef.current)
          .id((d) => d.id)
          .distance(80)
          .strength(0.4)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide(20))
      .alphaDecay(0.02);

    sim.on('tick', draw);
    simRef.current = sim;

    return () => { sim.stop(); };
  }, [nodes, links, dimensions]);

  const isDark = () => document.documentElement.classList.contains('dark');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const dark = isDark();

    // Draw links
    ctx.strokeStyle = dark ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 80%)';
    ctx.lineWidth = 0.5;
    linksRef.current.forEach((link) => {
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;
      if (source.x == null || target.x == null) return;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y!);
      ctx.lineTo(target.x, target.y!);
      ctx.stroke();
    });

    // Draw nodes
    nodesRef.current.forEach((node) => {
      if (node.x == null || node.y == null) return;
      const radius = Math.max(3, Math.min(8, 3 + node.linkCount * 1.5));
      const isHovered = hoveredNode?.id === node.id;
      const isTask = node.type === 'task';

      if (isHovered) {
        ctx.shadowColor = 'hsl(270, 40%, 65%)';
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      if (isTask) {
        // Square for tasks
        ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
      } else {
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = isHovered
        ? 'hsl(270, 40%, 65%)'
        : isTask
        ? (dark ? 'hsl(0, 0%, 50%)' : 'hsl(0, 0%, 55%)')
        : node.linkCount > 0
        ? (dark ? 'hsl(0, 0%, 70%)' : 'hsl(0, 0%, 40%)')
        : (dark ? 'hsl(0, 0%, 35%)' : 'hsl(0, 0%, 65%)');
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      if (isHovered || transform.k > 0.8) {
        ctx.fillStyle = isHovered
          ? (dark ? 'hsl(0, 0%, 95%)' : 'hsl(0, 0%, 15%)')
          : (dark ? 'hsl(0, 0%, 55%)' : 'hsl(0, 0%, 50%)');
        ctx.font = `${isHovered ? '11' : '9'}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + radius + 12);
      }
    });

    ctx.restore();
  }, [dimensions, transform, hoveredNode]);

  useEffect(() => { draw(); }, [draw]);

  const getNodeAt = useCallback(
    (cx: number, cy: number): GraphNode | null => {
      const x = (cx - transform.x) / transform.k;
      const y = (cy - transform.y) / transform.k;
      for (const node of nodesRef.current) {
        if (node.x == null || node.y == null) continue;
        const r = Math.max(3, Math.min(8, 3 + node.linkCount * 1.5)) + 4;
        if ((node.x - x) ** 2 + (node.y - y) ** 2 < r * r) return node;
      }
      return null;
    },
    [transform]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (dragRef.current) {
        const node = dragRef.current.node;
        node.fx = (cx - transform.x) / transform.k;
        node.fy = (cy - transform.y) / transform.k;
        simRef.current?.alpha(0.3).restart();
        return;
      }
      const node = getNodeAt(cx, cy);
      setHoveredNode(node);
      if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
    },
    [getNodeAt, transform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const node = getNodeAt(cx, cy);
      if (node) {
        dragRef.current = { node, offsetX: cx, offsetY: cy };
        node.fx = node.x;
        node.fy = node.y;
      }
    },
    [getNodeAt]
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
      dragRef.current = null;
    }
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node) {
        if (node.type === 'note') {
          setActiveNote(node.id);
          setView('notebook');
        }
      }
    },
    [getNodeAt, setActiveNote, setView]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => ({
      k: Math.max(0.2, Math.min(3, t.k * scaleFactor)),
      x: mx - (mx - t.x) * scaleFactor,
      y: my - (my - t.y) * scaleFactor,
    }));
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragRef.current || !e.touches[0]) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.touches[0].clientX - rect.left;
      const cy = e.touches[0].clientY - rect.top;
      const node = dragRef.current.node;
      node.fx = (cx - transform.x) / transform.k;
      node.fy = (cy - transform.y) / transform.k;
      simRef.current?.alpha(0.3).restart();
    },
    [transform]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.touches[0].clientX - rect.left;
      const cy = e.touches[0].clientY - rect.top;
      const node = getNodeAt(cx, cy);
      if (node) {
        dragRef.current = { node, offsetX: cx, offsetY: cy };
        node.fx = node.x;
        node.fy = node.y;
      }
    },
    [getNodeAt]
  );

  const toggleTag = (tag: string) => {
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const toggleWikilink = (link: string) => {
    setFilters((f) => ({
      ...f,
      wikilinks: f.wikilinks.includes(link)
        ? f.wikilinks.filter((l) => l !== link)
        : [...f.wikilinks, link],
    }));
  };

  const clearFilters = () => {
    setFilters((f) => ({ ...f, tags: [], wikilinks: [], dateFrom: '', dateTo: '', type: 'all' }));
  };

  const activeFilterCount =
    filters.tags.length + filters.wikilinks.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + (filters.type !== 'all' ? 1 : 0);

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Knowledge Graph
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {nodes.length} nodes · {links.length} edges
          </span>
          <button
            onClick={() => setFilters((f) => ({ ...f, open: !f.open }))}
            className={`relative flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs aether-transition ${
              filters.open || activeFilterCount > 0
                ? 'border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filters.open && (
        <div className="border-b bg-card px-4 sm:px-6 py-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Filter Graph</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-muted-foreground hover:text-foreground aether-transition"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setFilters((f) => ({ ...f, open: false }))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Type filter */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <Hash className="h-3 w-3" /> Type
            </p>
            <div className="flex gap-1.5">
              {(['all', 'notes', 'tasks'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((f) => ({ ...f, type: t }))}
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] aether-transition ${
                    filters.type === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] aether-transition ${
                      filters.tags.includes(tag)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wikilinks */}
          {allWikilinks.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> Wikilinks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allWikilinks.map((link) => (
                  <button
                    key={link}
                    onClick={() => toggleWikilink(link)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] aether-transition ${
                      filters.wikilinks.includes(link)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    [[{link}]]
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date range */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date Range
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="rounded-lg border bg-background px-2 py-1 text-[10px] text-foreground outline-none"
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="rounded-lg border bg-background px-2 py-1 text-[10px] text-foreground outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height - 44 }}
          className="block touch-none"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        />
        {hoveredNode && (
          <div className="pointer-events-none absolute left-4 bottom-4 rounded-md border bg-popover px-3 py-2">
            <p className="text-xs font-medium text-foreground">{hoveredNode.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {hoveredNode.type === 'task' ? 'Task' : 'Note'} · {hoveredNode.linkCount} connections · Double-click to open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
