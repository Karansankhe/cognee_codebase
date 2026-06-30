import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { EvidenceCitation } from "../types/dashboard.types";

interface DataControlsPanelProps {
  entries: EvidenceCitation[];
  onDeleteEntry: (id: string) => void;
  onRedactEntry: (id: string) => void;
}

export function DataControlsPanel({
  entries,
  onDeleteEntry,
  onRedactEntry,
}: DataControlsPanelProps) {
  return (
    <Card className="bg-white/70">
      <CardHeader title="Data Controls" eyebrow="Forget settings" />
      <CardBody className="space-y-2.5">
        <div className="rounded-[18px] bg-white/90 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Auto-prune resolved conditions</p>
              <p className="mt-1 text-xs leading-4 text-pulse-muted">
                Resolved conditions are hidden from active recall after review.
              </p>
            </div>
            <button
              className="h-7 w-12 rounded-full bg-pulse-green p-1"
              type="button"
            >
              <span className="ml-auto block h-5 w-5 rounded-full bg-white" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {entries.slice(0, 2).map((entry) => (
            <div key={entry.id} className="rounded-[16px] bg-white/90 p-3">
              <p className="line-clamp-1 text-xs font-semibold">{entry.event}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-pulse-muted">
                {entry.source}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded-full bg-pulse-surface px-3 py-1 text-xs font-medium"
                  onClick={() => onRedactEntry(entry.id)}
                  type="button"
                >
                  Redact
                </button>
                <button
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  onClick={() => onDeleteEntry(entry.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs leading-5 text-pulse-muted">
          Delete removes the entry from recall. Redact keeps the timestamp and
          relationship count but hides sensitive note text.
        </p>
      </CardBody>
    </Card>
  );
}
