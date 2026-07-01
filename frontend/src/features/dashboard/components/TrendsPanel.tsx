import React, { useEffect, useState } from "react";
import { DownloadCloud, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import type { TrendSummary } from "../types/dashboard.types";

interface TrendsPanelProps {
  trends: TrendSummary;
}

interface InsightsData {
  description: string;
  trends: { label: string; value: number; text: string }[];
}

export function TrendsPanel({ trends: defaultTrends }: TrendsPanelProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pulse_insights");
    if (stored) {
      try {
        setInsights(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse insights", err);
      }
    }
  }, []);

  const displayData = {
    description: insights?.description || defaultTrends?.insight || "No description available.",
    trends: insights?.trends || defaultTrends?.temporalTrends?.map((t) => ({
      label: t.label,
      value: t.intensity,
      text: t.value,
    })) || [],
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/v1/insights/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(displayData),
      });
      if (!response.ok) throw new Error("PDF generation failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "insights.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(216,251,100,0.14))]">
      <CardHeader 
        title="Temporal Trends" 
        eyebrow="Seasonal view" 
        action={
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-full border border-pulse-line bg-white/80 px-3 py-1.5 text-xs font-semibold text-pulse-ink shadow-sm transition-all hover:bg-pulse-green/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <DownloadCloud className="h-3 w-3" />}
            PDF
          </button>
        }
      />
      <CardBody className="space-y-3">
        <p className="text-sm leading-5 text-pulse-muted">{displayData.description}</p>
        <div className="space-y-2">
          {displayData.trends.map((trend, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_60px] items-center gap-3">
              <span className="text-xs font-semibold">{trend.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-pulse-green"
                  style={{ width: `${Math.min(100, Math.max(0, trend.value))}%` }}
                />
              </div>
              <span className="text-right text-xs text-pulse-muted">{trend.text}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
