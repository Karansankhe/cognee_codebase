import { Routes, Route } from "react-router-dom";
import { GraphPage } from "../pages/graph/GraphPage";
import { SummaryPage } from "../pages/summary/SummaryPage";
import { TrendsPage } from "../pages/trends/TrendsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GraphPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/trends" element={<TrendsPage />} />
      <Route path="*" element={<GraphPage />} />
    </Routes>
  );
}
