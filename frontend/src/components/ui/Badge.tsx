import type { ReactNode } from "react";

type BadgeTone = "green" | "blue" | "amber" | "rose" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  green: "bg-pulse-green text-pulse-ink",
  blue: "bg-white/80 text-pulse-ink ring-1 ring-pulse-line",
  amber: "bg-white/80 text-pulse-ink ring-1 ring-pulse-line",
  rose: "bg-white/80 text-pulse-ink ring-1 ring-pulse-line",
  neutral: "bg-white/80 text-pulse-ink ring-1 ring-pulse-line",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
