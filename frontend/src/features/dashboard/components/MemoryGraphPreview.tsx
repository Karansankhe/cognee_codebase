import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type {
  GraphInsight,
  GraphNodeType,
  MemoryGraphEdge,
  MemoryGraphNode,
} from "../types/dashboard.types";

interface MemoryGraphPreviewProps {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  insights: GraphInsight[];
}

const nodePositions: Record<string, string> = {
  "poor-sleep": "left-[2.5%] top-[27%]",
  dehydration: "left-[2.5%] bottom-[12%]",
  stress: "left-[27%] top-[6%]",
  headache: "left-[49%] top-[50%] -translate-x-1/2 -translate-y-1/2",
  hydration: "right-[2.5%] top-[22%]",
  improved: "right-[2.5%] bottom-[12%]",
};

function nodeClass(type: GraphNodeType) {
  if (type === "symptom") {
    return "z-20 w-32 border-pulse-green bg-[#f4ffe0] shadow-[0_20px_55px_rgba(216,251,100,0.42)]";
  }

  if (type === "treatment") {
    return "z-10 w-32 border-pulse-green bg-[#f4fff0] shadow-[0_18px_42px_rgba(125,201,86,0.18)]";
  }

  if (type === "outcome") {
    return "z-10 w-32 border-cyan-100 bg-[#eefdfd]";
  }

  if (type === "trigger") {
    return "z-10 w-32 border-orange-100 bg-[#fff7ef]";
  }

  if (type === "lifestyle") {
    return "z-10 w-32 border-indigo-100 bg-[#f4f6ff]";
  }

  return "z-10 w-32 border-white bg-white/95";
}

function nodeAccent(type: GraphNodeType) {
  if (type === "symptom") {
    return "bg-red-400";
  }

  if (type === "treatment") {
    return "bg-green-500";
  }

  if (type === "outcome") {
    return "bg-cyan-500";
  }

  if (type === "trigger") {
    return "bg-orange-400";
  }

  return "bg-indigo-400";
}

function tagClass(type: GraphNodeType) {
  if (type === "symptom") {
    return "bg-red-100 text-red-700";
  }

  if (type === "treatment") {
    return "bg-pulse-mint text-green-800";
  }

  if (type === "outcome") {
    return "bg-cyan-100 text-cyan-800";
  }

  if (type === "trigger") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-indigo-100 text-indigo-700";
}

export function MemoryGraphPreview({
  edges,
  insights,
  nodes,
}: MemoryGraphPreviewProps) {
  const strongestEdge = [...edges].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
  )[0];

  return (
    <Card className="min-h-0 bg-white/95">
      <CardHeader
        action={
          strongestEdge ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-pulse-green px-4 py-1.5 text-sm font-semibold text-pulse-ink">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              {strongestEdge.confidence}% strongest
            </span>
          ) : null
        }
        title="Cognee Memory Graph"
        eyebrow="Personal pattern map"
      />
      <CardBody>
        <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-pulse-line/70 bg-[#fbfcf7]">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(17,17,17,0.055)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(216,251,100,0.24),transparent_34%)]" />

          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d="M20 39 C30 42, 39 46, 45 50"
              fill="none"
              stroke="rgba(72,137,76,0.45)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="1"
            />
            <path
              d="M20 73 C30 67, 39 60, 45 54"
              fill="none"
              stroke="rgba(72,137,76,0.45)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="1"
            />
            <path
              d="M39 28 C43 36, 47 42, 49 47"
              fill="none"
              stroke="rgba(72,137,76,0.36)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="1"
            />
            <path
              d="M58 50 C68 45, 77 38, 84 32"
              fill="none"
              stroke="rgba(94,172,65,0.78)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="1.15"
            />
            <path
              d="M87 40 C87 51, 87 61, 87 70"
              fill="none"
              stroke="rgba(94,172,65,0.78)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="1.15"
            />
          </svg>

          <span className="absolute left-[24%] top-[40%] rounded-full bg-white px-3 py-1 text-xs font-medium text-pulse-muted shadow-sm">
            precedes 92%
          </span>
          <span className="absolute left-[24%] bottom-[35%] rounded-full bg-white px-3 py-1 text-xs font-medium text-pulse-muted shadow-sm">
            triggers 86%
          </span>
          <span className="absolute left-[42%] top-[30%] rounded-full bg-white px-3 py-1 text-xs font-medium text-pulse-muted shadow-sm">
            correlates
          </span>
          <span className="absolute right-[29%] top-[43%] rounded-full bg-white px-3 py-1 text-xs font-medium text-pulse-muted shadow-sm">
            alleviates
          </span>

          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute min-h-[72px] rounded-[20px] border p-3 text-left shadow-[0_14px_28px_rgba(20,20,24,0.07)] ${nodeClass(
                node.type,
              )} ${nodePositions[node.id]}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${nodeAccent(node.type)}`} />
                  <p className="text-xs font-semibold leading-4">{node.label}</p>
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass(
                    node.type,
                  )}`}
                >
                  {node.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-[18px] border border-pulse-line/60 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(20,20,24,0.04)]"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pulse-green" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">
                  {insight.label}
                </p>
              </div>
              <p className="mt-2 text-base font-semibold">{insight.value}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-pulse-muted">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
