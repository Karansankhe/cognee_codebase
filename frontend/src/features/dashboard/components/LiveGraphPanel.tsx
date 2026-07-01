import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

// ── Label → colour mapping matching the dashboard palette ────────────────────
const LABEL_COLORS: Record<string, string> = {
  Symptom: "#f97316",          // orange
  Trigger: "#a855f7",          // purple
  Medication: "#22c55e",       // green
  TreatmentOutcome: "#3b82f6", // blue
  LifestyleFactor: "#eab308",  // yellow
  Entity: "#64748b",           // slate fallback
};

const getLabelColor = (label: string) =>
  LABEL_COLORS[label] ?? "#94a3b8";

interface GraphNode {
  id: string;
  label: string;
  name: string;
  // injected by force-graph at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-pulse-surface text-2xl">
        🕸️
      </div>
      <p className="text-sm font-semibold text-pulse-ink">No graph data yet</p>
      <p className="max-w-[200px] text-xs leading-5 text-pulse-muted">
        Upload a PDF to build your knowledge graph. Nodes will appear here instantly.
      </p>
    </div>
  );
}

export function LiveGraphPanel() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 340 });

  // Observe container size for a responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/graph");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GraphData = await res.json();
      setGraphData(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  const drawNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = Math.max(6, 9 / Math.sqrt(globalScale));
    const color = getLabelColor(node.label);

    // Glow ring for selected node
    if (selectedNode?.id === node.id) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = color + "33";
      ctx.fill();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // White inner dot
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    // Label (only when zoomed in enough)
    if (globalScale >= 0.7) {
      const label = node.name?.length > 18 ? node.name.slice(0, 16) + "…" : (node.name ?? node.id);
      const fontSize = Math.max(8, 11 / globalScale);
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Text background pill
      const tw = ctx.measureText(label).width;
      const pad = 3;
      const pillX = node.x! - tw / 2 - pad;
      const pillY = node.y! + r + 2;
      const pillW = tw + pad * 2;
      const pillH = fontSize + 4;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fill();

      ctx.fillStyle = "#111111";
      ctx.fillText(label, node.x!, pillY + 2);
    }
  }, [selectedNode]);

  return (
    <div className="rounded-[20px] border border-pulse-line bg-white/60 shadow-pulse backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pulse-line px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pulse-muted">
            Live Neo4j Graph
          </p>
          <p className="text-sm font-bold text-pulse-ink">Knowledge Graph</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && (
            <span className="rounded-full bg-pulse-green px-2.5 py-0.5 text-xs font-semibold text-pulse-ink">
              {graphData.nodes.length} nodes · {graphData.links.length} edges
            </span>
          )}
          <button
            onClick={fetchGraph}
            title="Refresh graph"
            className="grid h-7 w-7 place-items-center rounded-full bg-pulse-surface text-pulse-muted transition hover:bg-pulse-line hover:text-pulse-ink"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-pulse-line px-4 py-2">
        {Object.entries(LABEL_COLORS).slice(0, 5).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-pulse-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="relative" style={{ height: 340 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pulse-line border-t-pulse-ink" />
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-red-500">⚠ {error}</p>
          </div>
        )}

        {!loading && !error && graphData.nodes.length === 0 && <EmptyState />}

        {!loading && !error && graphData.nodes.length > 0 && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeId="id"
            linkSource="source"
            linkTarget="target"
            // Rendering
            nodeCanvasObject={drawNode as any}
            nodeCanvasObjectMode={() => "replace"}
            linkColor={() => "rgba(17,17,17,0.18)"}
            linkWidth={1.5}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={() => "rgba(17,17,17,0.5)"}
            linkLabel={(link: any) => (link as GraphLink).type}
            // Interaction
            onNodeClick={(node: any) =>
              setSelectedNode(prev => prev?.id === node.id ? null : node as GraphNode)
            }
            onBackgroundClick={() => setSelectedNode(null)}
            // Physics
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={120}
            backgroundColor="transparent"
          />
        )}
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="border-t border-pulse-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: getLabelColor(selectedNode.label) }}
            />
            <p className="text-sm font-semibold text-pulse-ink">{selectedNode.name}</p>
            <span className="ml-auto rounded-full bg-pulse-surface px-2 py-0.5 text-[10px] font-medium text-pulse-muted">
              {selectedNode.label}
            </span>
          </div>
        </div>
      )}

      <p className="px-4 py-2 text-[10px] text-pulse-muted">
        Drag nodes · Scroll to zoom · Click node to inspect
      </p>
    </div>
  );
}
