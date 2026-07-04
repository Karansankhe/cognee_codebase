import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TimelineEntry, TimelineEntryType } from "../types/dashboard.types";

interface TimelineFeedProps {
  entries: TimelineEntry[];
}

const entryTone: Record<TimelineEntryType, "green" | "blue" | "amber" | "rose"> =
  {
    symptom: "rose",
    treatment: "green",
    wearable: "blue",
    lab: "amber",
    medication: "green",
  };

export function TimelineFeed({ entries }: TimelineFeedProps) {
  return (
    <Card className="bg-white/60">
      <CardHeader title="Live Timeline" eyebrow="Validated signals" />
      <CardBody>
        <div className="space-y-2">
          {entries.slice(0, 3).map((entry) => (
            <article
              key={entry.id}
              className="rounded-[22px] bg-white/95 px-4 py-2 shadow-[0_10px_24px_rgba(20,20,24,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-normal leading-5">{entry.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-pulse-muted">
                    {entry.description}
                  </p>
                </div>
                <Badge tone={entryTone[entry.type]}>{entry.type}</Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-pulse-muted">
                <span>{entry.occurredAt}</span>
                <span>-</span>
                <span>{entry.source}</span>
                <span className="rounded-full bg-pulse-green px-2 py-0.5 text-pulse-ink">
                  {entry.languageCode}
                </span>
              </div>
            </article>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}


