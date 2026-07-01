import { Badge } from "../../../components/ui/Badge";

const languages = [
  "English",
  "Mandarin Chinese",
  "Hindi",
  "Spanish",
  "French",
  "Arabic",
  "Bengali",
  "Portuguese",
  "Russian",
  "Urdu",
  "Indonesian",
  "German",
  "Japanese",
  "Swahili",
  "Marathi",
  "Telugu",
  "Turkish",
  "Tamil",
  "Vietnamese",
  "Korean",
  "Italian",
  "Punjabi",
];

interface DashboardHeaderProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

export function DashboardHeader({
  language,
  onLanguageChange,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-3 px-4 pb-1 pt-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="mb-1.5 flex flex-wrap gap-2">
          <Badge tone="green">Wearable intelligence</Badge>
          <Badge tone="neutral">Consent driven</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Pulse Health Dashboard
        </h1>
      </div>
      <label className="flex w-full max-w-xs flex-col gap-1 lg:items-end">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">
          Input language
        </span>
        <select
          className="w-full rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium outline-none transition hover:border-pulse-green focus:border-pulse-green lg:w-56"
          onChange={(event) => onLanguageChange(event.target.value)}
          value={language}
        >
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
