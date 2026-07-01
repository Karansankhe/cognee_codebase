import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, Brain } from "lucide-react";

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [location, setLocation] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [sleepAmount, setSleepAmount] = useState("");
  const [otherHabits, setOtherHabits] = useState("");
  
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientMedications, setPatientMedications] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are currently supported.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are currently supported.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    
    const insightsFormData = new FormData();
    insightsFormData.append("location", location);
    insightsFormData.append("water_intake", waterIntake);
    insightsFormData.append("sleep_amount", sleepAmount);
    insightsFormData.append("other_habits", otherHabits);

    try {
      // 1. Upload the PDF
      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload file");
      }

      // 2. Generate insights based on habits
      if (location) {
        const insightsResponse = await fetch("/api/v1/insights", {
          method: "POST",
          body: insightsFormData,
        });
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          localStorage.setItem("pulse_insights", JSON.stringify(insightsData));
        }
      }

      // 3. Store patient info
      localStorage.setItem("pulse_patient_info", JSON.stringify({
        name: patientName,
        age: patientAge,
        gender: patientGender,
        medications: patientMedications,
      }));

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsUploading(false);
    }
  };

  return (
    /* Outer canvas — identical to AppShell's bg-pulse-canvas + p-3 */
    <div className="min-h-screen bg-pulse-canvas p-3 font-sans text-pulse-ink">

      {/* Blurry orb background — identical to AppShell */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-pulse-green/35 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-96 w-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 h-80 w-80 rounded-full bg-lime-100/40 blur-3xl" />
      </div>

      {/* Frosted glass container — identical to AppShell */}
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1760px] items-center justify-center rounded-[34px] bg-white/25 shadow-[0_30px_90px_rgba(30,30,36,0.14)] backdrop-blur-2xl">

        <div className="w-full max-w-md px-6 py-10">

          {/* Brand mark — same style as AppShell sidebar logo */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-pulse-ink text-white shadow-pulse">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">Pulse</p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-pulse-muted">
                Personal memory · Graph RAG
              </p>
            </div>
          </div>

          {/* Card — white frosted surface matching dashboard panel cards */}
          <div className="rounded-[24px] border border-pulse-line bg-white/60 p-6 shadow-pulse backdrop-blur-sm">

            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-pulse-muted">
              Get started
            </p>
            <h1 className="mb-4 text-xl font-bold text-pulse-ink">
              Upload your document
            </h1>
            <p className="mb-5 text-sm leading-relaxed text-pulse-muted">
              Drop a PDF to build your personal knowledge graph. Pulse will extract entities, relationships, and surface insights automatically.
            </p>

            {/* Patient Information Form */}
            <div className="mb-5 rounded-[16px] border border-pulse-line bg-white/40 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-pulse-muted">Patient Details</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-lg border border-pulse-line bg-white/50 px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full rounded-lg border border-pulse-line bg-white/50 px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none"
                />
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full rounded-lg border border-pulse-line bg-white/50 px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Medications (comma separated)"
                  value={patientMedications}
                  onChange={(e) => setPatientMedications(e.target.value)}
                  className="w-full rounded-lg border border-pulse-line bg-white/50 px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none"
                />
              </div>
            </div>

            {/* Habits Form */}
            <div className="mb-5 space-y-3">
              <input
                type="text"
                placeholder="Where do you stay? (e.g., Seattle, WA)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-pulse-line bg-white/50 px-4 py-2.5 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none focus:ring-2 focus:ring-pulse-green/20"
              />
              <input
                type="text"
                placeholder="Daily water intake (e.g., 2 Liters)"
                value={waterIntake}
                onChange={(e) => setWaterIntake(e.target.value)}
                className="w-full rounded-lg border border-pulse-line bg-white/50 px-4 py-2.5 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none focus:ring-2 focus:ring-pulse-green/20"
              />
              <input
                type="text"
                placeholder="Average sleep amount (e.g., 6 hours)"
                value={sleepAmount}
                onChange={(e) => setSleepAmount(e.target.value)}
                className="w-full rounded-lg border border-pulse-line bg-white/50 px-4 py-2.5 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none focus:ring-2 focus:ring-pulse-green/20"
              />
              <input
                type="text"
                placeholder="Other daily habits (e.g., drinking coffee)"
                value={otherHabits}
                onChange={(e) => setOtherHabits(e.target.value)}
                className="w-full rounded-lg border border-pulse-line bg-white/50 px-4 py-2.5 text-sm text-pulse-ink placeholder:text-pulse-muted focus:border-pulse-green focus:outline-none focus:ring-2 focus:ring-pulse-green/20"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "relative mb-5 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed p-8 text-center transition-all duration-200",
                isDragging
                  ? "scale-[1.01] border-pulse-ink bg-pulse-green/20"
                  : file
                    ? "border-pulse-ink/40 bg-pulse-green/10"
                    : "border-pulse-line bg-white/40 hover:border-pulse-ink/30 hover:bg-white/60",
              ].join(" ")}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />

              {file ? (
                <>
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-pulse-green shadow-pulse">
                    <FileText className="h-5 w-5 text-pulse-ink" />
                  </div>
                  <p className="max-w-[220px] truncate text-sm font-semibold text-pulse-ink">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-pulse-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-pulse-surface">
                    <UploadCloud className="h-5 w-5 text-pulse-muted" />
                  </div>
                  <p className="text-sm font-semibold text-pulse-ink">
                    {isDragging ? "Drop it here" : "Click or drag & drop"}
                  </p>
                  <p className="mt-0.5 text-xs text-pulse-muted">PDF files only</p>
                </>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* CTA — rounded-full pill matching dashboard nav active state */}
            <button
              id="upload-submit-btn"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all duration-200",
                !file
                  ? "cursor-not-allowed bg-pulse-surface text-pulse-muted"
                  : isUploading
                    ? "cursor-wait bg-pulse-ink/80 text-white"
                    : "bg-pulse-ink text-white shadow-pulse hover:bg-pulse-ink/80",
              ].join(" ")}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building knowledge graph…
                </>
              ) : file ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Upload &amp; Open Dashboard
                </>
              ) : (
                "Select a document to continue"
              )}
            </button>

          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-pulse-muted">
            Your data is processed locally and stored in your personal Neo4j graph.
          </p>

        </div>
      </div>
    </div>
  );
}
