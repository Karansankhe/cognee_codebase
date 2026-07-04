import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileHeart,
  HeartPulse,
  Lock,
  Play,
  Plus,
  Sparkles,
  Stethoscope,
  UploadCloud,
  Watch,
} from "lucide-react";
import pulseLogo from "../../assets/pulse-logo.png";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
];

const proofStats = [
  { value: "92%", label: "organized" },
  { value: "14d", label: "trend view" },
  { value: "4.8x", label: "faster prep" },
];

const workflow = [
  {
    title: "Build the baseline",
    copy: "Add symptoms, routines, and goals.",
  },
  {
    title: "Ingest real evidence",
    copy: "Upload reports and connect daily signals.",
  },
  {
    title: "Review the graph",
    copy: "Review patterns and export a visit summary.",
  },
];

const signals = [
  { label: "Sleep debt", value: "6.1h", copy: "2 nights below target", tone: "bg-[#f2f1ff]" },
  { label: "Hydration", value: "1.8L", copy: "500ml under baseline", tone: "bg-[#e9f9d9]" },
  { label: "Stress flag", value: "High", copy: "pattern confidence 78%", tone: "bg-[#fff6cc]" },
];

function PulseLogo() {
  return (
    <Link className="group flex items-center gap-3" to="/" aria-label="Pulse home">
      <img
        alt=""
        className="h-9 w-9 rounded-xl object-contain transition group-hover:scale-105"
        src={pulseLogo}
      />
      <span className="text-lg font-normal tracking-normal text-pulse-ink">
        PULSE
      </span>
    </Link>
  );
}

function Waveform() {
  return (
    <svg
      className="absolute left-5 right-5 top-20 h-44 w-[calc(100%-2.5rem)] overflow-visible"
      viewBox="0 0 640 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="pulse-wave pulse-wave-lavender"
        d="M5 128 C56 171 87 143 121 88 C155 33 194 182 238 118 C281 56 311 157 351 120 C394 80 420 92 445 112 C485 144 515 79 554 106 C584 126 604 133 635 111"
      />
      <path
        className="pulse-wave pulse-wave-ink"
        d="M7 170 C42 144 69 138 95 142 C133 149 151 204 196 154 C229 117 232 28 262 23 C301 17 294 103 329 118 C366 135 403 87 442 111 C473 131 485 182 528 159 C569 137 589 139 634 151"
      />
    </svg>
  );
}

function FloatingHero() {
  return (
    <div className="relative min-h-[500px] w-full overflow-hidden rounded-[28px] bg-[#f6f6f7] p-5 shadow-[0_24px_70px_rgba(17,17,17,0.08)] md:min-h-[535px]">
      <div className="absolute inset-y-0 left-[38%] hidden w-px bg-pulse-line/60 md:block" />
      <div className="absolute inset-y-8 left-[58%] hidden w-px bg-pulse-line/50 md:block" />
      <div className="absolute inset-y-16 left-[77%] hidden w-px bg-pulse-line/40 md:block" />
      <div className="absolute left-1/2 top-12 h-[320px] w-[235px] -translate-x-1/2 rounded-[26px] bg-white/72 shadow-inner" />
      <Waveform />

      <div className="pulse-float absolute left-5 top-6 rounded-full bg-white px-4 py-2 text-[11px] font-normal text-pulse-ink shadow-pulse md:left-12">
        5 trigger candidates
      </div>

      <div className="pulse-float-delay absolute right-5 top-16 w-[210px] rounded-[22px] bg-[#9899ff] p-4 text-pulse-ink shadow-[0_22px_55px_rgba(92,92,190,0.23)] sm:right-9">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-normal uppercase">Pattern brief</p>
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/75 text-pulse-ink shadow-pulse transition hover:scale-105"
            type="button"
            aria-label="Play pattern brief"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        </div>
        <h3 className="mt-8 text-base font-normal leading-tight">
          Low sleep may raise risk
        </h3>
        <p className="mt-2 text-xs font-normal">81% confidence</p>
      </div>

      <div className="pulse-float-slow absolute bottom-40 left-5 w-[218px] rounded-[22px] bg-[#aaf0a7] p-4 text-pulse-ink shadow-[0_22px_55px_rgba(71,170,88,0.18)] md:left-12">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
              <Stethoscope className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-normal">Visit summary</p>
              <p className="text-[10px] font-normal text-pulse-muted">
                Ready today
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/55 px-2 py-1 text-[10px] font-normal">
            5:30 PM
          </span>
        </div>
        <p className="mt-8 text-sm font-normal leading-tight">
          Visit timeline ready
        </p>
        <p className="mt-2 text-[11px] font-normal leading-4 text-pulse-muted">
          Records and outcomes included.
        </p>
        <Link
          className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-pulse-ink text-white transition hover:scale-105"
          to="/signup"
          aria-label="Start onboarding"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="pulse-float absolute bottom-40 right-5 rounded-[20px] bg-[#f4f0c9] px-4 py-3 text-pulse-ink shadow-pulse md:right-9">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6" />
          <div>
            <p className="text-xl font-normal leading-none">
              124<span className="text-sm text-pulse-muted">/68</span>
            </p>
            <p className="text-[11px] font-normal">blood pressure</p>
          </div>
        </div>
      </div>

      <div className="pulse-float-delay absolute left-[46%] top-[300px] w-[170px] rounded-[20px] bg-white/90 p-3.5 text-pulse-ink shadow-pulse backdrop-blur sm:left-[50%] md:left-[52%]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-normal uppercase text-pulse-muted">
            Multilingual
          </p>
          <span className="rounded-full bg-[#e9f9d9] px-2 py-1 text-[10px] font-normal">
            12+
          </span>
        </div>
        <p className="mt-2 text-xs font-normal leading-tight">
          Notes in your language.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-normal">
          {["EN", "HI", "ES", "FR"].map((language) => (
            <span
              className="rounded-full border border-pulse-line bg-white px-2 py-1"
              key={language}
            >
              {language}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-28 right-10 hidden items-center md:flex">
        {["AL", "MJ", "NK"].map((initials) => (
          <span
            className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-pulse-ink text-[10px] font-normal text-white"
            key={initials}
          >
            {initials}
          </span>
        ))}
        <button
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full bg-pulse-ink text-white transition hover:scale-105"
          type="button"
          aria-label="Add care contact"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-5 left-5 right-5 grid gap-2 rounded-[22px] bg-white/88 p-3 shadow-pulse backdrop-blur md:grid-cols-3">
        {signals.map((signal) => (
          <div className={`rounded-[18px] p-3 ${signal.tone}`} key={signal.label}>
            <p className="text-[10px] font-normal uppercase text-pulse-muted">
              {signal.label}
            </p>
            <p className="mt-1 text-lg font-normal">{signal.value}</p>
            <p className="mt-1 text-[10px] font-normal leading-4 text-pulse-muted">
              {signal.copy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#d8d9df] px-3 font-sans text-pulse-ink">
      <div className="mx-auto min-h-screen max-w-[1540px] overflow-hidden bg-white shadow-[0_0_80px_rgba(36,37,48,0.12)]">
        <header
          id="home"
          className="sticky top-0 z-50 border-b border-pulse-line/40 bg-white/88 px-5 py-3 backdrop-blur-xl sm:px-8 lg:px-14"
        >
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5">
            <PulseLogo />
            <nav className="hidden items-center gap-8 text-sm font-normal lg:flex">
              {navItems.map((item) => (
                <a
                  className="transition hover:text-pulse-muted"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                className="hidden items-center gap-2 rounded-full border border-pulse-ink px-4 py-2 text-xs font-normal transition hover:bg-pulse-ink hover:text-white sm:flex"
                to="/login"
              >
                <ArrowRight className="h-4 w-4" />
                Log in
              </Link>
              <Link
                className="flex items-center gap-2 rounded-full bg-pulse-ink px-4 py-2 text-xs font-normal text-white transition hover:-translate-y-0.5 hover:shadow-pulse"
                to="/signup"
              >
                <Plus className="h-4 w-4" />
                Create account
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative px-5 pb-16 pt-10 sm:px-8 lg:px-14 lg:pb-24 lg:pt-20">
            <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="pulse-rise">
                <div className="mb-6 flex w-fit flex-col items-start gap-2">
                  <div className="inline-flex max-w-[275px] items-center gap-3 rounded-[18px] border border-pulse-line bg-white px-4 py-3 shadow-[0_14px_36px_rgba(17,17,17,0.06)]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pulse-ink text-white">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-normal uppercase tracking-[0.14em] text-pulse-muted">
                        Cognee memory layer
                      </p>
                      <p className="mt-1 text-sm font-normal text-pulse-ink">
                        Source-linked graph context
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-pulse-line bg-[#f7f7f8] px-3 py-2 text-[11px] font-normal">
                    <Sparkles className="h-4 w-4 text-[#7f7cff]" />
                    Private health memory
                  </div>
                </div>
                <h1 className="max-w-[600px] text-[clamp(2.45rem,5vw,4.75rem)] font-normal leading-[1.04] tracking-normal">
                  Personal{" "}
                  <span className="relative inline-block">
                    health
                    <span className="absolute inset-x-0 bottom-1 -z-10 h-4 bg-[#b9b8ff] sm:h-6" />
                  </span>{" "}
                  memory
                </h1>
                <p className="mt-6 max-w-lg text-base font-normal leading-7 text-pulse-ink/72">
                  Pulse organizes symptoms, records, wearable signals, and
                  outcomes into one clear view before your next appointment.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link
                    className="group inline-flex items-center gap-3 rounded-full bg-pulse-ink px-5 py-3.5 text-sm font-normal text-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.22)]"
                    to="/signup"
                  >
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    Get started
                  </Link>
                  <a
                    className="group inline-flex items-center gap-3 px-2 py-3 text-sm font-normal"
                    href="#workflow"
                  >
                    See workflow
                    <span className="h-px w-16 bg-pulse-ink transition group-hover:w-24" />
                  </a>
                </div>
                <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                  {proofStats.map((stat) => (
                    <div
                      className="rounded-[16px] border border-pulse-line bg-white p-3.5 shadow-[0_12px_30px_rgba(17,17,17,0.04)]"
                      key={stat.label}
                    >
                      <p className="text-lg font-normal">{stat.value}</p>
                      <p className="mt-1 text-[11px] font-normal leading-4 text-pulse-muted">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pulse-rise-delay">
                <FloatingHero />
              </div>
            </div>
          </section>

          <section className="px-5 pb-14 sm:px-8 lg:px-14" id="workflow">
            <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[0.98fr_1.02fr]">
              <div className="rounded-[28px] bg-pulse-ink p-6 text-white sm:p-8">
                <p className="text-sm font-normal text-white/65">Workflow</p>
                <h2 className="mt-3 max-w-2xl text-2xl font-normal leading-tight sm:text-4xl">
                  From records to a clear visit view.
                </h2>
                <div className="mt-7 space-y-3">
                  {workflow.map((item, index) => (
                    <div
                      className="flex items-start gap-4 rounded-[20px] bg-white/10 p-4"
                      key={item.title}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-normal text-pulse-ink">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-base font-normal">{item.title}</p>
                        <p className="mt-1 text-sm font-normal leading-5 text-white/66">
                          {item.copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-normal text-pulse-ink transition hover:-translate-y-1"
                  to="/signup"
                >
                  Start your baseline
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[26px] bg-[#b9b8ff] p-5 shadow-pulse">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-normal uppercase">
                        Today&apos;s insight
                      </p>
                      <h3 className="mt-5 max-w-xl text-xl font-normal leading-tight sm:text-2xl">
                        Symptoms cluster after low sleep.
                      </h3>
                      <div className="mt-5 grid gap-2 sm:grid-cols-3">
                        {["Sleep", "Water", "Outcome"].map((label, index) => (
                          <div
                            className="rounded-2xl bg-white/42 p-3 text-xs font-normal"
                            key={label}
                          >
                            <p className="text-pulse-ink/55">{label}</p>
                            <p className="mt-1 text-base">
                              {["-18%", "-500ml", "Improved"][index]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Activity className="h-10 w-10 shrink-0" />
                  </div>
                </div>
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <div className="grid gap-4">
                    <div className="rounded-[24px] bg-[#eaf9c9] p-5">
                      <Watch className="h-7 w-7" />
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-lg font-normal">Wearable sync</p>
                          <p className="mt-2 text-sm font-normal leading-6 text-pulse-muted">
                            Sleep, heart rate, and routines become graph signals.
                          </p>
                        </div>
                        <p className="shrink-0 text-xl font-normal">72%</p>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                        <div className="pulse-meter h-full w-[72%] rounded-full bg-pulse-ink" />
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-normal uppercase text-pulse-muted">
                          Multilingual
                        </p>
                        <span className="rounded-full bg-[#f2f1ff] px-2.5 py-1 text-[11px] font-normal">
                          12+ languages
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-normal leading-5">
                        Translate summaries and visit notes.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-normal">
                        {["EN", "HI", "ES", "FR"].map((language) => (
                          <span
                            className="rounded-full border border-pulse-line bg-[#f7f7f8] px-2 py-1"
                            key={language}
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#f6f0c9] p-5">
                    <UploadCloud className="h-7 w-7" />
                    <p className="mt-6 text-lg font-normal">PDF ingest</p>
                    <p className="mt-2 text-sm font-normal leading-6 text-pulse-muted">
                      Reports become searchable clinical memory.
                    </p>
                    <div className="mt-5 space-y-2">
                      {["Lab panel", "Visit note", "Prescription"].map((item) => (
                        <div
                          className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 text-xs font-normal"
                          key={item}
                        >
                          {item}
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 pb-16 sm:px-8 lg:px-14" id="security">
            <div className="mx-auto grid max-w-[1280px] gap-4 rounded-[28px] border border-pulse-line bg-white p-5 shadow-[0_18px_60px_rgba(17,17,17,0.06)] md:grid-cols-4">
              {[
                { icon: Lock, label: "Private by design", copy: "Organized around your care." },
                { icon: CalendarDays, label: "Daily timeline", copy: "Symptoms and habits over time." },
                { icon: Bell, label: "Risk reminders", copy: "Spot patterns earlier." },
                { icon: FileHeart, label: "Visit-ready notes", copy: "Cleaner appointment summaries." },
              ].map((item) => (
                <div
                  className="rounded-[22px] bg-[#f7f7f8] p-5"
                  key={item.label}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-pulse-ink text-white">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-normal">{item.label}</p>
                  <p className="mt-2 text-sm font-normal leading-5 text-pulse-muted">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}



