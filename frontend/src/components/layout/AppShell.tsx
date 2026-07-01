import type { ReactNode } from "react";

interface AppShellProps {
  activePage?: string;
  children: ReactNode;
  onNavigate?: (page: string) => void;
}

const navItems = [
  "Dashboard",
  "Log",
  "Graph",
  "Trends",
  "Summary",
  "Share",
  "Data controls",
];

export function AppShell({
  activePage = "Dashboard",
  children,
  onNavigate,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-pulse-canvas p-3 font-sans text-pulse-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-pulse-green/35 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-96 w-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 h-80 w-80 rounded-full bg-lime-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1760px] rounded-[34px] bg-white/25 shadow-[0_30px_90px_rgba(30,30,36,0.14)] backdrop-blur-2xl">
        <aside
          className="peer/sidebar group/sidebar relative z-20 hidden w-[72px] shrink-0 overflow-hidden px-3 py-5 transition-all duration-300 hover:w-56 lg:block"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pulse-ink text-base font-black text-white">
              P
            </div>
            <div className="w-36 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              <p className="text-lg font-semibold tracking-normal">Pulse</p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-pulse-muted">
                Personal memory
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item}
                className={`flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-medium transition ${
                  item === activePage
                    ? "bg-white text-pulse-ink shadow-sm"
                    : "text-pulse-muted hover:bg-white/60 hover:text-pulse-ink"
                }`}
                onClick={() => onNavigate?.(item)}
                type="button"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item === activePage ? "bg-pulse-ink" : "bg-pulse-muted/40"
                  }`}
                />
                <span className="opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                  {item}
                </span>
              </button>
            ))}
          </nav>

          <div
            className="mt-7 w-48 rounded-[20px] bg-white/70 p-3 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
          >
            <p className="text-sm font-semibold">Live session</p>
            <p className="mt-1 text-xs leading-5 text-pulse-muted">
              Streaming wearable and symptom signals.
            </p>
          </div>
        </aside>

        <div className="pointer-events-none absolute inset-0 z-10 hidden rounded-[34px] bg-white/10 opacity-0 backdrop-blur-sm transition-opacity duration-300 peer-hover/sidebar:opacity-100 lg:block" />
        <div className="relative z-0 min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
