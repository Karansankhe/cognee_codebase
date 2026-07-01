import { useState } from "react";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { LogPage } from "../pages/log/LogPage";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  if (activePage === "Log") {
    return <LogPage onNavigate={setActivePage} />;
  }

  return <DashboardPage onNavigate={setActivePage} />;
}
