import { useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";

interface LogPageProps {
  onNavigate?: (page: string) => void;
}

type LogEntryType = "symptom" | "treatment" | "wearable";

interface LogEntry {
  id: string;
  type: LogEntryType;
  label: string;
  value: string;
  time: string;
  source: string;
}

const initialEntries: LogEntry[] = [
  {
    id: "sleep-1",
    type: "wearable",
    label: "Sleep duration",
    value: "4h 48m",
    time: "Today, 06:10",
    source: "Connected watch",
  },
  {
    id: "hrv-1",
    type: "wearable",
    label: "Recovery score",
    value: "Lower than usual",
    time: "Today, 06:10",
    source: "Connected watch",
  },
  {
    id: "stress-1",
    type: "wearable",
    label: "Stress score",
    value: "72",
    time: "Today, 08:45",
    source: "Connected watch",
  },
  {
    id: "symptom-1",
    type: "symptom",
    label: "Headache",
    value: "Severity 6/10 after poor sleep",
    time: "Today, 10:24",
    source: "Patient log",
  },
  {
    id: "treatment-1",
    type: "treatment",
    label: "Hydration",
    value: "Improved after 90 minutes",
    time: "Today, 12:05",
    source: "Treatment outcome",
  },
];

const wearableMetrics = [
  { label: "Heart rate", value: "81 bpm", detail: "Resting 63, max 145" },
  { label: "Sleep", value: "4.8 h", detail: "Below personal baseline" },
  { label: "Steps", value: "7,420", detail: "Moderate activity" },
  { label: "Blood oxygen", value: "98%", detail: "Normal range" },
];

const dataSources = [
  { label: "Connected watch", status: "Connected", sync: "Live updates" },
  { label: "Phone health app", status: "Ready", sync: "Periodic updates" },
  { label: "Your entries", status: "Connected", sync: "Saved instantly" },
];

const inputClass =
  "w-full rounded-2xl border border-pulse-line bg-white/90 px-4 py-3 text-sm font-medium outline-none transition placeholder:text-pulse-muted/70 focus:border-pulse-green";

export function LogPage({ onNavigate }: LogPageProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState({
    symptom: "",
    severity: "5",
    treatment: "",
    notes: "",
  });

  const memoryPayload = useMemo(
    () => ({
      date: "2026-07-01",
      average_heart_rate: 81,
      resting_heart_rate: 63,
      maximum_heart_rate: 145,
      sleep_duration: 4.8,
      steps: 7420,
      stress_score: 72,
      hrv: 34,
      spo2: 98,
      latest_symptom: entries.find((entry) => entry.type === "symptom")?.label,
      latest_treatment: entries.find((entry) => entry.type === "treatment")
        ?.label,
    }),
    [entries],
  );

  const memorySignals = [
    {
      label: "Sleep",
      value: `${memoryPayload.sleep_duration}h`,
    },
    {
      label: "Recovery",
      value: "Lower",
    },
    {
      label: "Stress",
      value: `${memoryPayload.stress_score}/100`,
    },
  ];

  const handleSubmit = () => {
    const symptom = form.symptom.trim() || "Symptom note";
    const treatment = form.treatment.trim();
    const notes = form.notes.trim() || "No extra notes added.";

    setEntries((currentEntries) => [
      {
        id: `symptom-${Date.now()}`,
        type: "symptom",
        label: symptom,
        value: `Severity ${form.severity}/10 - ${notes}`,
        time: "Just now",
        source: "Patient log",
      },
      ...(treatment
        ? [
            {
              id: `treatment-${Date.now()}`,
              type: "treatment" as const,
              label: treatment,
              value: "Outcome pending",
              time: "Just now",
              source: "Treatment plan",
            },
          ]
        : []),
      ...currentEntries,
    ]);

    setForm({ symptom: "", severity: "5", treatment: "", notes: "" });
  };

  return (
    <AppShell activePage="Log" onNavigate={onNavigate}>
      <header className="flex flex-col gap-3 px-4 pb-1 pt-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap gap-2">
            <Badge tone="green">Daily log</Badge>
            <Badge tone="neutral">Wearable aware</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Health Log
          </h1>
        </div>
        <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-pulse-muted">
          Health sharing active
        </div>
      </header>

      <main className="px-4 pb-5 pt-3 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_360px]">
          <div className="grid content-start gap-4">
            <Card>
              <CardHeader eyebrow="Patient input" title="New entry" />
              <CardBody className="grid gap-3">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symptom: event.target.value,
                    }))
                  }
                  placeholder="Symptom"
                  value={form.symptom}
                />
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-pulse-muted">
                    Severity
                  </span>
                  <input
                    className="accent-pulse-ink"
                    max="10"
                    min="1"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        severity: event.target.value,
                      }))
                    }
                    type="range"
                    value={form.severity}
                  />
                  <span className="text-sm font-semibold">
                    {form.severity}/10
                  </span>
                </label>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      treatment: event.target.value,
                    }))
                  }
                  placeholder="Treatment or action"
                  value={form.treatment}
                />
                <textarea
                  className={`${inputClass} min-h-28 resize-none`}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Context, triggers, food, sleep, stress, outcome..."
                  value={form.notes}
                />
                <button
                  className="rounded-full bg-pulse-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-black/80"
                  onClick={handleSubmit}
                  type="button"
                >
                  Save log entry
                </button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader eyebrow="Health sharing" title="Connected sources" />
              <CardBody className="grid gap-3">
                {dataSources.map((source) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-pulse-sky px-4 py-3"
                    key={source.label}
                  >
                    <div>
                      <p className="text-sm font-bold">{source.label}</p>
                      <p className="text-xs font-medium text-pulse-muted">
                        {source.sync}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">
                      {source.status}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            <Card>
              <CardHeader eyebrow="Timeline" title="Today" />
              <CardBody className="grid gap-3">
                {entries.map((entry) => (
                  <article
                    className="rounded-2xl border border-pulse-line bg-white/80 p-4"
                    key={entry.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold">{entry.label}</p>
                        <p className="mt-1 text-sm leading-6 text-pulse-muted">
                          {entry.value}
                        </p>
                      </div>
                      <Badge
                        tone={entry.type === "wearable" ? "neutral" : "green"}
                      >
                        {entry.type}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-pulse-muted">
                      <span>{entry.time}</span>
                      <span>{entry.source}</span>
                    </div>
                  </article>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            <Card>
              <CardHeader eyebrow="Wearable summary" title="Daily metrics" />
              <CardBody className="grid grid-cols-2 gap-3">
                {wearableMetrics.map((metric) => (
                  <div
                    className="rounded-2xl bg-pulse-mint p-4"
                    key={metric.label}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-pulse-muted">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-pulse-muted">
                      {metric.detail}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader eyebrow="Saved health memory" title="Memory summary" />
              <CardBody className="grid gap-3">
                <div className="rounded-2xl bg-pulse-sky p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-pulse-muted">
                    What Pulse noticed
                  </p>
                  <p className="mt-2 text-sm leading-5 text-pulse-muted">
                    Short sleep, lower recovery, and high stress appeared before
                    today&apos;s headache. Hydration was saved as the latest action.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {memorySignals.map((item) => (
                    <div
                      className="rounded-2xl border border-pulse-line/70 bg-white/88 px-3 py-2"
                      key={item.label}
                    >
                      <p className="text-xs font-semibold text-pulse-muted">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/80 p-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="green">
                      Symptom: {memoryPayload.latest_symptom}
                    </Badge>
                    <Badge tone="neutral">
                      Treatment: {memoryPayload.latest_treatment}
                    </Badge>
                    <Badge tone="neutral">{memoryPayload.date}</Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
