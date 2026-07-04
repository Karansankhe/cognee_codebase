import { Card, CardBody } from "../../../components/ui/Card";
import type { SystemEvaluation } from "../types/dashboard.types";

interface EvaluationHarnessProps {
  evaluation: SystemEvaluation;
}

export function EvaluationHarness({ evaluation }: EvaluationHarnessProps) {
  const metrics = [
    { label: "Correctly found patterns", value: `${evaluation.truePositiveRate}%` },
    { label: "Incorrect alerts", value: `${evaluation.falsePositiveRate}%` },
    { label: "Useful alerts", value: `${evaluation.precision}%` },
    { label: "Patterns not missed", value: `${evaluation.recall}%` },
  ];

  return (
    <Card className="bg-[linear-gradient(145deg,rgba(17,17,17,0.94),rgba(46,52,38,0.9))] text-white">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <p className="mb-0.5 text-[10px] font-normal uppercase tracking-[0.16em] text-white/55">
            Evaluation harness
          </p>
          <h2 className="text-lg font-normal tracking-normal text-white">
            Detection Accuracy
          </h2>
        </div>
        <div>
          <span className="rounded-full bg-pulse-green px-3 py-1 text-xs font-normal text-pulse-ink">
            System proof
          </span>
        </div>
      </div>
      <CardBody className="space-y-2.5">
        <div>
          <p className="text-2xl font-normal">
            {evaluation.accuracy}% detection accuracy
          </p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Benchmarked against {evaluation.benchmarkSize} labeled synthetic
            patients with known trigger patterns.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[16px] bg-white/10 p-2.5">
              <p className="text-[10px] font-normal uppercase tracking-[0.12em] text-white/60">
                {metric.label}
              </p>
              <p className="mt-0.5 text-base font-normal">{metric.value}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-white/60">
          Last benchmark run: {evaluation.lastRunAt}
        </p>
      </CardBody>
    </Card>
  );
}


