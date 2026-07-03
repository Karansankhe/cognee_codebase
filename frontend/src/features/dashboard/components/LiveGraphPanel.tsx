import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { RotateCcw } from "lucide-react";

type NodeKind =
  | "Symptom"
  | "Trigger"
  | "Medication"
  | "TreatmentOutcome"
  | "LifestyleFactor"
  | "Entity";

interface GraphNode {
  id: string;
  label: NodeKind | string;
  name?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const KIND_COLORS: Record<NodeKind, string> = {
  Symptom: "#f26b3a",
  Trigger: "#a855f7",
  Medication: "#35c77c",
  TreatmentOutcome: "#2d9bf0",
  LifestyleFactor: "#e8b51b",
  Entity: "#64748b",
};

const KIND_LABELS: NodeKind[] = [
  "Symptom",
  "Trigger",
  "Medication",
  "TreatmentOutcome",
  "LifestyleFactor",
];

const DEFAULT_GRAPH: GraphData = {
  nodes: [
    { id: "headache", name: "Headache", label: "Symptom" },
    { id: "stress", name: "Stress", label: "Symptom" },
    { id: "pre_exam", name: "Pre-exam stress", label: "Trigger" },
    { id: "bright", name: "Bright screen", label: "Trigger" },
    { id: "skipped", name: "Skipped meal", label: "Trigger" },
    { id: "low_hyd", name: "Low hydration", label: "Trigger" },
    { id: "poor_sleep", name: "Poor sleep", label: "Trigger" },
    { id: "sumatriptan", name: "Sumatriptan", label: "Medication" },
    { id: "ibuprofen", name: "Ibuprofen", label: "Medication" },
    { id: "full", name: "Full relief", label: "TreatmentOutcome" },
    { id: "partial", name: "Partial relief", label: "TreatmentOutcome" },
    { id: "none", name: "No relief", label: "TreatmentOutcome" },
    { id: "hrv", name: "HRV", label: "LifestyleFactor" },
    { id: "sleep_dur", name: "Sleep duration", label: "LifestyleFactor" },
    { id: "screen", name: "Screen time", label: "LifestyleFactor" },
    { id: "water", name: "Water intake", label: "LifestyleFactor" },
    { id: "stress_score", name: "Stress score", label: "LifestyleFactor" },
  ],
  links: [
    { source: "pre_exam", target: "stress", type: "precedes" },
    { source: "stress", target: "headache", type: "supports" },
    { source: "bright", target: "headache", type: "triggers" },
    { source: "skipped", target: "headache", type: "triggers" },
    { source: "low_hyd", target: "headache", type: "triggers" },
    { source: "poor_sleep", target: "headache", type: "triggers" },
    { source: "headache", target: "sumatriptan", type: "treated_by" },
    { source: "headache", target: "ibuprofen", type: "treated_by" },
    { source: "sumatriptan", target: "full", type: "outcome" },
    { source: "sumatriptan", target: "partial", type: "outcome" },
    { source: "ibuprofen", target: "partial", type: "outcome" },
    { source: "ibuprofen", target: "none", type: "outcome" },
    { source: "hrv", target: "stress", type: "correlates" },
    { source: "stress_score", target: "stress", type: "correlates" },
    { source: "sleep_dur", target: "poor_sleep", type: "explains" },
    { source: "screen", target: "bright", type: "explains" },
    { source: "water", target: "low_hyd", type: "explains" },
    { source: "sleep_dur", target: "hrv", type: "affects" },
    { source: "screen", target: "poor_sleep", type: "affects" },
    { source: "skipped", target: "stress", type: "correlates" },
    { source: "pre_exam", target: "poor_sleep", type: "correlates" },
  ],
};

function normalizeKind(label: string | undefined): NodeKind {
  if (!label) return "Entity";
  if (label in KIND_COLORS) return label as NodeKind;
  const compact = label.toLowerCase().replace(/[^a-z]/g, "");
  if (compact.includes("symptom")) return "Symptom";
  if (compact.includes("trigger")) return "Trigger";
  if (compact.includes("medication") || compact.includes("treatment")) return "Medication";
  if (compact.includes("outcome") || compact.includes("relief")) return "TreatmentOutcome";
  if (compact.includes("lifestyle") || compact.includes("factor")) return "LifestyleFactor";
  return "Entity";
}

function nodeName(node: GraphNode) {
  return node.name || node.id;
}

function nodeColor(node: GraphNode) {
  return KIND_COLORS[normalizeKind(String(node.label))];
}

function endpointId(value: string | GraphNode) {
  return typeof value === "string" ? value : value.id;
}

function connectionCount(nodeId: string, links: GraphLink[]) {
  return links.filter(
    (link) => endpointId(link.source) === nodeId || endpointId(link.target) === nodeId,
  ).length;
}

function initialPositionForNode(
  node: GraphNode,
  index: number,
  kindIndex: number,
  kindTotal: number,
  width: number,
  height: number,
) {
  const kind = normalizeKind(String(node.label));
  const centers: Record<NodeKind, { x: number; y: number }> = {
    Symptom: { x: width * 0.46, y: height * 0.5 },
    Trigger: { x: width * 0.28, y: height * 0.55 },
    Medication: { x: width * 0.64, y: height * 0.42 },
    TreatmentOutcome: { x: width * 0.74, y: height * 0.58 },
    LifestyleFactor: { x: width * 0.42, y: height * 0.72 },
    Entity: { x: width * 0.5, y: height * 0.34 },
  };
  const center = centers[kind];
  const angle = (Math.PI * 2 * kindIndex) / Math.max(1, kindTotal);
  const ring = 36 + (index % 4) * 16;

  return {
    x: center.x + Math.cos(angle) * ring,
    y: center.y + Math.sin(angle) * ring,
  };
}

export function LiveGraphPanel() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(75);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 720, height: 430 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/graph");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: GraphData = await response.json();
      setGraphData(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load graph");
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  const displayData = useMemo(() => {
    const sourceData = graphData.nodes.length > 0 ? graphData : DEFAULT_GRAPH;
    const kindTotals = new Map<NodeKind, number>();
    sourceData.nodes.forEach((node) => {
      const kind = normalizeKind(String(node.label));
      kindTotals.set(kind, (kindTotals.get(kind) ?? 0) + 1);
    });

    const kindSeen = new Map<NodeKind, number>();
    const nodes = sourceData.nodes.map((node, index) => {
      const kind = normalizeKind(String(node.label));
      const kindIndex = kindSeen.get(kind) ?? 0;
      kindSeen.set(kind, kindIndex + 1);
      const seeded = initialPositionForNode(
        node,
        index,
        kindIndex,
        kindTotals.get(kind) ?? 1,
        dimensions.width,
        dimensions.height,
      );

      return {
        ...node,
        x: node.x ?? seeded.x,
        y: node.y ?? seeded.y,
      };
    });

    return { nodes, links: sourceData.links.map((link) => ({ ...link })) };
  }, [dimensions.height, dimensions.width, graphData]);

  const nodeDegrees = useMemo(() => {
    const counts = new Map<string, number>();
    displayData.links.forEach((link) => {
      const source = endpointId(link.source);
      const target = endpointId(link.target);
      counts.set(source, (counts.get(source) ?? 0) + 1);
      counts.set(target, (counts.get(target) ?? 0) + 1);
    });
    return counts;
  }, [displayData.links]);

  const highlightedNodeIds = useMemo(() => {
    const activeId = hoveredNodeId ?? selectedNode?.id;
    const highlighted = new Set<string>();
    if (!activeId) return highlighted;

    highlighted.add(activeId);
    displayData.links.forEach((link) => {
      const source = endpointId(link.source);
      const target = endpointId(link.target);
      if (source === activeId) highlighted.add(target);
      if (target === activeId) highlighted.add(source);
    });

    return highlighted;
  }, [displayData.links, hoveredNodeId, selectedNode]);

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x == null || node.y == null) return;

      const degree = nodeDegrees.get(node.id) ?? 1;
      const radius = 5 + Math.min(5, Math.sqrt(degree) * 1.7);
      const scaledRadius = Math.max(4.5, radius / Math.sqrt(globalScale));
      const color = nodeColor(node);
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isHighlighted = highlightedNodeIds.has(node.id);
      const hasActiveFocus = highlightedNodeIds.size > 0;
      const shouldShowLabel =
        isSelected ||
        isHovered ||
        isHighlighted ||
        degree >= 2 ||
        globalScale >= 0.68;
      const labelOpacity = hasActiveFocus && !isHighlighted ? 0.28 : degree <= 1 ? 0.62 : 0.82;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, scaledRadius + 8, 0, 2 * Math.PI);
      ctx.fillStyle = `${color}22`;
      ctx.fill();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, scaledRadius + 14, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}2f`;
        ctx.fill();
      }

      ctx.shadowBlur = 14;
      ctx.shadowColor = `${color}aa`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, scaledRadius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(node.x, node.y, scaledRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (shouldShowLabel) {
        const label = nodeName(node);
        const fontSize = Math.max(6.5, 8 / globalScale);
        ctx.font = `${isSelected || isHovered ? 700 : 600} ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.lineWidth = Math.max(2, 2.6 / globalScale);
        ctx.strokeStyle = `rgba(250,250,246,${hasActiveFocus && !isHighlighted ? 0.58 : 0.9})`;
        ctx.strokeText(label, node.x + scaledRadius + 6, node.y + 1);
        ctx.fillStyle = isSelected || isHovered
          ? "#0f172a"
          : `rgba(15,23,42,${labelOpacity})`;
        ctx.fillText(label, node.x + scaledRadius + 6, node.y + 1);
      }
      ctx.restore();
    },
    [highlightedNodeIds, hoveredNodeId, nodeDegrees, selectedNode],
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || displayData.nodes.length === 0) return;

    const nodeCount = displayData.nodes.length;
    graph.d3Force?.("charge")?.strength?.(nodeCount > 30 ? -980 : -720);
    graph.d3Force?.("link")?.distance?.(nodeCount > 30 ? 155 : 132);
    graph.d3Force?.("link")?.strength?.(0.46);
    graph.d3Force?.("center")?.strength?.(0.04);
    graph.d3ReheatSimulation?.();

    const timeout = window.setTimeout(() => {
      graph.zoomToFit?.(900, 78);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [displayData]);

  const resetGraph = () => {
    graphRef.current?.zoomToFit?.(650, 68);
    setSelectedNode(null);
    setZoomPercent(75);
  };

  const isFallback = !loading && graphData.nodes.length === 0;

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dedbd2] bg-[#fbfaf6] shadow-[0_22px_70px_rgba(34,32,26,0.08)]">
      <header className="flex items-start justify-between gap-4 border-b border-[#e4e0d6] bg-[#fffdfa] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-slate-500">
            Live Neo4j graph
          </p>
          <h2 className="mt-1 font-serif text-3xl font-normal leading-none text-slate-950">
            Knowledge Graph
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#d8d2c3] bg-[#eee9dc] px-3 py-1 text-[11px] font-medium text-slate-800 shadow-sm">
            {displayData.nodes.length} nodes / {displayData.links.length} edges
          </span>
          <button
            aria-label="Reset graph view"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d8d2c3] bg-white text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-950 hover:shadow-sm"
            onClick={resetGraph}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 border-b border-[#e4e0d6] bg-[#fffdfa] px-5 py-3 sm:grid-cols-3 xl:grid-cols-5">
        {KIND_LABELS.map((kind) => (
          <button
            className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[#e4e0d6]/70 bg-white/70 px-3 py-1.5 text-left text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-[#d8d2c3] hover:bg-white hover:text-slate-950"
            key={kind}
            onClick={() => {
              const firstNode = displayData.nodes.find(
                (node) => normalizeKind(String(node.label)) === kind,
              );
              setSelectedNode(firstNode ?? null);
            }}
            type="button"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.9)]"
              style={{ backgroundColor: KIND_COLORS[kind] }}
            />
            <span className="truncate">{kind}</span>
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative h-[430px] overflow-hidden bg-[#f5fbef] bg-[linear-gradient(rgba(226,232,218,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,218,0.55)_1px,transparent_1px),radial-gradient(circle_at_50%_10%,rgba(238,249,221,0.98),rgba(247,251,241,0.9)_46%,rgba(250,250,246,0.86))] bg-[length:32px_32px,32px_32px,100%_100%]"
      >
        {loading ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#fbfaf6]/70 backdrop-blur-sm">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d8d2c3] border-t-slate-950" />
          </div>
        ) : null}

        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={displayData}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          nodeCanvasObject={drawNode as any}
          nodeCanvasObjectMode={() => "replace"}
          linkColor={(link: any) => {
            const activeId = hoveredNodeId ?? selectedNode?.id;
            if (!activeId) return "rgba(84,98,76,0.28)";
            const source = endpointId(link.source);
            const target = endpointId(link.target);
            return source === activeId || target === activeId
              ? "rgba(62,75,55,0.55)"
              : "rgba(84,98,76,0.08)";
          }}
          linkCurvature={0.23}
          linkWidth={(link: any) => {
            const activeId = hoveredNodeId ?? selectedNode?.id;
            if (!activeId) return 1;
            const source = endpointId(link.source);
            const target = endpointId(link.target);
            return source === activeId || target === activeId ? 1.6 : 0.8;
          }}
          linkLabel={(link: any) => link.type ?? "relationship"}
          backgroundColor="rgba(0,0,0,0)"
          nodeVal={(node: any) => Math.max(6, (nodeDegrees.get(node.id) ?? 1) * 2.5)}
          d3AlphaDecay={0.018}
          d3VelocityDecay={0.18}
          cooldownTicks={260}
          enableNodeDrag
          onNodeClick={(node: any) =>
            setSelectedNode((current) =>
              current?.id === node.id ? null : (node as GraphNode),
            )
          }
          onNodeHover={(node: any) => setHoveredNodeId(node?.id ?? null)}
          onBackgroundClick={() => setSelectedNode(null)}
          onZoom={(transform: { k: number }) => setZoomPercent(Math.round(transform.k * 100))}
        />

        {selectedNode ? (
          <div className="absolute bottom-4 right-4 z-10 w-56 rounded-[18px] border border-[#dedbd2] bg-white/92 p-4 text-slate-950 shadow-[0_18px_55px_rgba(34,32,26,0.16)] backdrop-blur">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: nodeColor(selectedNode) }}
              />
              {normalizeKind(String(selectedNode.label))}
            </div>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {nodeName(selectedNode)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {connectionCount(selectedNode.id, displayData.links)} connections
            </p>
            <button
              className="mt-3 rounded-full border border-[#dedbd2] px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f6f2e9] hover:text-slate-950"
              onClick={() => setSelectedNode(null)}
              type="button"
            >
              Close
            </button>
          </div>
        ) : null}

        {isFallback ? (
          <div className="absolute left-4 top-4 z-10 rounded-full border border-[#dedbd2] bg-white/88 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
            {error ? "Showing reference graph until Cognee responds" : "Reference graph preview"}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white/86 px-3 py-2 font-mono text-[11px] text-slate-500 shadow-sm backdrop-blur">
          <span>Drag nodes to explore</span>
          <span>-</span>
          <span>Scroll to zoom in/out</span>
          <span>-</span>
          <span>Click to inspect</span>
          <span className="ml-2 rounded-full border border-[#dedbd2] bg-white px-2 py-0.5 text-slate-700">
            {zoomPercent}%
          </span>
        </div>
      </div>
    </section>
  );
}
