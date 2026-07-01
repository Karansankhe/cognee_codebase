import { dashboardMock } from "../mocks/dashboard.mock";
import type { DashboardData } from "../types/dashboard.types";

export interface WearablePatternResponse {
  symptom: string;
  summary: string;
  triggerCandidates: string[];
  treatmentMemory: string;
}

export async function getDashboardData(): Promise<DashboardData> {
  return dashboardMock;
}

export async function syncWearablePattern(): Promise<WearablePatternResponse> {
  const response = await fetch("http://127.0.0.1:8000/api/v1/wearable/sync", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to update wearable pattern");
  }

  return response.json();
}
