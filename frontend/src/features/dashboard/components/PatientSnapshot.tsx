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
  isSyncingWearable?: boolean;
  onWearableSync?: () => void;
}

const statusTone: Record<DataSourceStatus, "green" | "blue" | "amber"> = {
  connected: "green",
  syncing: "blue",
  attention: "amber",
};

const statusLabel: Record<DataSourceStatus, string> = {
  connected: "connected",
  syncing: "updating",
  attention: "needs review",
};

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
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pulse-ink text-sm font-semibold text-white">
            {patient.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{patient.name}</h3>
            <p className="text-xs text-pulse-muted">
              {patient.age} years old
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {patient.activeConditions.map((condition) => (
            <Badge key={condition} tone="neutral">
              {condition}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          {dataSources.map((source) => {
            const isWearable =
              source.name.toLowerCase().includes("watch") ||
              source.name.toLowerCase().includes("wearable");

            return (
              <div
                key={source.id}
                className="rounded-[20px] bg-white/90 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium leading-5">{source.name}</p>
                  {isWearable && onWearableSync ? (
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
                  {isWearable && isSyncingWearable
                    ? "UPDATING..."
                    : source.lastSyncedAt}
                </p>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
