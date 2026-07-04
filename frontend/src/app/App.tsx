import { Routes, Route } from "react-router-dom";
import { GraphPage } from "../pages/graph/GraphPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GraphPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="*" element={<GraphPage />} />
    </Routes>
  );
}
