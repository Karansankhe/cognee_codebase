import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TriggerPattern } from "../types/dashboard.types";

interface InsightCardProps {
  pattern: TriggerPattern;
}

export function InsightCard({ pattern }: InsightCardProps) {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(216,251,100,0.18))]">
      <CardHeader
        title="Current Trigger Pattern"
        eyebrow="Health pattern"
        action={<Badge tone="green">{pattern?.updatedAt || "N/A"}</Badge>}
      />
      <CardBody className="space-y-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-pulse-muted">
              Symptom matched
            </p>
            <h3 className="mt-0.5 text-3xl font-semibold tracking-normal text-pulse-ink">
              {pattern?.symptom || "No pattern"}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(pattern?.triggerCandidates || []).map((trigger) => (
              <Badge key={trigger} tone="blue">
                {trigger}
              </Badge>
            ))}
          </div>
        </div>

        <p className="max-w-4xl text-sm leading-5 text-pulse-muted">
          {pattern.summary}
        </p>

        <div className="rounded-full bg-white/90 px-4 py-2.5 shadow-[0_12px_35px_rgba(216,251,100,0.18)]">
          <p className="line-clamp-1 text-sm leading-6 text-pulse-muted">
            {pattern.treatmentMemory}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
