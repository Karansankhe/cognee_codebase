import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/landing/LandingPage";
import { AuthPage } from "../pages/auth/AuthPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UploadPage } from "../pages/upload/UploadPage";
import { GraphPage } from "../pages/graph/GraphPage";
import { SummaryPage } from "../pages/summary/SummaryPage";
import { TrendsPage } from "../pages/trends/TrendsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/onboarding" element={<UploadPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/trends" element={<TrendsPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
