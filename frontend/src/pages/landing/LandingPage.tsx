import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileHeart,
  HeartPulse,
  LineChart,
  Lock,
  MessageCircle,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  Watch,
  Zap,
} from "lucide-react";
import pulseLogo from "../../assets/pulse-logo.png";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Cognee", href: "#cognee" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
];

const proofStats = [
  { value: "92%", label: "episodes organized" },
  { value: "14d", label: "trend window" },
  { value: "4.8x", label: "faster visit prep" },
];

const features = [
  {
    icon: Brain,
    title: "Memory graph",
    copy: "Symptoms, records, habits, medications, and outcomes are linked into one explainable health context.",
  },
  {
    icon: LineChart,
    title: "Trend detection",
    copy: "Pulse compares sleep, hydration, heart rate, location, and treatment response across time windows.",
  },
  {
    icon: FileHeart,
    title: "Clinical summaries",
    copy: "Generate concise visit notes with sources, open questions, and the evidence behind each insight.",
  },
  {
    icon: Watch,
    title: "Wearable context",
    copy: "Daily metrics become useful signals instead of disconnected numbers trapped in different apps.",
  },
  {
    icon: MessageCircle,
    title: "Patient logs",
    copy: "Capture symptoms, severity, triggers, and treatments in a format that stays searchable later.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence first",
    copy: "Every recommendation stays tied to the uploaded document, log entry, or wearable pattern that supports it.",
  },
];

const workflow = [
  {
    title: "Build the baseline",
    copy: "Answer a short survey so Pulse knows your symptoms, goals, medications, and usual routines.",
  },
  {
    title: "Ingest real evidence",
    copy: "Upload PDFs, add daily context, and connect wearable-style metrics to the same patient memory.",
  },
  {
    title: "Review the graph",
    copy: "Explore patterns, inspect confidence, log new outcomes, and export a doctor-ready summary.",
  },
];

const signals = [
  { label: "Sleep debt", value: "6.1h", copy: "2 nights below target", tone: "bg-[#f2f1ff]" },
  { label: "Hydration", value: "1.8L", copy: "500ml under baseline", tone: "bg-[#e9f9d9]" },
  { label: "Stress flag", value: "High", copy: "pattern confidence 78%", tone: "bg-[#fff6cc]" },
];

const cogneeItems = [
  "Semantic memory for patient context",
  "Source-linked retrieval for clinical evidence",
  "Graph relationships between symptoms and triggers",
];

function PulseLogo() {
  return (
    <Link className="group flex items-center gap-3" to="/" aria-label="Pulse home">
      <img
        alt=""
        className="h-9 w-9 rounded-xl object-contain transition group-hover:scale-105"
        src={pulseLogo}
      />
      <span className="text-lg font-black tracking-normal text-pulse-ink">
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
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-[28px] bg-[#f6f6f7] p-5 shadow-[0_24px_70px_rgba(17,17,17,0.08)] md:min-h-[560px]">
      <div className="absolute inset-y-0 left-[38%] hidden w-px bg-pulse-line/60 md:block" />
      <div className="absolute inset-y-8 left-[58%] hidden w-px bg-pulse-line/50 md:block" />
      <div className="absolute inset-y-16 left-[77%] hidden w-px bg-pulse-line/40 md:block" />
      <div className="absolute left-1/2 top-12 h-[320px] w-[235px] -translate-x-1/2 rounded-[26px] bg-white/72 shadow-inner" />
      <Waveform />

      <div className="pulse-float absolute left-5 top-6 rounded-full bg-white px-4 py-2 text-[11px] font-black text-pulse-ink shadow-pulse md:left-12">
        5 trigger candidates
      </div>

      <div className="pulse-float-delay absolute right-5 top-16 w-[210px] rounded-[22px] bg-[#9899ff] p-4 text-pulse-ink shadow-[0_22px_55px_rgba(92,92,190,0.23)] sm:right-9">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase">Pattern brief</p>
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/75 text-pulse-ink shadow-pulse transition hover:scale-105"
            type="button"
            aria-label="Play pattern brief"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        </div>
        <h3 className="mt-8 text-base font-black leading-tight">
          Migraine risk rises after low sleep
        </h3>
        <p className="mt-2 text-xs font-semibold">2 minute read · 81% confidence</p>
      </div>

      <div className="pulse-float-slow absolute bottom-40 left-5 w-[218px] rounded-[22px] bg-[#aaf0a7] p-4 text-pulse-ink shadow-[0_22px_55px_rgba(71,170,88,0.18)] md:left-12">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
              <Stethoscope className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black">Visit summary</p>
              <p className="text-[10px] font-semibold text-pulse-muted">
                Ready today
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/55 px-2 py-1 text-[10px] font-black">
            5:30 PM
          </span>
        </div>
        <p className="mt-8 text-sm font-black leading-tight">
          Export evidence-backed timeline
        </p>
        <p className="mt-2 text-[11px] font-semibold leading-4 text-pulse-muted">
          Includes records, patient logs, and treatment outcomes.
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
            <p className="text-xl font-black leading-none">
              124<span className="text-sm text-pulse-muted">/68</span>
            </p>
            <p className="text-[11px] font-bold">blood pressure</p>
          </div>
        </div>
      </div>

      <div className="pulse-float-delay absolute left-[46%] top-[300px] w-[170px] rounded-[20px] bg-white/90 p-3.5 text-pulse-ink shadow-pulse backdrop-blur sm:left-[50%] md:left-[52%]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase text-pulse-muted">
            Multilingual
          </p>
          <span className="rounded-full bg-[#e9f9d9] px-2 py-1 text-[10px] font-black">
            12+
          </span>
        </div>
        <p className="mt-2 text-xs font-black leading-tight">
          Care notes in your language.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black">
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
            className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-pulse-ink text-[10px] font-black text-white"
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
            <p className="text-[10px] font-black uppercase text-pulse-muted">
              {signal.label}
            </p>
            <p className="mt-1 text-lg font-black">{signal.value}</p>
            <p className="mt-1 text-[10px] font-bold leading-4 text-pulse-muted">
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
            <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
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
                className="hidden items-center gap-2 rounded-full border border-pulse-ink px-4 py-2 text-xs font-black transition hover:bg-pulse-ink hover:text-white sm:flex"
                to="/login"
              >
                <ArrowRight className="h-4 w-4" />
                Log in
              </Link>
              <Link
                className="flex items-center gap-2 rounded-full bg-pulse-ink px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:shadow-pulse"
                to="/signup"
              >
                <Plus className="h-4 w-4" />
                Create account
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative px-5 pb-14 pt-8 sm:px-8 lg:px-14 lg:pb-20 lg:pt-16">
            <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="pulse-rise">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pulse-line bg-[#f7f7f8] px-3 py-2 text-[11px] font-black">
                  <Sparkles className="h-4 w-4 text-[#7f7cff]" />
                  AI health memory for symptoms, records, and wearables
                </div>
                <h1 className="max-w-[620px] text-[clamp(2.45rem,5.35vw,5.15rem)] font-black leading-[0.97] tracking-normal">
                  Life changing{" "}
                  <span className="relative inline-block">
                    health
                    <span className="absolute inset-x-0 bottom-1 -z-10 h-4 bg-[#b9b8ff] sm:h-6" />
                  </span>{" "}
                  intelligence
                </h1>
                <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-pulse-ink/76">
                  Pulse turns symptoms, wearable signals, treatment outcomes,
                  and medical records into a private memory graph that prepares
                  you for every care decision.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link
                    className="group inline-flex items-center gap-3 rounded-full bg-pulse-ink px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.22)]"
                    to="/signup"
                  >
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    Get started
                  </Link>
                  <a
                    className="group inline-flex items-center gap-3 px-2 py-3 text-sm font-black"
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
                      <p className="text-lg font-black">{stat.value}</p>
                      <p className="mt-1 text-[11px] font-bold leading-4 text-pulse-muted">
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

          <section className="px-5 pb-14 sm:px-8 lg:px-14" id="cognee">
            <div className="pulse-sheen mx-auto grid max-w-[1280px] gap-5 rounded-[28px] bg-pulse-ink p-5 text-white shadow-[0_22px_70px_rgba(17,17,17,0.16)] lg:grid-cols-[0.92fr_1.08fr] lg:p-7">
              <div>
                <p className="text-xs font-black uppercase text-white/60">
                  Memory layer
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
                  Powered by Cognee.ai-style graph memory for grounded health context.
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {cogneeItems.map((item) => (
                  <div
                    className="rounded-[20px] border border-white/10 bg-white/[0.09] p-4"
                    key={item}
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#aaf0a7]" />
                    <p className="mt-4 text-sm font-bold leading-5 text-white/86">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-5 pb-14 sm:px-8 lg:px-14" id="features">
            <div className="mx-auto max-w-[1280px] rounded-[28px] bg-[#f4f4f5] p-5 sm:p-7 lg:p-9">
              <div className="grid gap-7 lg:grid-cols-[0.62fr_1.38fr]">
                <div>
                  <p className="text-sm font-black">Why Pulse?</p>
                  <h2 className="mt-3 max-w-sm text-2xl font-black leading-tight sm:text-3xl">
                    A clearer product for the parts of health that are easy to forget.
                  </h2>
                  <p className="mt-4 text-sm font-semibold leading-6 text-pulse-muted">
                    Pulse is built for people who need their health history,
                    habits, and clinical evidence organized before the next
                    appointment.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {features.map((feature) => (
                    <article
                      className="group rounded-[20px] bg-white p-5 shadow-[0_16px_38px_rgba(17,17,17,0.05)] transition duration-300 hover:-translate-y-1.5"
                      key={feature.title}
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-pulse-ink text-white transition group-hover:rotate-3 group-hover:scale-105">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-base font-black">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-pulse-muted">
                        {feature.copy}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 pb-14 sm:px-8 lg:px-14" id="workflow">
            <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[0.98fr_1.02fr]">
              <div className="rounded-[28px] bg-pulse-ink p-6 text-white sm:p-8">
                <p className="text-sm font-black text-white/65">Workflow</p>
                <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight sm:text-4xl">
                  From scattered records to one living health map.
                </h2>
                <div className="mt-7 space-y-3">
                  {workflow.map((item, index) => (
                    <div
                      className="flex items-start gap-4 rounded-[20px] bg-white/10 p-4"
                      key={item.title}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-pulse-ink">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-base font-black">{item.title}</p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-white/66">
                          {item.copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black text-pulse-ink transition hover:-translate-y-1"
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
                      <p className="text-xs font-black uppercase">
                        Today&apos;s insight
                      </p>
                      <h3 className="mt-5 max-w-xl text-xl font-black leading-tight sm:text-2xl">
                        Symptoms cluster after poor sleep and missed hydration.
                      </h3>
                      <div className="mt-5 grid gap-2 sm:grid-cols-3">
                        {["Sleep", "Water", "Outcome"].map((label, index) => (
                          <div
                            className="rounded-2xl bg-white/42 p-3 text-xs font-black"
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
                          <p className="text-lg font-black">Wearable sync</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-pulse-muted">
                            Sleep, heart rate, hydration, and routines become
                            graph signals.
                          </p>
                        </div>
                        <p className="shrink-0 text-xl font-black">72%</p>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                        <div className="pulse-meter h-full w-[72%] rounded-full bg-pulse-ink" />
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase text-pulse-muted">
                          Multilingual
                        </p>
                        <span className="rounded-full bg-[#f2f1ff] px-2.5 py-1 text-[11px] font-black">
                          12+ languages
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-black leading-5">
                        Translate summaries, symptom notes, and visit prep into
                        patient-friendly language.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black">
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
                    <p className="mt-6 text-lg font-black">PDF ingest</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-pulse-muted">
                      Reports become searchable clinical memory with citations,
                      diagnosis history, labs, and medication context.
                    </p>
                    <div className="mt-5 space-y-2">
                      {["Lab panel", "Visit note", "Prescription"].map((item) => (
                        <div
                          className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 text-xs font-black"
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
                { icon: Lock, label: "Private by design", copy: "Keep records and logs organized for your own care context." },
                { icon: CalendarDays, label: "Daily timeline", copy: "See how symptoms, habits, and treatments line up over time." },
                { icon: Bell, label: "Risk reminders", copy: "Spot recurring patterns before the next episode sneaks up." },
                { icon: FileHeart, label: "Visit-ready notes", copy: "Bring cleaner summaries and evidence into appointments." },
              ].map((item) => (
                <div
                  className="rounded-[22px] bg-[#f7f7f8] p-5"
                  key={item.label}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-pulse-ink text-white">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-black">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-pulse-muted">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-5 pb-18 sm:px-8 lg:px-14">
            <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-7 rounded-[28px] bg-[#aaf0a7] p-6 sm:p-8 lg:flex-row lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-black">
                  <CheckCircle2 className="h-5 w-5" />
                  Built for daily use
                </p>
                <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
                  Make your health history easier to explain, inspect, and remember.
                </h2>
              </div>
              <Link
                className="inline-flex shrink-0 items-center gap-3 rounded-full bg-pulse-ink px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.2)]"
                to="/signup"
              >
                Create your Pulse
                <Zap className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
