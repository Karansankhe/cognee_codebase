import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { EvidenceCitation } from "../types/dashboard.types";
import { Loader2, FileText } from "lucide-react";

interface EvidenceListProps {
  citations: EvidenceCitation[];
  onGenerateSummary: () => void;
  isGeneratingSummary: boolean;
}

const relationshipTone: Record<
  EvidenceCitation["relationship"],
  "green" | "blue" | "rose"
> = {
  supports: "blue",
  improved: "green",
  contradicts: "rose",
};

export function EvidenceList({ citations, onGenerateSummary, isGeneratingSummary }: EvidenceListProps) {
  return (
    <Card className="bg-white/60">
      <CardHeader
        title="Past Entries"
        eyebrow="Audit-ready history"
        action={
          <button
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 rounded-full border border-pulse-line bg-white/80 px-3 py-1.5 text-xs font-normal text-pulse-ink shadow-sm transition-all hover:bg-pulse-green/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGeneratingSummary ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            Doctor Summary
          </button>
        }
      />
      <CardBody>
        <div className="space-y-2">
          {citations.slice(0, 3).map((citation) => (
            <article
              key={citation.id}
              className="rounded-[20px] bg-white/95 px-4 py-2.5 shadow-[0_10px_24px_rgba(20,20,24,0.05)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-normal leading-5">{citation.date}</p>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-pulse-muted">
                    {citation.event}
                  </p>
                </div>
                <Badge tone={relationshipTone[citation.relationship]}>
                  {citation.relationship}
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] font-normal uppercase tracking-[0.12em] text-pulse-muted">
                Source: {citation.source}
              </p>
            </article>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}


