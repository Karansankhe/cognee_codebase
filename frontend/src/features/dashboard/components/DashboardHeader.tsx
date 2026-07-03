import { Badge } from "../../../components/ui/Badge";

interface DashboardHeaderProps {
  // Keeping optional props to avoid breaking other files if needed
  language?: string;
  onLanguageChange?: (language: string) => void;
}

export function DashboardHeader({}: DashboardHeaderProps) {
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
    </header>
  );
}
