import { Card, CardBody, CardHeader } from "../../../components/ui/Card";

const actions = [
  {
    id: "symptom",
    label: "Log symptom",
    helper: "Add a new symptom note",
    primary: true,
  },
  {
    id: "outcome",
    label: "Add outcome",
    helper: "Record whether treatment helped over following days",
    primary: false,
  },
  {
    id: "summary",
    label: "Generate daily summary",
    helper: "Summarize health signals, symptoms, and treatments",
    primary: false,
  },
  {
    id: "share",
    label: "Review consent",
    helper: "Check what health data Pulse can use",
    primary: false,
  },
];

interface QuickActionsProps {
  onAddOutcome: () => void;
  onLogSymptom: () => void;
}

export function QuickActions({ onAddOutcome, onLogSymptom }: QuickActionsProps) {
  const handleAction = (actionId: string) => {
    if (actionId === "symptom") {
      onLogSymptom();
      return;
    }

    if (actionId === "outcome") {
      onAddOutcome();
    }
  };

  return (
    <Card className="bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(216,251,100,0.16))]">
      <CardHeader title="Quick Actions" eyebrow="Logging workflow" />
      <CardBody>
        <div className="grid gap-2 md:grid-cols-4">
          {actions.map((action) => (
            <button
              key={action.id}
              className={`rounded-[20px] px-4 py-3 text-left transition ${
                action.primary
                  ? "bg-pulse-ink text-white hover:bg-black"
                  : "bg-white text-pulse-ink hover:bg-pulse-mint"
              }`}
              onClick={() => handleAction(action.id)}
              type="button"
            >
              <span className="block text-sm font-semibold leading-5">{action.label}</span>
              <span
                className={`mt-1 block line-clamp-2 text-xs leading-4 ${
                  action.primary ? "text-white/80" : "text-pulse-muted"
                }`}
              >
                {action.helper}
              </span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
