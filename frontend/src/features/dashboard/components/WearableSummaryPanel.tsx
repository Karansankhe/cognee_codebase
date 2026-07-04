import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { WearableSummary } from "../types/dashboard.types";

interface WearableSummaryPanelProps {
  summary: WearableSummary;
}

export function WearableSummaryPanel({ summary }: WearableSummaryPanelProps) {
  return (
    <Card className="bg-white/70">
      <CardHeader
        title="Wearable Summary"
        eyebrow="Daily health signals"
        action={<Badge tone="green">{summary.syncCadence}</Badge>}
      />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {summary.metrics.map((metric) => (
            <div className="rounded-[18px] bg-pulse-mint p-3" key={metric.id}>
              <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-pulse-muted">
                {metric.label}
              </p>
              <p className="mt-1 text-xl font-normal">{metric.value}</p>
              <p className="mt-1 text-xs font-normal text-pulse-muted">
                {metric.status}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[18px] bg-white/90 p-3">
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-pulse-muted">
            Shared health data
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.consentScope.map((scope) => (
              <Badge key={scope} tone="neutral">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


