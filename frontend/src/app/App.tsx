import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { LogPage } from "../pages/log/LogPage";
import { UploadPage } from "../pages/upload/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/log" element={<LogPage />} />
    </Routes>
  );
}