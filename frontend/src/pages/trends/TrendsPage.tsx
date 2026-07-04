import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Brain, RefreshCw, AlertCircle, Info, Flame, Navigation, Zap } from "lucide-react";
import { apiUrl } from "../../lib/api";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";

interface MetricRow {
  HeartRate: number;
  RestingHeartRate: number;
  Steps: number;
  CaloriesBurned: number;
  DistanceTraveled: number;
  ActiveZoneMinutes: number;
  SleepDuration: number;
  SleepScore: number;
  SpO2: number;
  StressScore: number;
}

export function TrendsPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricRow[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("pulse_synced_metrics");
    if (cached) {
      try {
        setMetrics(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleNavigate = (page: string) => {
    if (page === "Dashboard") {
      navigate("/dashboard");
    } else if (page === "Graph") {
      navigate("/graph");
    } else if (page === "Trends") {
      navigate("/trends");
    } else if (page === "Summary") {
      navigate("/summary");
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(apiUrl("/api/v1/wearable/sync"), {
        method: "POST",
      });
      if (!response.ok) throw new Error("Sync failed");
      const result = await response.json();

      // Save raw metrics
      localStorage.setItem("pulse_synced_metrics", JSON.stringify(result.metrics));
      setMetrics(result.metrics);

      // Save pattern back in case they return to dashboard
      const cachedDashboard = localStorage.getItem("pulse_insights");
      if (cachedDashboard) {
        try {
          const dashboardObj = JSON.parse(cachedDashboard);
          dashboardObj.activePattern = result.pattern;
          localStorage.setItem("pulse_insights", JSON.stringify(dashboardObj));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync wearable data");
    } finally {
      setIsSyncingWarmup();
    }
  };

  const setIsSyncingWarmup = () => {
    setTimeout(() => setIsSyncing(false), 800);
  };

  // Calculations for charts
  const hasData = metrics && metrics.length > 0;

  // 1. Heart rate values for line chart
  const hrData = hasData ? metrics!.map(m => m.HeartRate).slice(0, 15) : [];
  const maxHR = hrData.length > 0 ? Math.max(...hrData) : 100;
  const minHR = hrData.length > 0 ? Math.min(...hrData) : 0;
  const hrPoints = hrData.map((val, idx) => {
    const x = (idx / (hrData.length - 1)) * 100;
    const y = 80 - ((val - minHR) / (maxHR - minHR || 1)) * 60; // scale between 20 and 80 y coords
    return `${x},${y}`;
  }).join(" ");

  // 2. Stress score breakdown (Bar chart: High, Fair, Low)
  let stressHigh = 0; // > 70
  let stressFair = 0; // 40-70
  let stressLow = 0;  // < 40
  if (hasData) {
    metrics!.forEach(m => {
      if (m.StressScore > 70) stressHigh++;
      else if (m.StressScore >= 40) stressFair++;
      else stressLow++;
    });
  }

  // 3. Sleep score ring percentages
  const avgSleepScore = hasData
    ? Math.round(metrics!.reduce((acc, m) => acc + m.SleepScore, 0) / metrics!.length)
    : 0;
  const prevSleepScore = hasData ? Math.round(avgSleepScore * 0.95) : 0; // mock comparative score

  // 4. Activity breakdowns (Horizontal bars)
  const avgActiveMins = hasData
    ? Math.round(metrics!.reduce((acc, m) => acc + m.ActiveZoneMinutes, 0) / metrics!.length)
    : 0;
  const activePercentage = Math.min(Math.round((avgActiveMins / 90) * 100), 100);

  const avgSleepDur = hasData
    ? (metrics!.reduce((acc, m) => acc + m.SleepDuration, 0) / metrics!.length).toFixed(1)
    : "0.0";
  const sleepPercentage = Math.min(Math.round((parseFloat(avgSleepDur) / 8.0) * 100), 100);

  const avgStress = hasData
    ? Math.round(metrics!.reduce((acc, m) => acc + m.StressScore, 0) / metrics!.length)
    : 0;
  const stressPercentage = Math.min(Math.round((avgStress / 100) * 100), 100);

  // 5. Provider productivity (Metrics metrics overview)
  const avgSteps = hasData
    ? Math.round(metrics!.reduce((acc, m) => acc + m.Steps, 0) / metrics!.length)
    : 0;
  const avgCalories = hasData
    ? Math.round(metrics!.reduce((acc, m) => acc + m.CaloriesBurned, 0) / metrics!.length)
    : 0;
  const totalDistance = hasData
    ? (metrics!.reduce((acc, m) => acc + m.DistanceTraveled, 0) / metrics!.length).toFixed(1)
    : "0.0";

  // 6. SpO2 ring gauge
  const avgSpO2 = hasData
    ? (metrics!.reduce((acc, m) => acc + m.SpO2, 0) / metrics!.length).toFixed(1)
    : "0.0";
  const spo2Percentage = hasData ? Math.round(parseFloat(avgSpO2)) : 0;

  return (
    <AppShell activePage="Trends" onNavigate={handleNavigate}>
      <main className="flex h-[calc(100vh-2rem)] flex-col overflow-y-auto px-4 pb-5 pt-3 sm:px-6">
        <div className="pulse-rise mb-4 overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(20,20,24,0.1)] backdrop-blur">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f7f7f8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-pulse-muted">
                <Brain className="h-3.5 w-3.5 text-[#7f7cff]" />
                Trends dashboard
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black leading-none tracking-normal text-pulse-ink">
                  Health Trends
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse-green px-3 py-1.5 text-[10px] font-black text-pulse-ink shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-pulse-ink animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-pulse-muted">
                Recovery, oxygen, stress, and activity signals shaped into one
                scan-friendly Pulse view.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              {[
                { label: "Logs", value: hasData ? `${metrics!.length}` : "0", tone: "bg-[#f2f1ff]" },
                { label: "Avg HR", value: `${hasData ? Math.round(metrics!.reduce((acc, m) => acc + m.HeartRate, 0) / metrics!.length) : 0}`, tone: "bg-[#e9f9d9]" },
                { label: "SpO2", value: `${avgSpO2}%`, tone: "bg-[#fff6cc]" },
              ].map((stat) => (
                <div
                  className={`pulse-float-slow rounded-[18px] border border-white/75 px-4 py-2 text-xs font-black shadow-sm ${stat.tone}`}
                  key={stat.label}
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-pulse-muted">{stat.label}</p>
                  <p className="mt-0.5 text-lg leading-none">{stat.value}</p>
                </div>
              ))}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="pulse-sheen flex cursor-pointer items-center gap-2 rounded-full bg-pulse-ink px-5 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Wearable"}
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          {!hasData && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[24px] bg-white/40 backdrop-blur-[6px] border border-dashed border-pulse-line p-6 text-center select-none">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-pulse-mint/30 text-pulse-ink shadow-pulse">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-pulse-ink mb-1">
                No Wearable Data Synchronized
              </h2>
              <p className="text-sm text-pulse-muted max-w-sm mb-5 leading-relaxed">
                Before visualizing health trends, sync your wearable parameters from your local memory bank.
              </p>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 rounded-full bg-pulse-ink text-white px-5 py-3 text-sm font-semibold transition hover:bg-pulse-ink/80 cursor-pointer shadow-pulse"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Wearable Data Now
              </button>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-5 lg:grid-cols-3 ${!hasData ? "opacity-30 blur-[1px]" : ""}`}>
            {/* LEFT CARD: Overview of latest Month */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-pulse-line p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-pulse-muted uppercase tracking-wider">Dashboard</h3>
                  <p className="text-xs text-pulse-muted">Overview of latest Month</p>
                </div>
                <div className="flex gap-3 text-xs font-bold text-pulse-muted">
                  <span className="cursor-pointer hover:text-pulse-ink">DAILY</span>
                  <span className="cursor-pointer hover:text-pulse-ink">WEEKLY</span>
                  <span className="cursor-pointer hover:text-pulse-ink text-pulse-ink border-b-2 border-pulse-ink">MONTHLY</span>
                  <span className="cursor-pointer hover:text-pulse-ink">YEARLY</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 my-4">
                <div>
                  <span className="text-3xl font-black tracking-tight text-pulse-ink">{avgCalories ? `${avgCalories.toLocaleString()} kcal` : "6,468 kcal"}</span>
                  <p className="text-[10px] uppercase font-bold text-pulse-muted tracking-wider mt-0.5">Average Energy Burned</p>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-pulse-ink">{avgSteps ? `${avgSteps.toLocaleString()}` : "8,200"}</span>
                  <p className="text-[10px] uppercase font-bold text-pulse-muted tracking-wider mt-0.5">Average Steps Logged</p>
                </div>
                <button className="ml-auto rounded-full bg-purple-600 text-white text-xs font-bold px-4 py-2 hover:bg-purple-700 transition shadow-sm">
                  Last Month Summary
                </button>
              </div>

              {/* Gorgeous Double Area Chart */}
              <div className="relative h-44 w-full my-2 bg-slate-50/50 rounded-xl overflow-hidden px-1">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purple-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="orange-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                  
                  {/* Purple Area Chart (Heart Rate/Energy) */}
                  <path d="M 0 40 C 20 20, 40 30, 60 12 C 80 25, 90 10, 100 35 L 100 40 Z" fill="url(#purple-grad)" />
                  <path d="M 0 40 C 20 20, 40 30, 60 12 C 80 25, 90 10, 100 35 L 100 40 Z" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Orange Area Chart (Steps/Activity) */}
                  <path d="M 0 40 C 25 30, 50 18, 70 30 C 85 24, 95 12, 100 28 L 100 40 Z" fill="url(#orange-grad)" />
                  <path d="M 0 40 C 25 30, 50 18, 70 30 C 85 24, 95 12, 100 28 L 100 40 Z" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[8px] font-black uppercase text-pulse-muted px-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                </div>
              </div>

              {/* Bottom stats row */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center">
                <div>
                  <p className="text-[9px] font-black uppercase text-pulse-muted">Avg Heart Rate</p>
                  <p className="text-sm font-black text-pulse-ink mt-0.5">{hasData ? `${Math.round(metrics!.reduce((acc, m) => acc + m.HeartRate, 0) / metrics!.length)} BPM` : "72 BPM"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-pulse-muted">Sleep Quality</p>
                  <p className="text-sm font-black text-pulse-ink mt-0.5">{avgSleepScore ? `${avgSleepScore}%` : "82%"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-pulse-muted">SpO2 Level</p>
                  <p className="text-sm font-black text-pulse-ink mt-0.5">{avgSpO2 ? `${avgSpO2}%` : "98%"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-pulse-muted">Avg Active Zone</p>
                  <p className="text-sm font-black text-pulse-ink mt-0.5">{avgActiveMins ? `${avgActiveMins} min` : "32 min"}</p>
                </div>
              </div>
            </div>

            {/* RIGHT CARD: Traffic / Distribution */}
            <div className="bg-white rounded-[24px] border border-pulse-line p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-sm font-bold text-pulse-muted uppercase tracking-wider">Health Distribution</h3>
                <p className="text-xs text-pulse-muted">Daily Time Breakdown</p>
              </div>

              {/* concentric ring donut chart */}
              <div className="relative flex items-center justify-center my-6 h-40">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Outer circle - Sleep (55%) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="55 100" strokeDashoffset="0" strokeLinecap="round" />
                  
                  {/* Middle circle - Light Activity (33%) */}
                  <circle cx="18" cy="18" r="12" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="12" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="33 100" strokeDashoffset="-10" strokeLinecap="round" />
                  
                  {/* Inner circle - Active Zone (12%) */}
                  <circle cx="18" cy="18" r="8" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="12 100" strokeDashoffset="-25" strokeLinecap="round" />
                </svg>
                {/* Center orange circle with icon */}
                <div className="absolute h-10 w-10 rounded-full bg-amber-500 shadow-md flex items-center justify-center text-white">
                  <Activity className="h-5 w-5" />
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="flex justify-between text-xs font-bold text-pulse-muted pt-2 border-t border-slate-100">
                <div className="flex flex-col items-center">
                  <span className="text-base text-rose-500">55%</span>
                  <span className="text-[9px] uppercase tracking-wider">Sleep</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base text-blue-500">33%</span>
                  <span className="text-[9px] uppercase tracking-wider">Light Act</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base text-emerald-500">12%</span>
                  <span className="text-[9px] uppercase tracking-wider">Active</span>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: 4 colorful cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Purple */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] p-5 text-white shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="z-10">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Stress Index</p>
                  <p className="text-2xl font-black mt-1">{avgStress ? `${avgStress}%` : "43%"}</p>
                </div>
                <div className="z-10 text-[10px] opacity-75 font-semibold">Jan 01 - Jan 10</div>
                <svg className="absolute right-2 bottom-2 w-20 h-12 opacity-35" viewBox="0 0 100 40">
                  <path d="M0 30 Q25 10 50 25 T100 10" fill="none" stroke="white" strokeWidth="3" />
                </svg>
              </div>

              {/* Card 2: Blue */}
              <div className="bg-gradient-to-br from-blue-500 to-sky-600 rounded-[20px] p-5 text-white shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="z-10">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Steps Count</p>
                  <p className="text-2xl font-black mt-1">{avgSteps ? avgSteps.toLocaleString() : "8,432"}</p>
                </div>
                <div className="z-10 text-[10px] opacity-75 font-semibold">Total Steps</div>
                <svg className="absolute right-2 bottom-2 w-24 h-12 opacity-30" viewBox="0 0 120 40">
                  <path d="M0 20 L20 20 L40 10 L60 30 L80 15 L100 35 L120 20" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Card 3: Teal */}
              <div className="bg-gradient-to-br from-teal-400 to-emerald-500 rounded-[20px] p-5 text-white shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="z-10">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Sleep Rating</p>
                  <p className="text-2xl font-black mt-1">{avgSleepScore ? `${avgSleepScore}/100` : "82/100"}</p>
                </div>
                <div className="z-10 text-[10px] opacity-75 font-semibold">Quality Sleep</div>
                <div className="absolute right-4 bottom-4 flex gap-1 items-end h-12">
                  <div className="w-1.5 bg-white/40 h-4 rounded-t" />
                  <div className="w-1.5 bg-white/60 h-8 rounded-t" />
                  <div className="w-1.5 bg-white h-12 rounded-t" />
                  <div className="w-1.5 bg-white/70 h-6 rounded-t" />
                </div>
              </div>

              {/* Card 4: Orange */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[20px] p-5 text-white shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="z-10">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Active Duration</p>
                  <p className="text-2xl font-black mt-1">{avgActiveMins ? `${avgActiveMins} min` : "432 min"}</p>
                </div>
                <div className="z-10 text-[10px] opacity-75 font-semibold">Jan 01 - Jan 10</div>
                <div className="absolute right-4 bottom-4 flex gap-1 items-end h-10">
                  <div className="w-1 bg-white/30 h-6" />
                  <div className="w-1 bg-white/50 h-8" />
                  <div className="w-1 bg-white h-10" />
                  <div className="w-1 bg-white/70 h-5" />
                  <div className="w-1 bg-white/40 h-3" />
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Recent Activities & Data Table */}
            <div className="bg-white rounded-[24px] border border-pulse-line p-6 shadow-sm min-h-[300px] flex flex-col">
              <h3 className="text-sm font-bold text-pulse-ink uppercase tracking-wider mb-4">Recent Activities</h3>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {[
                  { title: "Symptom Logged", text: "Chest pain episodes recorded", time: "40 Mins Ago", bg: "bg-rose-500" },
                  { title: "Medication Logged", text: "Aspirin 81mg administered", time: "1 day ago", bg: "bg-indigo-500" },
                  { title: "Wearable Synced", text: "Pulse wearable metrics loaded", time: "40 Mins Ago", bg: "bg-emerald-500" },
                  { title: "Memory Updated", text: "Cognee patient graph ingestion complete", time: "1 day ago", bg: "bg-amber-500" }
                ].map((act, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`h-8 w-8 rounded-full ${act.bg} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-pulse-ink leading-none">{act.title}</h4>
                        <span className="text-[9px] text-pulse-muted font-bold leading-none">{act.time}</span>
                      </div>
                      <p className="text-[10px] text-pulse-muted mt-1 leading-snug">{act.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Records table */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-pulse-line p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-pulse-ink uppercase tracking-wider">Clinical Records Status</h3>
                    <p className="text-xs text-pulse-muted">Overview of latest logs</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="border border-pulse-line bg-slate-50 rounded-lg px-3 py-1 text-xs text-pulse-ink outline-none focus:border-pulse-green w-36"
                    />
                    <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      + Add
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-pulse-muted uppercase tracking-wider">
                        <th className="py-2">Log ID</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Source</th>
                        <th className="py-2">Severity</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px] font-semibold text-pulse-ink">
                      {[
                        { id: "12386", type: "Symptom", source: "Wearable Sync", severity: "Moderate", status: "Processed", color: "bg-rose-100 text-rose-700" },
                        { id: "12387", type: "Medication", source: "Manual Input", severity: "81mg", status: "Active", color: "bg-indigo-100 text-indigo-700" },
                        { id: "12388", type: "Outcome", source: "Clinical Diary", severity: "Improved", status: "Flagged", color: "bg-amber-100 text-amber-700" }
                      ].map((row, index) => (
                        <tr key={index}>
                          <td className="py-2.5 font-bold text-pulse-muted">#{row.id}</td>
                          <td className="py-2.5">{row.type}</td>
                          <td className="py-2.5">{row.source}</td>
                          <td className="py-2.5">{row.severity}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-1.5 rounded-full text-[9px] font-bold ${row.color}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
