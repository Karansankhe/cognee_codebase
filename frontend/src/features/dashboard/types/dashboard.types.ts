export type DataSourceStatus = "connected" | "syncing" | "attention";

export type TimelineEntryType =
  | "symptom"
  | "treatment"
  | "wearable"
  | "lab"
  | "medication";

export type GraphNodeType =
  | "symptom"
  | "trigger"
  | "lifestyle"
  | "treatment"
  | "outcome";

export type LanguageCode =
  | "AR"
  | "BN"
  | "DE"
  | "EN"
  | "ES"
  | "FR"
  | "HI"
  | "ID"
  | "IT"
  | "JA"
  | "KO"
  | "MR"
  | "PA"
  | "PT"
  | "RU"
  | "SW"
  | "TA"
  | "TE"
  | "TR"
  | "UR"
  | "VI"
  | "ZH";

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  preferredLanguage: "English" | "Hindi" | "Marathi";
  activeConditions: string[];
  riskNote: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  status: DataSourceStatus;
  lastSyncedAt: string;
}

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  title: string;
  description: string;
  languageCode: LanguageCode;
  occurredAt: string;
  source: string;
}

export interface TriggerPattern {
  id: string;
  symptom: string;
  summary: string;
  consistency: {
    matchedEpisodes: number;
    totalEpisodes: number;
    score: number;
  };
  treatmentEffectiveness: {
    helpedAttempts: number;
    totalAttempts: number;
    score: number;
  };
  triggerCandidates: string[];
  treatmentMemory: string;
  updatedAt: string;
}

export interface EvidenceCitation {
  id: string;
  date: string;
  source: string;
  event: string;
  relationship: "supports" | "improved" | "contradicts";
}

export interface MemoryGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
}

export interface MemoryGraphEdge {
  confidence?: number;
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface GraphInsight {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface SystemEvaluation {
  accuracy: number;
  benchmarkSize: number;
  falsePositiveRate: number;
  lastRunAt: string;
  precision: number;
  recall: number;
  truePositiveRate: number;
}

export interface TemporalTrend {
  id: string;
  label: string;
  value: string;
  intensity: number;
}

export interface TrendSummary {
  insight: string;
  temporalTrends: TemporalTrend[];
}

export interface WearableMetric {
  id: string;
  label: string;
  value: string;
  status: string;
}

export interface WearableSummary {
  syncCadence: string;
  consentScope: string[];
  metrics: WearableMetric[];
}

export interface DashboardData {
  patient: PatientProfile;
  dataSources: DataSource[];
  wearableSummary: WearableSummary;
  timeline: TimelineEntry[];
  activePattern: TriggerPattern;
  citations: EvidenceCitation[];
  graph: {
    nodes: MemoryGraphNode[];
    edges: MemoryGraphEdge[];
    insights: GraphInsight[];
  };
  systemEvaluation: SystemEvaluation;
  trends: TrendSummary;
}
