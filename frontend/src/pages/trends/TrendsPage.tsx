import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Brain, RefreshCw, AlertCircle, Info, Flame, Navigation, Zap } from "lucide-react";
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
      const response = await fetch("/api/v1/wearable/sync", {
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

          <div className={`grid grid-cols-1 gap-4 xl:grid-cols-3 ${!hasData ? "opacity-30 blur-[1px]" : ""}`}>
            <Card className="pulse-rise-delay overflow-hidden bg-white/88 xl:col-span-2">
              <CardHeader title="Heart Rate Over Time" eyebrow="Wearable Frequency" />
              <CardBody className="p-5">
                <div className="relative h-52 overflow-hidden rounded-[24px] border border-pulse-line/70 bg-gradient-to-b from-pulse-mint/45 via-white to-white px-1 pt-4 shadow-inner">
                  <div className="absolute left-6 top-5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-pulse-muted shadow-sm">
                    live pulse stream
                  </div>
                  <div className="absolute inset-x-0 top-1/2 h-px bg-pulse-line/60" />
                  <div className="absolute inset-x-0 bottom-12 h-px bg-pulse-line/40" />
                  {hasData ? (
                    <svg className="relative h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient-hr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d8fb64" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#d8fb64" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area Path */}
                      <path
                        d={`M 0 100 L ${hrPoints} L 100 100 Z`}
                        fill="url(#gradient-hr)"
                        className="animate-pulse"
                      />
                      {/* Line Path */}
                      <polyline
                        fill="none"
                        stroke="#12353c"
                        strokeWidth="2.25"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={hrPoints}
                        className="drop-shadow-[0_8px_12px_rgba(18,53,60,0.18)]"
                      />
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-pulse-muted">
                      Line chart area placeholder
                    </div>
                  )}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-pulse-muted">
                  <span>Log Start</span>
                  <span>Average: {hasData ? Math.round(metrics!.reduce((acc, m) => acc + m.HeartRate, 0) / metrics!.length) : 0} BPM</span>
                  <span>Latest Log</span>
                </div>
              </CardBody>
            </Card>

            <Card className="pulse-rise-delay bg-[#fff6cc]/95">
              <CardHeader title="Stress Levels breakdown" eyebrow="Symptom Indicator" />
              <CardBody className="flex h-[258px] flex-col justify-end p-5">
                <div className="grid flex-1 grid-cols-3 items-end gap-3 rounded-[22px] bg-white/40 p-4">
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-xs font-black text-pulse-ink">{hasData ? stressLow : 0}</span>
                    <div
                      className="w-full rounded-t-xl bg-pulse-green shadow-[0_12px_30px_rgba(216,251,100,0.35)] transition-all duration-700"
                      style={{ height: hasData ? `${Math.max((stressLow / metrics!.length) * 150, 24)}px` : "24px" }}
                    />
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-pulse-muted">Low</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-xs font-black text-pulse-ink">{hasData ? stressFair : 0}</span>
                    <div
                      className="w-full rounded-t-xl bg-pulse-mint shadow-[0_12px_30px_rgba(238,251,208,0.6)] transition-all duration-700"
                      style={{ height: hasData ? `${Math.max((stressFair / metrics!.length) * 150, 24)}px` : "24px" }}
                    />
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-pulse-muted">Fair</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-xs font-black text-pulse-ink">{hasData ? stressHigh : 0}</span>
                    <div
                      className="w-full rounded-t-xl bg-red-200 shadow-[0_12px_30px_rgba(254,202,202,0.55)] transition-all duration-700"
                      style={{ height: hasData ? `${Math.max((stressHigh / metrics!.length) * 150, 24)}px` : "24px" }}
                    />
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-pulse-muted">High</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="pulse-rise bg-[#f2f1ff]/95">
              <CardHeader title="Sleep Quality Score" eyebrow="Recovery Metrics" />
              <CardBody className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="group flex items-center gap-3 rounded-[18px] bg-white/75 p-3 shadow-sm transition hover:-translate-y-1">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-pulse-line" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-pulse-green transition-all duration-500" strokeWidth="3" strokeDasharray={`${avgSleepScore}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="text-xs font-black text-pulse-ink">{avgSleepScore}%</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-pulse-ink">This Sync</p>
                      <p className="text-[10px] text-pulse-muted">Recovery rating</p>
                    </div>
                  </div>
                  <div className="group flex items-center gap-3 rounded-[18px] bg-white/75 p-3 shadow-sm transition hover:-translate-y-1">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-pulse-line" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-pulse-muted transition-all duration-500" strokeWidth="3" strokeDasharray={`${prevSleepScore}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="text-xs font-black text-pulse-ink">{prevSleepScore}%</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-pulse-ink">Prior Log</p>
                      <p className="text-[10px] text-pulse-muted">Comparative baseline</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="pulse-rise bg-[#e9f9d9]/95">
              <CardHeader title="SpO2 Stability" eyebrow="Oxygen Levels" />
              <CardBody className="flex min-h-[144px] items-center gap-5 p-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-white/80" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-pulse-green transition-all duration-500" strokeWidth="2.5" strokeDasharray={`${spo2Percentage}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="text-base font-black text-pulse-ink">{avgSpO2}%</span>
                </div>
                <div>
                  <p className="text-sm font-black text-pulse-ink">Oxygen Saturation</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-pulse-muted">
                    Stable respiratory signal from the latest wearable sync.
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-white/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-pulse-muted">
                    {spo2Percentage >= 95 ? "Normal range" : "Review"}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card className="pulse-rise bg-white/88">
              <CardHeader title="Activity Distribution" eyebrow="Key Drivers" />
              <CardBody className="flex min-h-[190px] flex-col justify-around gap-4 p-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Active Zones</span>
                    <span className="text-pulse-muted">{avgActiveMins} min / 90</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-pulse-line">
                    <div className="pulse-meter h-full rounded-full bg-pulse-green" style={{ width: `${activePercentage}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Sleep Duration</span>
                    <span className="text-pulse-muted">{avgSleepDur} hrs / 8.0</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-pulse-line">
                    <div className="h-full rounded-full bg-pulse-ink transition-all duration-700" style={{ width: `${sleepPercentage}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Average Stress</span>
                    <span className="text-pulse-muted">{avgStress}% score</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-pulse-line">
                    <div className="h-full rounded-full bg-orange-300 transition-all duration-700" style={{ width: `${stressPercentage}%` }} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="pulse-rise-delay bg-white/88 xl:col-span-2">
              <CardHeader title="Daily Summary Statistics" eyebrow="Activity Totals" />
              <CardBody className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[18px] bg-[#f7f7f8] p-4 shadow-sm transition hover:-translate-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Steps</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Navigation className="h-4.5 w-4.5 text-pulse-ink rotate-45" />
                      <span className="text-xl font-black text-pulse-ink">{avgSteps.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="rounded-[18px] bg-[#fff6cc] p-4 shadow-sm transition hover:-translate-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Burn Rate</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="h-4.5 w-4.5 text-orange-400" />
                      <span className="text-xl font-black text-pulse-ink">{avgCalories} kcal</span>
                    </div>
                  </div>

                  <div className="rounded-[18px] bg-[#f2f1ff] p-4 shadow-sm transition hover:-translate-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Distance</span>
                    <span className="text-xl font-black text-pulse-ink mt-1 block">{totalDistance} km</span>
                  </div>

                  <div className="rounded-[18px] bg-[#e9f9d9] p-4 shadow-sm transition hover:-translate-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Active Zones</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-4.5 w-4.5 text-pulse-green" />
                      <span className="text-xl font-black text-pulse-ink">{avgActiveMins} min</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-pulse-line/60 pt-3 text-xs text-pulse-muted">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Calculated from 100 simulated log points.
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
