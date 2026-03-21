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
import { useStore } from '@/lib/store';
import { ZoomIn, ZoomOut, Filter, X } from 'lucide-react';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  linkCount: number;
  type: 'note' | 'task';
  tags: string[];
  created: string;
  folderId: string | null;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

type FilterType = 'all' | 'notes' | 'tasks';

export function GraphView() {
  const { notes, cards, boards, folders, setActiveNote, setView, ui } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const dragRef = useRef<{ node: GraphNode; offsetX: number; offsetY: number } | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterWikilinksOnly, setFilterWikilinksOnly] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  // Build graph data with filters
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const graphLinks: GraphLink[] = [];

    // Filter notes by active folder
    const filteredNotes = ui.activeFolderId
      ? notes.filter((n) => n.folderId === ui.activeFolderId)
      : notes;

    if (filterType !== 'tasks') {
      filteredNotes.forEach((note) => {
        if (filterTags.length > 0 && !note.tags.some((t) => filterTags.includes(t))) return;
        nodeMap.set(note.id, {
          id: note.id,
          title: note.title,
          linkCount: 0,
          type: 'note',
          tags: note.tags,
          created: note.created,
          folderId: note.folderId,
        });
      });
    }

    if (filterType !== 'notes') {
      const filteredBoards = ui.activeFolderId
        ? boards.filter((b) => b.folderId === ui.activeFolderId)
        : boards;
      const boardIds = new Set(filteredBoards.map((b) => b.id));
      cards.filter((c) => boardIds.has(c.boardId)).forEach((card) => {
        nodeMap.set(card.id, {
          id: card.id,
          title: card.title,
          linkCount: 0,
          type: 'task',
          tags: [],
          created: card.created,
          folderId: null,
        });
      });
    }

    // Wikilinks
    filteredNotes.forEach((note) => {
      if (!nodeMap.has(note.id)) return;
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

    // Task-note links
    cards.forEach((card) => {
      if (card.noteId && nodeMap.has(card.id) && nodeMap.has(card.noteId)) {
        graphLinks.push({ source: card.id, target: card.noteId });
        const srcNode = nodeMap.get(card.id);
        const tgtNode = nodeMap.get(card.noteId);
        if (srcNode) srcNode.linkCount++;
        if (tgtNode) tgtNode.linkCount++;
      }
    });

    let finalNodes = Array.from(nodeMap.values());
    if (filterWikilinksOnly) {
      const linked = new Set<string>();
      graphLinks.forEach((l) => {
        linked.add(typeof l.source === 'string' ? l.source : l.source.id);
        linked.add(typeof l.target === 'string' ? l.target : l.target.id);
      });
      finalNodes = finalNodes.filter((n) => linked.has(n.id));
    }

    return { nodes: finalNodes, links: graphLinks };
  }, [notes, cards, boards, ui.activeFolderId, filterType, filterTags, filterWikilinksOnly]);

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

    // Draw nodes with folder magnet labels
    const folderGroups = new Map<string, { x: number; y: number; count: number }>();

    nodesRef.current.forEach((node) => {
      if (node.x == null || node.y == null) return;
      const radius = Math.max(3, Math.min(8, 3 + node.linkCount * 1.5));
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isTask = node.type === 'task';

      // Track folder positions for magnet labels
      if (node.folderId) {
        const group = folderGroups.get(node.folderId) || { x: 0, y: 0, count: 0 };
        group.x += node.x;
        group.y += node.y;
        group.count++;
        folderGroups.set(node.folderId, group);
      }

      if (isHovered) {
        ctx.shadowColor = 'hsl(270, 50%, 65%)';
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
        ? 'hsl(270, 50%, 65%)'
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

    // Draw folder magnet points
    folderGroups.forEach((group, folderId) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder || group.count === 0) return;
      const cx = group.x / group.count;
      const cy = group.y / group.count;

      // Magnet point
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 4, 0, Math.PI * 2);
      ctx.fillStyle = dark ? 'hsl(270, 40%, 55%)' : 'hsl(270, 40%, 60%)';
      ctx.fill();

      // Folder label
      ctx.fillStyle = dark ? 'hsl(270, 30%, 70%)' : 'hsl(270, 30%, 50%)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(folder.name, cx, cy - 28);
    });

    ctx.restore();
  }, [dimensions, transform, hoveredNode, folders]);

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
      const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (dragRef.current) {
        const node = dragRef.current.node;
        node.fx = (cx - transform.x) / transform.k;
        node.fy = (cy - transform.y) / transform.k;
        if (simRef.current) {
          simRef.current.alpha(0.3).restart();
        }
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
      const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
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
      const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
      if (!rect) return;
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node) { setActiveNote(node.id); setView('notebook'); }
    },
    [getNodeAt, setActiveNote, setView]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => ({
      k: Math.max(0.2, Math.min(3, t.k * scaleFactor)),
      x: mx - (mx - t.x) * scaleFactor,
      y: my - (my - t.y) * scaleFactor,
    }));
  }, []);

  const handleZoomIn = () => {
    setTransform((t) => ({ ...t, k: Math.min(3, t.k * 1.2) }));
  };

  const handleZoomOut = () => {
    setTransform((t) => ({ ...t, k: Math.max(0.2, t.k / 1.2) }));
  };

  const toggleTag = (tag: string) => {
    setFilterTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  // Touch support
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragRef.current || !e.touches[0]) return;
      const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
      if (!rect) return;
      const cx = e.touches[0].clientX - rect.left;
      const cy = e.touches[0].clientY - rect.top;
      const node = dragRef.current.node;
      node.fx = (cx - transform.x) / transform.k;
      node.fy = (cy - transform.y) / transform.k;
      if (simRef.current) {
        simRef.current.alpha(0.3).restart();
      }
    },
    [transform]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
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

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Knowledge Graph
        </h1>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {nodes.length} nodes · {links.length} edges
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg aether-transition ${
              showFilters ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Obsidian-style filter panel */}
      {showFilters && (
        <div className="border-b px-4 py-3 space-y-3 bg-card animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Filters</span>
            <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Type filter */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Type</p>
            <div className="flex gap-1.5">
              {(['all', 'notes', 'tasks'] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-medium aether-transition ${
                    filterType === t ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Wikilinks filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterWikilinksOnly}
              onChange={(e) => setFilterWikilinksOnly(e.target.checked)}
              className="rounded border-border accent-accent h-3.5 w-3.5"
            />
            <span className="text-[10px] text-muted-foreground">Only linked nodes</span>
          </label>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium aether-transition ${
                      filterTags.includes(tag) ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height - (showFilters ? 180 : 44) }}
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

        {/* Zoom buttons */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:text-foreground shadow-sm aether-transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:text-foreground shadow-sm aether-transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

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
