import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, DownloadCloud } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { getDashboardData } from "../../features/dashboard/api/dashboard.api";
import { ConfidencePanel } from "../../features/dashboard/components/ConfidencePanel";
import {
  DashboardModal,
  ModalField,
  ModalTextArea,
} from "../../features/dashboard/components/DashboardModal";
import { DashboardHeader } from "../../features/dashboard/components/DashboardHeader";
import { EvidenceList } from "../../features/dashboard/components/EvidenceList";
import { EvaluationHarness } from "../../features/dashboard/components/EvaluationHarness";
import { InsightCard } from "../../features/dashboard/components/InsightCard";
import { LiveGraphPanel } from "../../features/dashboard/components/LiveGraphPanel";
import { PatientSnapshot } from "../../features/dashboard/components/PatientSnapshot";
import { QuickActions } from "../../features/dashboard/components/QuickActions";
import { TreatmentEffectivenessPanel } from "../../features/dashboard/components/TreatmentEffectivenessPanel";
import { TimelineFeed } from "../../features/dashboard/components/TimelineFeed";
import { TrendsPanel } from "../../features/dashboard/components/TrendsPanel";
import { WearableSummaryPanel } from "../../features/dashboard/components/WearableSummaryPanel";
import type {
  DashboardData,
  EvidenceCitation,
} from "../../features/dashboard/types/dashboard.types";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

const initialSymptomForm = {
  notes: "",
  symptom: "",
  time: "",
};

const initialOutcomeForm = {
  notes: "",
  result: "",
  treatment: "",
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeModal, setActiveModal] = useState<"outcome" | "symptom" | null>(
    null,
  );
  const [language, setLanguage] = useState("English");
  const [symptomForm, setSymptomForm] = useState(initialSymptomForm);
  const [outcomeForm, setOutcomeForm] = useState(initialOutcomeForm);
  const [isSyncingWearable, setIsSyncingWearable] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    if (page === "Dashboard") {
      navigate("/dashboard");
    } else if (page === "Graph") {
      navigate("/graph");
    } else if (page === "Trends") {
      navigate("/trends");
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  useEffect(() => {
    void getDashboardData().then(setData);
  }, []);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/v1/generate_summary");
      if (!response.ok) throw new Error("Failed to generate summary");
      const result = await response.json();
      setSummaryText(result.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      alert("Failed to generate visit summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadSummaryPDF = async () => {
    if (!summaryText) return;
    setIsDownloadingSummary(true);
    try {
      const response = await fetch("/api/v1/summary/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: summaryText }),
      });
      if (!response.ok) throw new Error("PDF generation failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "patient_visit_summary.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF summary.");
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  const parsedSections = summaryText
    ? (() => {
        // Match sections starting with **Header** or a digit-numbered heading (e.g. 1. Header)
        const pattern = /(?=\n\*\*[^*]+\*\*|\n\d+\.\s+[A-Za-z ]+)/g;
        // Prepend a newline so the first section aligns with the pattern if needed
        const segments = ("\n" + summaryText).split(pattern);
        return segments
          .map((sec) => {
            const trimmed = sec.trim();
            const lines = trimmed.split("\n");
            const rawTitle = lines[0] || "";
            const title = rawTitle.replace(/\*\*/g, "").replace(/^\d+\.\s+/, "").trim();
            const content = lines.slice(1).join("\n").trim();
            return { title, content };
          })
          .filter((s) => s.title && s.content);
      })()
    : [];

  if (!data) {
    return (
      <AppShell activePage="Dashboard" onNavigate={onNavigate}>
        <div className="grid min-h-screen place-items-center px-5">
          <div className="rounded-lg border border-pulse-line bg-white px-5 py-4 shadow-pulse">
            <p className="text-sm font-bold text-pulse-muted">
              Loading Pulse memory...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const addEntry = (entry: EvidenceCitation) => {
    setData((currentData) => {
      if (!currentData) {
        return currentData;
      }

      return {
        ...currentData,
        citations: [entry, ...currentData.citations],
      };
    });
  };

  const handleSymptomSubmit = () => {
    const symptom = symptomForm.symptom.trim() || "New symptom";
    const notes = symptomForm.notes.trim() || "Symptom logged from dashboard.";

    addEntry({
      date: symptomForm.time.trim() || "Just now",
      event: `${symptom} - ${notes}`,
      id: `symptom-${Date.now()}`,
      relationship: "supports",
      source: "Patient log",
    });

    setSymptomForm(initialSymptomForm);
    setActiveModal(null);
  };

  const handleOutcomeSubmit = () => {
    const treatment = outcomeForm.treatment.trim() || "Treatment";
    const result = outcomeForm.result.trim() || "Outcome recorded";
    const notes = outcomeForm.notes.trim() || "Follow-up result added.";

    addEntry({
      date: "Just now",
      event: `${treatment} - ${result}. ${notes}`,
      id: `outcome-${Date.now()}`,
      relationship: "improved",
      source: "Treatment outcome",
    });

    setOutcomeForm(initialOutcomeForm);
    setActiveModal(null);
  };

  const handleDeleteEntry = (id: string) => {
    setData((currentData) => {
      if (!currentData) {
        return currentData;
      }

      return {
        ...currentData,
        citations: currentData.citations.filter((entry) => entry.id !== id),
      };
    });
  };

  const handleRedactEntry = (id: string) => {
    setData((currentData) => {
      if (!currentData) {
        return currentData;
      }

      return {
        ...currentData,
        citations: currentData.citations.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                event: "Sensitive note redacted. Relationship metadata retained.",
              }
            : entry,
        ),
      };
    });
  };

  const handleWearableSync = async () => {
    setIsSyncingWearable(true);
    try {
      const response = await fetch("/api/v1/wearable/sync", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Sync failed");
      const result = await response.json();
      
      const pattern = result.pattern;
      const metrics = result.metrics;
      
      // Save raw metrics data to localStorage for TrendsPage
      localStorage.setItem("pulse_synced_metrics", JSON.stringify(metrics));
      
      setData((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          activePattern: {
            ...currentData.activePattern,
            symptom: pattern.symptom,
            summary: pattern.summary,
            triggerCandidates: pattern.triggerCandidates,
            treatmentMemory: pattern.treatmentMemory,
            recommendation: pattern.recommendation,
            updatedAt: "Just now",
            consistency: {
              ...currentData.activePattern.consistency,
              score: pattern.accuracyScore ?? currentData.activePattern.consistency.score,
            },
          }
        };
      });
    } catch (err) {
      console.error(err);
      alert("Failed to sync wearable data");
    } finally {
      setIsSyncingWearable(false);
    }
  };

  return (
    <AppShell activePage="Dashboard" onNavigate={handleNavigate}>
      <DashboardHeader language={language} onLanguageChange={setLanguage} />
      <main className="px-4 pb-5 pt-3 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          <div className="grid min-h-0 content-start gap-4">
            <PatientSnapshot
              patient={data.patient}
              dataSources={data.dataSources}
              onWearableSync={handleWearableSync}
              isSyncingWearable={isSyncingWearable}
            />
            <WearableSummaryPanel summary={data.wearableSummary} />
            <TimelineFeed entries={data.timeline} />
          </div>

          <div className="grid min-h-0 content-start gap-4">
            <InsightCard pattern={data.activePattern} />
            <LiveGraphPanel />
            <QuickActions
              onAddOutcome={() => setActiveModal("outcome")}
              onLogSymptom={() => setActiveModal("symptom")}
            />
            <TrendsPanel trends={data.trends} />
          </div>

          <div className="grid min-h-0 content-start gap-4">
            <ConfidencePanel pattern={data.activePattern} />
            <TreatmentEffectivenessPanel pattern={data.activePattern} />
            <EvaluationHarness evaluation={data.systemEvaluation} />
            <EvidenceList
              citations={data.citations}
              onGenerateSummary={handleGenerateSummary}
              isGeneratingSummary={isGeneratingSummary}
            />
          </div>
        </div>
      </main>

      {activeModal === "symptom" ? (
        <DashboardModal
          eyebrow="Patient log"
          onClose={() => setActiveModal(null)}
          onSubmit={handleSymptomSubmit}
          title="Log symptom"
        >
          <ModalField
            label="Symptom"
            name="symptom"
            onChange={(value) =>
              setSymptomForm((form) => ({ ...form, symptom: value }))
            }
            placeholder="Headache, nausea, fatigue..."
            value={symptomForm.symptom}
          />
          <ModalField
            label="Time"
            name="time"
            onChange={(value) =>
              setSymptomForm((form) => ({ ...form, time: value }))
            }
            placeholder="Today, 10:24"
            value={symptomForm.time}
          />
          <ModalTextArea
            label="Notes"
            name="notes"
            onChange={(value) =>
              setSymptomForm((form) => ({ ...form, notes: value }))
            }
            placeholder="Add what happened before it, severity, and anything unusual."
            value={symptomForm.notes}
          />
        </DashboardModal>
      ) : null}

      {activeModal === "outcome" ? (
        <DashboardModal
          eyebrow="Treatment result"
          onClose={() => setActiveModal(null)}
          onSubmit={handleOutcomeSubmit}
          title="Add outcome"
        >
          <ModalField
            label="Treatment"
            name="treatment"
            onChange={(value) =>
              setOutcomeForm((form) => ({ ...form, treatment: value }))
            }
            placeholder="Hydration, rest, medication..."
            value={outcomeForm.treatment}
          />
          <ModalField
            label="Result"
            name="result"
            onChange={(value) =>
              setOutcomeForm((form) => ({ ...form, result: value }))
            }
            placeholder="Improved, no change, worsened..."
            value={outcomeForm.result}
          />
          <ModalTextArea
            label="Follow-up notes"
            name="notes"
            onChange={(value) =>
              setOutcomeForm((form) => ({ ...form, notes: value }))
            }
            placeholder="Record what changed over the next few hours or days."
            value={outcomeForm.notes}
          />
        </DashboardModal>
      ) : null}

      {summaryText ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(20,20,24,0.25)] flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 border-b border-pulse-line pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pulse-muted">
                  Doctor-Ready Summary
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal text-pulse-ink">
                  Patient Visit & Log History
                </h2>
              </div>
              <button
                className="grid h-9 w-9 place-items-center rounded-full bg-pulse-surface text-lg leading-none transition hover:bg-pulse-line"
                onClick={() => setSummaryText(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-5 overflow-y-auto pr-2 flex-1 space-y-4">
              {parsedSections.length > 0 ? (
                parsedSections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-pulse-green/20 bg-white/80 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                  >
                    <h3 className="text-sm font-bold text-pulse-ink border-b border-pulse-line pb-1.5 mb-2.5">
                      {sec.title}
                    </h3>
                    <div className="text-sm leading-6 text-pulse-muted">
                      {sec.content.includes("|") ? (
                        <pre className="font-mono bg-pulse-surface/80 p-3.5 rounded-xl text-xs overflow-x-auto whitespace-pre border border-pulse-line/50 mt-2">
                          {sec.content}
                        </pre>
                      ) : (
                        <div className="whitespace-pre-wrap">{sec.content}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-pulse-mint/20 p-5 border border-pulse-green/30 text-sm leading-6 text-pulse-ink font-sans whitespace-pre-wrap">
                  {summaryText}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-pulse-line pt-4">
              <button
                className="flex items-center gap-2 rounded-full border border-pulse-line bg-white/80 px-4 py-2 text-sm font-semibold text-pulse-ink shadow-sm transition hover:bg-pulse-green/20 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDownloadSummaryPDF}
                disabled={isDownloadingSummary}
                type="button"
              >
                {isDownloadingSummary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                Download PDF
              </button>
              <button
                className="rounded-full bg-pulse-ink text-white px-6 py-2 text-sm font-semibold transition hover:bg-black"
                onClick={() => setSummaryText(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
