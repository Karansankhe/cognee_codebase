import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TrendSummary } from "../types/dashboard.types";

interface TrendsPanelProps {
  trends: TrendSummary;
}

export function TrendsPanel({ trends }: TrendsPanelProps) {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(216,251,100,0.14))]">
      <CardHeader title="Temporal Trends" eyebrow="Sensor correlation" />
      <CardBody className="space-y-3">
        <p className="text-sm leading-5 text-pulse-muted">{trends.insight}</p>
        <div className="space-y-2">
          {trends.temporalTrends.map((trend) => (
            <div key={trend.id} className="grid grid-cols-[76px_1fr_54px] items-center gap-3">
              <span className="text-xs font-semibold">{trend.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-pulse-green"
                  style={{ width: `${trend.intensity}%` }}
                />
              </div>
              <span className="text-right text-xs text-pulse-muted">{trend.value}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
