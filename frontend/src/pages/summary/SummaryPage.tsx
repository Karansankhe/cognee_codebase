import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  DownloadCloud,
  FileHeart,
  Network,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { getDashboardData } from "../../features/dashboard/api/dashboard.api";
import type { DashboardData } from "../../features/dashboard/types/dashboard.types";

const noteBlocks = [
  {
    title: "Clinical focus",
    copy: "Migraine episodes cluster around poor sleep, low hydration, and elevated stress markers.",
  },
  {
    title: "Patient context",
    copy: "Wearable signals and daily logs suggest the pattern appears before the patient reports severe symptoms.",
  },
  {
    title: "Next visit question",
    copy: "Review whether hydration, sleep correction, and current medication timing should be adjusted.",
  },
];

function buildReport(data: DashboardData) {
  const pattern = data.activePattern;
  const evidence = data.citations
    .slice(0, 6)
    .map((item) => `- ${item.date}: ${item.event} (${item.source}, ${item.relationship})`)
    .join("\n");
  const trends = data.trends.temporalTrends
    .map((trend) => `- ${trend.label}: ${trend.value}`)
    .join("\n");

  return [
    "Pulse Visit Summary",
    "",
    `Patient: ${data.patient.name}, ${data.patient.age}`,
    `Active conditions: ${data.patient.activeConditions.join(", ")}`,
    `Risk note: ${data.patient.riskNote}`,
    "",
    "Primary pattern",
    `${pattern.symptom}: ${pattern.summary}`,
    `Confidence: ${pattern.consistency.score}% across ${pattern.consistency.matchedEpisodes}/${pattern.consistency.totalEpisodes} episodes`,
    `Treatment response: ${pattern.treatmentEffectiveness.score}%`,
    "",
    "Trigger candidates",
    pattern.triggerCandidates.map((trigger) => `- ${trigger}`).join("\n"),
    "",
    "Recommended action",
    pattern.recommendation ?? pattern.treatmentMemory,
    "",
    "Temporal trends",
    trends,
    "",
    "Evidence",
    evidence,
  ].join("\n");
}

export function SummaryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    void getDashboardData().then(setData);
  }, []);

  const reportText = useMemo(() => (data ? buildReport(data) : ""), [data]);

  const handleNavigate = (page: string) => {
    if (page === "Dashboard") navigate("/dashboard");
    if (page === "Graph") navigate("/graph");
    if (page === "Trends") navigate("/trends");
    if (page === "Summary") navigate("/summary");
  };

  const handleExport = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pulse-visit-summary.txt";
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    setShareStatus("Report exported");
  };

  const handleShare = async () => {
    if (!reportText) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Pulse Visit Summary",
          text: reportText,
        });
        setShareStatus("Share sheet opened");
        return;
      }

      await navigator.clipboard.writeText(reportText);
      setShareStatus("Copied report to clipboard");
    } catch (error) {
      console.error(error);
      setShareStatus("Unable to share report");
    }
  };

  if (!data) {
    return (
      <AppShell activePage="Summary" onNavigate={handleNavigate}>
        <div className="grid min-h-screen place-items-center px-5">
          <div className="rounded-lg border border-pulse-line bg-white px-5 py-4 shadow-pulse">
            <p className="text-sm font-normal text-pulse-muted">
              Preparing summary...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const pattern = data.activePattern;
  const topEvidence = data.citations.slice(0, 5);
  const readyChecks = [
    "Symptoms grouped by trigger",
    "Treatment memory attached",
    "Evidence sources retained",
    "Multilingual note ready",
  ];

  return (
    <AppShell activePage="Summary" onNavigate={handleNavigate}>
      <main className="h-[calc(100vh-2rem)] overflow-y-auto px-4 pb-5 pt-3 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-pulse-line/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-normal uppercase tracking-[0.16em] text-pulse-muted">
              Doctor-ready summary
            </p>
            <h1 className="mt-1 text-3xl font-normal tracking-normal text-pulse-ink">
              Visit Summary
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-pulse-line bg-white/75 px-3 py-1.5 text-xs font-normal text-pulse-ink shadow-sm">
              <span className="h-2 w-2 rounded-full bg-pulse-green" />
              Patient: {data.patient.name}
            </div>
            <p className="mt-1 max-w-2xl text-sm font-normal leading-6 text-pulse-muted">
              A compact report built from the Pulse memory graph, wearable signals,
              treatment outcomes, and cited evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {shareStatus ? (
              <span className="rounded-full bg-pulse-green/35 px-3 py-2 text-xs font-normal text-pulse-ink">
                {shareStatus}
              </span>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-full border border-pulse-line bg-white/80 px-4 py-2 text-xs font-normal shadow-sm transition hover:border-pulse-green hover:bg-pulse-mint/30"
              onClick={handleShare}
              type="button"
            >
              <Send className="h-3.5 w-3.5" />
              Share
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-pulse-ink px-4 py-2 text-xs font-normal text-white shadow-sm transition hover:-translate-y-0.5"
              onClick={handleExport}
              type="button"
            >
              <DownloadCloud className="h-3.5 w-3.5" />
              Export report
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
          <section className="grid content-start gap-4">
            <Card className="overflow-hidden bg-white/80">
              <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
                <div className="p-5">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-pulse-green/35 px-3 py-1.5 text-[10px] font-normal uppercase tracking-[0.12em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ready for appointment
                  </div>
                  <h2 className="text-2xl font-normal leading-tight text-pulse-ink">
                    {pattern.symptom} pattern linked to{" "}
                    {pattern.triggerCandidates.slice(0, 2).join(" and ")}.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm font-normal leading-6 text-pulse-muted">
                    {pattern.summary}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: "Confidence",
                        value: `${pattern.consistency.score}%`,
                        copy: `${pattern.consistency.matchedEpisodes}/${pattern.consistency.totalEpisodes} matched`,
                      },
                      {
                        label: "Treatment response",
                        value: `${pattern.treatmentEffectiveness.score}%`,
                        copy: `${pattern.treatmentEffectiveness.helpedAttempts}/${pattern.treatmentEffectiveness.totalAttempts} helped`,
                      },
                      {
                        label: "Updated",
                        value: pattern.updatedAt,
                        copy: "latest memory refresh",
                      },
                    ].map((item) => (
                      <div
                        className="rounded-[18px] border border-pulse-line bg-white/75 p-4"
                        key={item.label}
                      >
                        <p className="text-[10px] font-normal uppercase tracking-[0.12em] text-pulse-muted">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xl font-normal">{item.value}</p>
                        <p className="mt-1 text-xs font-normal text-pulse-muted">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-pulse-line bg-pulse-mint/30 p-5 lg:border-l lg:border-t-0">
                  <p className="text-[10px] font-normal uppercase tracking-[0.16em] text-pulse-muted">
                    Report readiness
                  </p>
                  <div className="mt-4 space-y-3">
                    {readyChecks.map((check) => (
                      <div className="flex items-center gap-2 text-sm font-normal" key={check}>
                        <CheckCircle2 className="h-4 w-4 text-[#37c77f]" />
                        {check}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              {noteBlocks.map((note, index) => (
                <Card
                  className={
                    index === 0
                      ? "bg-[#f2f1ff]/90"
                      : index === 1
                        ? "bg-[#e9f9d9]/90"
                        : "bg-[#fff6cc]/90"
                  }
                  key={note.title}
                >
                  <CardBody className="p-4">
                    <p className="text-sm font-normal">{note.title}</p>
                    <p className="mt-2 text-sm font-normal leading-6 text-pulse-muted">
                      {note.copy}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>

            <Card className="bg-white/80">
              <CardHeader
                eyebrow="Evidence timeline"
                title="Cited memories behind the summary"
                action={
                  <span className="rounded-full bg-pulse-green/30 px-3 py-1.5 text-xs font-normal">
                    {data.citations.length} sources
                  </span>
                }
              />
              <CardBody className="p-5">
                <div className="space-y-3">
                  {topEvidence.map((item) => (
                    <div
                      className="grid gap-3 rounded-[18px] border border-pulse-line bg-white/70 p-4 md:grid-cols-[120px_1fr_110px]"
                      key={item.id}
                    >
                      <div>
                        <p className="text-xs font-normal text-pulse-ink">{item.date}</p>
                        <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.12em] text-pulse-muted">
                          {item.source}
                        </p>
                      </div>
                      <p className="text-sm font-normal leading-6 text-pulse-muted">
                        {item.event}
                      </p>
                      <span
                        className={`self-start rounded-full px-3 py-1 text-center text-[10px] font-normal uppercase ${
                          item.relationship === "improved"
                            ? "bg-pulse-green/35"
                            : item.relationship === "contradicts"
                              ? "bg-red-100 text-red-900"
                              : "bg-[#f2f1ff]"
                        }`}
                      >
                        {item.relationship}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </section>

          <aside className="grid content-start gap-4">
            <Card className="bg-pulse-ink text-white">
              <CardBody className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-normal uppercase tracking-[0.16em] text-white/55">
                      Visit note
                    </p>
                    <h2 className="mt-2 text-2xl font-normal leading-tight">
                      Bring this to the next appointment.
                    </h2>
                  </div>
                  <FileHeart className="h-8 w-8 shrink-0 text-pulse-green" />
                </div>
                <p className="mt-4 text-sm font-normal leading-6 text-white/70">
                  {pattern.recommendation ?? pattern.treatmentMemory}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-white/80">
              <CardHeader eyebrow="Trigger candidates" title="Ranked drivers" />
              <CardBody className="p-5">
                <div className="space-y-3">
                  {pattern.triggerCandidates.map((trigger, index) => (
                    <div className="flex items-center gap-3" key={trigger}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pulse-green/40 text-xs font-normal">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-normal">{trigger}</p>
                          <p className="text-xs font-normal text-pulse-muted">
                            {Math.max(74 - index * 8, 42)}%
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-pulse-line">
                          <div
                            className="h-full rounded-full bg-pulse-ink"
                            style={{ width: `${Math.max(74 - index * 8, 42)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white/80">
              <CardHeader eyebrow="Signals" title="What changed recently" />
              <CardBody className="grid gap-3 p-5">
                {data.trends.temporalTrends.slice(0, 3).map((trend, index) => (
                  <div
                    className="flex items-center gap-3 rounded-[18px] bg-[#f7f7f8] p-3"
                    key={trend.id}
                  >
                    {index === 0 ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : index === 1 ? (
                      <Activity className="h-5 w-5 text-pulse-ink" />
                    ) : (
                      <Network className="h-5 w-5 text-[#37c77f]" />
                    )}
                    <div>
                      <p className="text-sm font-normal">{trend.label}</p>
                      <p className="text-xs font-normal text-pulse-muted">
                        {trend.value}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-pulse-line bg-white/75 px-5 py-4 text-sm font-normal shadow-pulse transition hover:-translate-y-0.5 hover:border-pulse-green"
              onClick={async () => {
                await navigator.clipboard.writeText(reportText);
                setShareStatus("Copied report to clipboard");
              }}
              type="button"
            >
              <Clipboard className="h-4 w-4" />
              Copy summary text
            </button>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}


