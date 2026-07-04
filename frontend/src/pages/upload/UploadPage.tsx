import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, Brain, ArrowRight, ArrowLeft } from "lucide-react";
import { apiUrl } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import pulseLogo from "../../assets/pulse-logo.png";

interface QuizQuestion {
  question: string;
  options: string[];
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "How often do you experience recurrent health symptoms?",
    options: ["Daily", "Weekly", "Monthly", "Rarely"]
  },
  {
    question: "What do you suspect is the primary trigger for your symptoms?",
    options: ["Poor sleep", "High stress", "Dehydration", "Exercise/Exertion"]
  },
  {
    question: "How do you currently treat or address your symptoms?",
    options: ["Medications", "Rest & Sleep", "Hydration/Diet", "No specific treatment"]
  },
  {
    question: "Do you actively track your daily lifestyle factors?",
    options: ["Yes, using wearables", "Yes, manually keeping notes", "Occasionally", "No"]
  },
  {
    question: "How well does your doctor remember your symptom history?",
    options: ["Perfectly, they have full history", "Somewhat, but I retell details", "Poorly, we start over every visit"]
  },
  {
    question: "What is your average nightly sleep duration?",
    options: ["Under 5 hours", "5 to 7 hours", "7 to 9 hours", "9+ hours"]
  },
  {
    question: "What is your average daily water intake?",
    options: ["Less than 1 Liter", "1 to 2 Liters", "2+ Liters", "I do not keep track"]
  },
  {
    question: "How often do you engage in active exercise?",
    options: ["Daily", "3-4 times a week", "Rarely", "Never"]
  },
  {
    question: "Do you know what triggers your symptom episodes?",
    options: ["Yes, fully identified", "I have some guesses", "No, they seem random"]
  },
  {
    question: "What is your primary goal for using Pulse?",
    options: ["Identify symptom triggers", "Log treatment efficacy", "Track lifestyle trends", "Maintain clinical memory"]
  }
];

export function UploadPage() {
  const navigate = useNavigate();

  // Navigation steps: "quiz" | "upload"
  const [step, setStep] = useState<"quiz" | "upload">("quiz");

  // Onboarding quiz state
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(new Array(quizQuestions.length).fill(""));
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Upload/Habits page state
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
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete the entire patient knowledge graph dataset from Cognee Cloud? This cannot be undone.")) {
      return;
    }
    setIsResetting(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/v1/reset-dataset"), {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to delete dataset from Cognee Cloud");
      }
      alert("Cognee memory dataset successfully deleted and reset!");
      setFile(null);
      setLocation("");
      setWaterIntake("");
      setSleepAmount("");
      setOtherHabits("");
      setPatientName("");
      setPatientAge("");
      setPatientGender("");
      setPatientMedications("");
      localStorage.clear();
    } catch (err: any) {
      setError(err.message || "Failed to reset dataset.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectQuizOption = (option: string) => {
    const updated = [...quizAnswers];
    updated[currentQuizIdx] = option;
    setQuizAnswers(updated);

    // Auto advance
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
    }
  };

  const handleQuizSubmit = async () => {
    setIsSavingQuiz(true);
    setError(null);

    // Format question-answer pairs
    const formattedAnswers = quizQuestions.map((q, idx) => ({
      question: q.question,
      answer: quizAnswers[idx] || "No answer selected"
    }));

    try {
      const response = await fetch(apiUrl("/api/v1/onboarding/remember"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding survey answers in Cognee");
      }

      // Advance to upload page
      setStep("upload");
    } catch (err: any) {
      setError(err.message || "Failed to save survey. Continuing anyway...");
      setStep("upload");
    } finally {
      setIsSavingQuiz(false);
    }
  };

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
      const response = await fetch(apiUrl("/api/v1/upload"), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload file");
      }

      // 2. Generate insights based on habits
      if (location) {
        const insightsResponse = await fetch(apiUrl("/api/v1/insights"), {
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

  const selectedAnswer = quizAnswers[currentQuizIdx];
  const progressPercentage = ((currentQuizIdx + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-pulse-canvas p-3 font-sans text-pulse-ink flex flex-col justify-center">

      {/* Blurry orb background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-pulse-green/35 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-96 w-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 h-80 w-80 rounded-full bg-lime-100/40 blur-3xl" />
      </div>

      {/* Main glass container */}
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1200px] items-center justify-center rounded-[34px] bg-white/25 shadow-[0_30px_90px_rgba(30,30,36,0.14)] backdrop-blur-2xl px-4 py-8">

        {step === "quiz" ? (
          /* Step 1: Onboarding Quiz Wizard */
          <div className="w-full max-w-lg">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <Link to="/" aria-label="Pulse home">
                <img
                  alt=""
                  className="h-11 w-11 rounded-2xl object-contain shadow-pulse transition hover:scale-105"
                  src={pulseLogo}
                />
              </Link>
              <div>
                <p className="text-xl font-normal tracking-tight">Pulse Onboarding</p>
                <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-pulse-muted">
                  Personal Health memory Baseline
                </p>
              </div>
            </div>

            {/* Quiz Card */}
            <div className="rounded-[24px] border border-pulse-line bg-white/60 p-6 shadow-pulse backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-normal text-pulse-muted mb-2">
                <span>ONBOARDING PROFILE</span>
                <span>Question {currentQuizIdx + 1} of {quizQuestions.length}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-pulse-line rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-pulse-green transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Question Text */}
              <h2 className="text-lg font-normal text-pulse-ink mb-5 min-h-[50px] leading-snug">
                {quizQuestions[currentQuizIdx].question}
              </h2>

              {/* Options Stack */}
              <div className="space-y-2.5 mb-6">
                {quizQuestions[currentQuizIdx].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectQuizOption(opt)}
                    className={[
                      "w-full rounded-xl border p-3.5 text-left text-sm font-normal transition cursor-pointer shadow-sm",
                      selectedAnswer === opt
                        ? "border-pulse-ink bg-pulse-mint/20 text-pulse-ink"
                        : "border-pulse-line bg-white/40 text-pulse-ink hover:border-pulse-ink/30 hover:bg-white/60"
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Footer navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-pulse-line/60">
                <button
                  onClick={() => currentQuizIdx > 0 && setCurrentQuizIdx(currentQuizIdx - 1)}
                  disabled={currentQuizIdx === 0}
                  className="flex items-center gap-1 text-xs font-normal text-pulse-muted hover:text-pulse-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                {currentQuizIdx < quizQuestions.length - 1 ? (
                  <button
                    onClick={() => quizAnswers[currentQuizIdx] && setCurrentQuizIdx(currentQuizIdx + 1)}
                    disabled={!quizAnswers[currentQuizIdx]}
                    className="flex items-center gap-1 text-xs font-normal text-pulse-ink hover:text-pulse-ink/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={isSavingQuiz || quizAnswers.some(a => !a)}
                    className="flex items-center gap-1.5 rounded-full bg-pulse-ink text-white px-4 py-2 text-xs font-normal hover:bg-pulse-ink/80 disabled:opacity-30 cursor-pointer shadow-pulse"
                  >
                    {isSavingQuiz ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving to Cognee...
                      </>
                    ) : (
                      <>
                        Save &amp; Continue
                        <CheckCircle className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Refactored Horizontal Upload Dashboard Layout */
          <div className="w-full max-w-5xl">
            {/* Header info */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <Link to="/" aria-label="Pulse home">
                <img
                  alt=""
                  className="h-11 w-11 rounded-2xl object-contain shadow-pulse transition hover:scale-105"
                  src={pulseLogo}
                />
              </Link>
              <div>
                <p className="text-xl font-normal tracking-tight">Onboarding complete</p>
                <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-pulse-muted">
                  Personal Memory setup &middot; Document Upload
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Left Column: Patient Details */}
              <div className="rounded-[24px] border border-pulse-line bg-white/60 p-6 shadow-pulse backdrop-blur-sm space-y-4">
                <div>
                  <p className="text-xs font-normal uppercase tracking-[0.12em] text-pulse-muted mb-1">
                    Step 2A
                  </p>
                  <h2 className="text-lg font-normal text-pulse-ink">
                    Patient Profile
                  </h2>
                  <p className="text-xs text-pulse-muted">
                    Log basic metrics to personalize your memory assistant context.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Patient Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Anderson"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2.5 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Current Medications</label>
                    <input
                      type="text"
                      placeholder="Amlodipine, Metformin..."
                      value={patientMedications}
                      onChange={(e) => setPatientMedications(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Habits & PDF Drag and Drop */}
              <div className="rounded-[24px] border border-pulse-line bg-white/60 p-6 shadow-pulse backdrop-blur-sm space-y-4">
                <div>
                  <p className="text-xs font-normal uppercase tracking-[0.12em] text-pulse-muted mb-1">
                    Step 2B
                  </p>
                  <h2 className="text-lg font-normal text-pulse-ink">
                    Wearable Files &amp; Habits
                  </h2>
                  <p className="text-xs text-pulse-muted">
                    Sync daily conditions and drop your clinical PDF summary records.
                  </p>
                </div>

                {/* Habits Form Inputs */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Seattle, WA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Water Intake</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Liters"
                      value={waterIntake}
                      onChange={(e) => setWaterIntake(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Avg Sleep</label>
                    <input
                      type="text"
                      placeholder="e.g. 6 hours"
                      value={sleepAmount}
                      onChange={(e) => setSleepAmount(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-normal uppercase tracking-wider text-pulse-muted block mb-1">Daily Habits</label>
                    <input
                      type="text"
                      placeholder="drinking coffee..."
                      value={otherHabits}
                      onChange={(e) => setOtherHabits(e.target.value)}
                      className="w-full rounded-lg border border-pulse-line bg-white px-3 py-2 text-sm text-pulse-ink placeholder:text-pulse-muted/80 focus:border-pulse-green focus:outline-none"
                    />
                  </div>
                </div>

                {/* Drag and Drop */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={[
                    "relative flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed p-6 text-center transition-all duration-200",
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
                      <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-pulse-green shadow-pulse">
                        <FileText className="h-4.5 w-4.5 text-pulse-ink" />
                      </div>
                      <p className="max-w-[200px] truncate text-xs font-normal text-pulse-ink">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-pulse-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB &middot; PDF
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-pulse-surface">
                        <UploadCloud className="h-4.5 w-4.5 text-pulse-muted" />
                      </div>
                      <p className="text-xs font-normal text-pulse-ink">
                        {isDragging ? "Drop it here" : "Click or drag & drop"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-pulse-muted">PDF files only</p>
                    </>
                  )}
                </div>

                {/* Submit button */}
                <button
                  id="upload-submit-btn"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={[
                    "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-normal transition-all duration-200 cursor-pointer shadow-pulse",
                    !file
                      ? "bg-pulse-surface text-pulse-muted cursor-not-allowed"
                      : isUploading
                        ? "bg-pulse-ink/80 text-white cursor-wait"
                        : "bg-pulse-ink text-white hover:bg-pulse-ink/80",
                  ].join(" ")}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ingesting Knowledge Graph...
                    </>
                  ) : file ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Build Memory &amp; Open Dashboard
                    </>
                  ) : (
                    "Select a document to continue"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/20 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/60 transition duration-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Resetting memory...
                    </>
                  ) : (
                    "Reset / Clear Existing Cognee Memory Graph"
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}


