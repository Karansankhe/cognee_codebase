import { useState } from "react";
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
  const [minimumSyncEnabled, setMinimumSyncEnabled] = useState(true);

  return (
    <Card className="bg-white/70">
      <CardHeader title="Data Controls" eyebrow="Privacy and consent" />
      <CardBody>
        <div className="grid gap-3">
          <div className="flex flex-col gap-4 rounded-[20px] border border-white/80 bg-white/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-sm font-normal">
                  Limited health sharing
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-normal uppercase tracking-[0.12em] ${
                    minimumSyncEnabled
                      ? "bg-pulse-mint text-pulse-ink"
                      : "bg-pulse-surface text-pulse-muted"
                  }`}
                >
                  {minimumSyncEnabled ? "On" : "Paused"}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-pulse-muted">
                Pulse only uses heart rate, sleep, activity, and blood oxygen.
              </p>
              <span className="mt-3 inline-flex rounded-full bg-pulse-sky px-4 py-2 text-sm font-normal text-pulse-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                {minimumSyncEnabled
                  ? "Status: Limited sharing active"
                  : "Status: Sharing paused for review"}
              </span>
            </div>

            <button
              aria-label="Toggle limited health sharing"
              aria-pressed={minimumSyncEnabled}
              className={`relative h-10 w-[72px] shrink-0 rounded-full p-1 transition sm:ml-auto ${
                minimumSyncEnabled
                  ? "bg-pulse-green shadow-[0_0_0_6px_rgba(216,251,100,0.22)]"
                  : "bg-pulse-line shadow-[inset_0_1px_3px_rgba(20,20,24,0.08)]"
              }`}
              onClick={() => setMinimumSyncEnabled((enabled) => !enabled)}
              type="button"
            >
              <span
                className={`block h-8 w-8 rounded-full bg-white shadow-[0_4px_14px_rgba(20,20,24,0.14)] transition ${
                  minimumSyncEnabled ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="rounded-[20px] bg-pulse-sky/70 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
              {entries.slice(0, 2).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[16px] border border-pulse-line/70 bg-white/72 p-3 shadow-[0_10px_24px_rgba(20,20,24,0.04),inset_0_1px_0_rgba(255,255,255,0.72)]"
                >
                  <p className="line-clamp-2 min-h-10 text-xs font-normal leading-5">
                    {entry.event}
                  </p>
                  <p className="mt-2 line-clamp-1 text-[10px] font-normal uppercase tracking-[0.12em] text-pulse-muted">
                    {entry.source}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-normal shadow-sm transition hover:bg-pulse-mint"
                      onClick={() => onRedactEntry(entry.id)}
                      type="button"
                    >
                      Redact
                    </button>
                    <button
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-normal text-red-700 shadow-sm transition hover:bg-red-50"
                      onClick={() => onDeleteEntry(entry.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <div className="rounded-[16px] border border-white/70 bg-white/62 p-3">
                <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-pulse-muted">
                  What happens
                </p>
                <p className="mt-2 text-xs leading-5 text-pulse-muted">
                  Redact hides sensitive note text. Delete removes the entry
                  from recall. Health sharing can be turned off at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


