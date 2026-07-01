import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type {
  DataSource,
  DataSourceStatus,
  PatientProfile,
} from "../types/dashboard.types";

interface PatientSnapshotProps {
  patient: PatientProfile;
  dataSources: DataSource[];
  onWearableSync?: () => void;
  isSyncingWearable?: boolean;
}

const statusTone: Record<DataSourceStatus, "green" | "blue" | "amber"> = {
  connected: "green",
  syncing: "blue",
  attention: "amber",
};

export function PatientSnapshot({ patient: defaultPatient, dataSources, onWearableSync, isSyncingWearable }: PatientSnapshotProps) {
  const [patientInfo, setPatientInfo] = useState(defaultPatient);

  useEffect(() => {
    const stored = localStorage.getItem("pulse_patient_info");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPatientInfo((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          age: parsed.age ? parseInt(parsed.age) : prev.age,
          activeConditions: parsed.medications
            ? parsed.medications.split(",").map((s: string) => s.trim())
            : prev.activeConditions,
        }));
      } catch (err) {
        console.error("Failed to parse patient info", err);
      }
    }
  }, []);

export function PatientSnapshot({
  dataSources,
  isSyncingWearable = false,
  onWearableSync,
  patient,
}: PatientSnapshotProps) {
  return (
    <Card className="bg-white/70">
      <CardHeader title="Patient Snapshot" eyebrow="Active memory" />
      <CardBody className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pulse-ink text-sm font-semibold text-white uppercase">
            {patientInfo.name
              ? patientInfo.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .substring(0, 2)
              : "NA"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{patientInfo.name || "Patient"}</h3>
            <p className="text-xs text-pulse-muted">
              {patientInfo.age || 0} years old
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {patientInfo.activeConditions && patientInfo.activeConditions.length > 0 ? (
            patientInfo.activeConditions.map((condition, i) => (
              <Badge key={i} tone="neutral">
                {condition}
              </Badge>
            ))
          ) : (
            <Badge tone="neutral">No known conditions</Badge>
          )}
        </div>

        <div className="space-y-2">
{dataSources.map((source) => {
  const isSyncable = source.status === "syncing";

  return (
    <div
      key={source.id}
      className="rounded-[20px] bg-white/90 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium leading-5">{source.name}</p>

        {isSyncable && onWearableSync ? (
          <button
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isSyncingWearable
                ? "cursor-not-allowed bg-pulse-surface text-pulse-muted"
                : "border border-pulse-line bg-white hover:bg-pulse-green/20"
            }`}
            disabled={isSyncingWearable}
            onClick={onWearableSync}
            type="button"
          >
            {isSyncingWearable ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-pulse-muted" />
                updating
              </>
            ) : (
              "update"
            )}
          </button>
        ) : (
          <Badge tone={statusTone[source.status]}>
            {statusLabel[source.status]}
          </Badge>
        )}
      </div>

      <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-pulse-muted">
        {source.description}
      </p>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-pulse-muted">
        Last update:{" "}
        {isSyncable && isSyncingWearable ? "UPDATING..." : source.lastSyncedAt}
      </p>
    </div>
  );
})}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
