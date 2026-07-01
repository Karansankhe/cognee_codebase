import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  getDashboardData,
  syncWearablePattern,
} from "../../features/dashboard/api/dashboard.api";
import { ConfidencePanel } from "../../features/dashboard/components/ConfidencePanel";
import { DataControlsPanel } from "../../features/dashboard/components/DataControlsPanel";
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeModal, setActiveModal] = useState<"outcome" | "symptom" | null>(
    null,
  );
  const [language, setLanguage] = useState("English");
  const [isSyncingWearable, setIsSyncingWearable] = useState(false);
  const [symptomForm, setSymptomForm] = useState(initialSymptomForm);
  const [outcomeForm, setOutcomeForm] = useState(initialOutcomeForm);
  const [isSyncingWearable, setIsSyncingWearable] = useState(false);

  useEffect(() => {
    void getDashboardData().then(setData);
  }, []);

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
      const pattern = await syncWearablePattern();

      setData((currentData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          activePattern: {
            ...currentData.activePattern,
            symptom: pattern.symptom,
            summary: pattern.summary,
            triggerCandidates: pattern.triggerCandidates,
            treatmentMemory: pattern.treatmentMemory,
            updatedAt: "Updated just now",
          },
          timeline: [
            {
              description: pattern.summary,
              id: `wearable-sync-${Date.now()}`,
              languageCode: "EN",
              occurredAt: "Just now",
              source: "Connected watch",
              title: "Health pattern updated",
              type: "wearable",
            },
            ...currentData.timeline,
          ],
        };
      });
    } catch (error) {
      console.error("Wearable update failed", error);
      alert("Failed to update connected watch data");
    } finally {
      setIsSyncingWearable(false);
    }
  };

  return (
    <AppShell activePage="Dashboard" onNavigate={onNavigate}>
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
            <DataControlsPanel
              entries={data.citations}
              onDeleteEntry={handleDeleteEntry}
              onRedactEntry={handleRedactEntry}
            />
          </div>

          <div className="grid min-h-0 content-start gap-4">
            <ConfidencePanel pattern={data.activePattern} />
            <TreatmentEffectivenessPanel pattern={data.activePattern} />
            <EvaluationHarness evaluation={data.systemEvaluation} />
            <EvidenceList citations={data.citations} />
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
    </AppShell>
  );
}
