import { Routes, Route } from "react-router-dom";
import { AuthPage } from "../pages/auth/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="*" element={<AuthPage />} />
    </Routes>
  );
}
