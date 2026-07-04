import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TriggerPattern } from "../types/dashboard.types";

interface ConfidencePanelProps {
  pattern: TriggerPattern;
}

export function ConfidencePanel({ pattern }: ConfidencePanelProps) {
  const { score, matchedEpisodes, totalEpisodes } = pattern.consistency;

  return (
    <Card className="bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(216,251,100,0.12))]">
      <CardHeader title="Risk Confidence" eyebrow="Historical match" />
      <CardBody className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#1f8a5f ${score * 3.6}deg, #e8eee9 0deg)`,
            }}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
              <span className="text-lg font-normal">{score}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-normal text-pulse-muted">
              Pattern strength
            </p>
            <p className="mt-0.5 text-xl font-light tracking-normal">
              {score}%
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-pulse-muted">
              Measures how reliably wearable conditions appeared before this
              symptom in this patient's comparable episodes.
            </p>
          </div>
        </div>
        <div className="rounded-[16px] bg-white p-3">
          <p className="text-xs font-normal text-pulse-muted">
            Sample size
          </p>
          <p className="mt-1 text-lg font-light">
            Based on {totalEpisodes} comparable episodes
          </p>
          <p className="mt-1 text-xs text-pulse-muted">
            {matchedEpisodes} showed the same trigger pattern.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}


