import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TriggerPattern } from "../types/dashboard.types";

interface TreatmentEffectivenessPanelProps {
  pattern: TriggerPattern;
}

export function TreatmentEffectivenessPanel({
  pattern,
}: TreatmentEffectivenessPanelProps) {
  const { helpedAttempts, score, totalAttempts } = pattern.treatmentEffectiveness;

  return (
    <Card className="bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(210,245,255,0.34))]">
      <CardHeader title="Treatment Effectiveness" eyebrow="Outcome memory" />
      <CardBody className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">
              {score}%
            </p>
            <p className="mt-1 text-sm text-pulse-muted">
              {helpedAttempts}/{totalAttempts} attempts helped
            </p>
          </div>
          <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
            Outcome score
          </div>
        </div>
        <p className="text-xs leading-5 text-pulse-muted">
          Measures how often the remembered treatment was followed by reduced
          symptom severity for this patient.
        </p>
        <div className="rounded-[16px] bg-white p-3">
          <p className="text-xs font-semibold text-pulse-muted">Sample size</p>
          <p className="mt-1 text-sm text-pulse-muted">
            Based on {totalAttempts} treatment attempts.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
