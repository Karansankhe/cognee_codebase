import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UploadPage } from "../pages/upload/UploadPage";
import { GraphPage } from "../pages/graph/GraphPage";
import { TrendsPage } from "../pages/trends/TrendsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/trends" element={<TrendsPage />} />
    </Routes>
  );
}
