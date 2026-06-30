import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-[22px] border border-white/70 bg-white/88 shadow-pulse backdrop-blur transition duration-300 hover:border-pulse-green/80 hover:shadow-[0_22px_70px_rgba(216,251,100,0.42)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, eyebrow, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4">
      <div>
        {eyebrow ? (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-pulse-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-normal text-pulse-ink">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
