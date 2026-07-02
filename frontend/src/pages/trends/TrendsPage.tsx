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
      <main className="px-4 pb-5 pt-3 sm:px-6 h-[calc(100vh-2rem)] flex flex-col overflow-y-auto">
        
        {/* Header Dashboard Banner */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-pulse-line/60 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-pulse-ink tracking-tight">TELEHEALTH</span>
              <span className="rounded-full bg-pulse-green px-2 py-0.5 text-[10px] font-bold text-pulse-ink">
                LIVE
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pulse-muted">
              Program Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-full border border-pulse-line bg-white/80 px-4 py-2 text-xs font-semibold text-pulse-ink shadow-sm transition hover:border-pulse-green hover:bg-pulse-mint/25 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Wearable..." : "Sync Wearable"}
            </button>
          </div>
        </div>

        {/* Blank state overlay wrapper */}
        <div className="relative flex-1 min-h-0">
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

          {/* Grid Layout of the Dashboard */}
          <div className={`grid gap-5 grid-cols-1 lg:grid-cols-3 ${!hasData ? "opacity-30 blur-[1px]" : ""}`}>
            
            {/* 1. Heart Rate Volume (Line Chart) */}
            <Card className="lg:col-span-2 bg-white/60">
              <CardHeader title="Heart Rate Over Time" eyebrow="Wearable Frequency" />
              <CardBody className="p-5">
                <div className="h-44 w-full flex items-end">
                  {hasData ? (
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
                      />
                      {/* Line Path */}
                      <polyline
                        fill="none"
                        stroke="#12353c"
                        strokeWidth="1.8"
                        points={hrPoints}
                      />
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-pulse-muted">
                      Line chart area placeholder
                    </div>
                  )}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-semibold text-pulse-muted uppercase tracking-wider">
                  <span>Log Start</span>
                  <span>Average: {hasData ? Math.round(metrics!.reduce((acc, m) => acc + m.HeartRate, 0) / metrics!.length) : 0} BPM</span>
                  <span>Latest Log</span>
                </div>
              </CardBody>
            </Card>

            {/* 2. Stress Quality breakdown (Bar Chart) */}
            <Card className="bg-white/60">
              <CardHeader title="Stress Levels breakdown" eyebrow="Symptom Indicator" />
              <CardBody className="p-5 flex flex-col justify-between h-56">
                <div className="flex-1 flex items-end justify-around gap-2.5 pb-2">
                  {/* Low stress bar */}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xs font-semibold text-pulse-ink mb-1">{hasData ? stressLow : 0}</span>
                    <div 
                      className="w-full rounded-t-lg bg-pulse-green transition-all duration-500" 
                      style={{ height: hasData ? `${Math.max((stressLow / metrics!.length) * 120, 10)}px` : "15px" }} 
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-pulse-muted mt-2">Low</span>
                  </div>
                  {/* Fair stress bar */}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xs font-semibold text-pulse-ink mb-1">{hasData ? stressFair : 0}</span>
                    <div 
                      className="w-full rounded-t-lg bg-pulse-mint transition-all duration-500" 
                      style={{ height: hasData ? `${Math.max((stressFair / metrics!.length) * 120, 10)}px` : "15px" }} 
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-pulse-muted mt-2">Fair</span>
                  </div>
                  {/* High stress bar */}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xs font-semibold text-pulse-ink mb-1">{hasData ? stressHigh : 0}</span>
                    <div 
                      className="w-full rounded-t-lg bg-red-200 transition-all duration-500" 
                      style={{ height: hasData ? `${Math.max((stressHigh / metrics!.length) * 120, 10)}px` : "15px" }} 
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-pulse-muted mt-2">High</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 3. Sleep Score Ring Gauges */}
            <Card className="bg-white/60">
              <CardHeader title="Sleep Quality Score" eyebrow="Recovery Metrics" />
              <CardBody className="p-5 flex flex-col justify-around h-60">
                <div className="flex items-center justify-between gap-4">
                  {/* Gauge 1 */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 flex items-center justify-center">
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
                  {/* Gauge 2 */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 flex items-center justify-center">
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

            {/* 4. Active breakdowns (Horizontal progress bars) */}
            <Card className="bg-white/60">
              <CardHeader title="Activity Distribution" eyebrow="Key Drivers" />
              <CardBody className="p-5 flex flex-col justify-around h-60 gap-4">
                {/* Progress 1 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Active Zones</span>
                    <span className="text-pulse-muted">{avgActiveMins} min / 90</span>
                  </div>
                  <div className="h-2 w-full bg-pulse-line rounded-full overflow-hidden">
                    <div className="h-full bg-pulse-green" style={{ width: `${activePercentage}%` }} />
                  </div>
                </div>
                {/* Progress 2 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Sleep Duration</span>
                    <span className="text-pulse-muted">{avgSleepDur} hrs / 8.0</span>
                  </div>
                  <div className="h-2 w-full bg-pulse-line rounded-full overflow-hidden">
                    <div className="h-full bg-pulse-ink" style={{ width: `${sleepPercentage}%` }} />
                  </div>
                </div>
                {/* Progress 3 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pulse-ink">Average Stress</span>
                    <span className="text-pulse-muted">{avgStress}% score</span>
                  </div>
                  <div className="h-2 w-full bg-pulse-line rounded-full overflow-hidden">
                    <div className="h-full bg-orange-300" style={{ width: `${stressPercentage}%` }} />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 5. Provider Productivity (Overview numbers) */}
            <Card className="bg-white/60">
              <CardHeader title="Daily Summary Statistics" eyebrow="Activity Totals" />
              <CardBody className="p-5 flex flex-col justify-between h-60">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Steps</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Navigation className="h-4.5 w-4.5 text-pulse-ink rotate-45" />
                      <span className="text-xl font-black text-pulse-ink">{avgSteps.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Burn Rate</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="h-4.5 w-4.5 text-orange-400" />
                      <span className="text-xl font-black text-pulse-ink">{avgCalories} kcal</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Distance</span>
                    <span className="text-xl font-black text-pulse-ink mt-1 block">{totalDistance} km</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-muted block">Active Zones</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-4.5 w-4.5 text-pulse-green" />
                      <span className="text-xl font-black text-pulse-ink">{avgActiveMins} min</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-pulse-line/60 pt-3 flex items-center gap-2 text-xs text-pulse-muted">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Calculated from 100 simulated log points.
                </div>
              </CardBody>
            </Card>

            {/* 6. SpO2 Circle Gauge */}
            <Card className="bg-white/60">
              <CardHeader title="SpO2 Stability" eyebrow="Oxygen Levels" />
              <CardBody className="p-5 flex flex-col items-center justify-center h-60">
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-pulse-line" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-pulse-green transition-all duration-500" strokeWidth="2.5" strokeDasharray={`${spo2Percentage}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="text-lg font-black text-pulse-ink">{avgSpO2}%</span>
                </div>
                <span className="text-xs font-semibold text-pulse-muted mt-3 text-center">
                  Oxygen Saturation Level
                </span>
              </CardBody>
            </Card>

          </div>
        </div>

      </main>
    </AppShell>
  );
}
