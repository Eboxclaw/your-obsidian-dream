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

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  linkCount: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export function GraphView() {
  const { notes, setActiveNote, setView } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const dragRef = useRef<{ node: GraphNode; offsetX: number; offsetY: number } | null>(null);

  // Build graph data
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const graphLinks: GraphLink[] = [];

    notes.forEach((note) => {
      nodeMap.set(note.id, {
        id: note.id,
        title: note.title,
        linkCount: 0,
      });
    });

    notes.forEach((note) => {
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        const targetTitle = match[1];
        const targetNote = notes.find(
          (n) => n.title.toLowerCase() === targetTitle.toLowerCase()
        );
        if (targetNote && targetNote.id !== note.id) {
          graphLinks.push({ source: note.id, target: targetNote.id });
          const srcNode = nodeMap.get(note.id);
          const tgtNode = nodeMap.get(targetNote.id);
          if (srcNode) srcNode.linkCount++;
          if (tgtNode) tgtNode.linkCount++;
        }
      }
    });

    return { nodes: Array.from(nodeMap.values()), links: graphLinks };
  }, [notes]);

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

    return () => {
      sim.stop();
    };
  }, [nodes, links, dimensions]);

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

    // Draw links
    ctx.strokeStyle = 'hsl(240, 5%, 20%)';
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

      // Glow for hovered
      if (isHovered) {
        ctx.shadowColor = 'hsl(210, 100%, 50%)';
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered
        ? 'hsl(210, 100%, 60%)'
        : node.linkCount > 0
        ? 'hsl(210, 100%, 50%)'
        : 'hsl(240, 5%, 35%)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      if (isHovered || transform.k > 0.8) {
        ctx.fillStyle = isHovered ? 'hsl(240, 5%, 95%)' : 'hsl(240, 5%, 55%)';
        ctx.font = `${isHovered ? '11' : '9'}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + radius + 12);
      }
    });

    ctx.restore();
  }, [dimensions, transform, hoveredNode]);

  // Redraw on transform/hover change
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse interactions
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
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
      }
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
        setActiveNote(node.id);
        setView('notebook');
      }
    },
    [getNodeAt, setActiveNote, setView]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
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
    },
    []
  );

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Graph View
        </h1>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {nodes.length} nodes · {links.length} edges
        </span>
      </div>
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height - 44 }}
          className="block"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
        />
        {hoveredNode && (
          <div className="pointer-events-none absolute left-4 bottom-4 rounded-md border bg-popover px-3 py-2">
            <p className="text-xs font-medium text-foreground">{hoveredNode.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {hoveredNode.linkCount} connections · Double-click to open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
