import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UploadPage } from "../pages/upload/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
