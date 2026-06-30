import { dashboardMock } from "../mocks/dashboard.mock";
import type { DashboardData } from "../types/dashboard.types";

export async function getDashboardData(): Promise<DashboardData> {
  return dashboardMock;
}
