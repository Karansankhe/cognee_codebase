import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { EvidenceCitation } from "../types/dashboard.types";

interface EvidenceListProps {
  citations: EvidenceCitation[];
}

const relationshipTone: Record<
  EvidenceCitation["relationship"],
  "green" | "blue" | "rose"
> = {
  supports: "blue",
  improved: "green",
  contradicts: "rose",
};

export function EvidenceList({ citations }: EvidenceListProps) {
  return (
    <Card className="bg-white/60">
      <CardHeader title="Past Entries" eyebrow="Source history" />
      <CardBody className="h-full">
        <div className="space-y-2">
          {citations.slice(0, 3).map((citation) => (
            <article
              key={citation.id}
              className="rounded-[20px] bg-white/95 px-4 py-2.5 shadow-[0_10px_24px_rgba(20,20,24,0.05)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5">{citation.date}</p>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-pulse-muted">
                    {citation.event}
                  </p>
                </div>
                <Badge tone={relationshipTone[citation.relationship]}>
                  {citation.relationship}
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-pulse-muted">
                Source: {citation.source}
              </p>
            </article>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
