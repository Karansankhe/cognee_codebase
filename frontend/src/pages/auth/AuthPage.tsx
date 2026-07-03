import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import pulseLogo from "../../assets/pulse-logo.png";

type AuthMode = "login" | "signup";

const trustPoints = [
  "Private health memory graph",
  "Source-linked summaries",
  "Multilingual visit prep",
];

const graphNodes = [
  { label: "Symptoms", className: "left-[18%] top-[24%]", dotClassName: "bg-[#ff6b3a]", delay: "delay-0" },
  { label: "Cognee", className: "left-[45%] top-[14%]", dotClassName: "bg-[#9899ff]", delay: "delay-100" },
  { label: "Records", className: "right-[18%] top-[28%]", dotClassName: "bg-[#37c77f]", delay: "delay-200" },
  { label: "Wearables", className: "left-[28%] bottom-[22%]", dotClassName: "bg-[#f3bf18]", delay: "delay-300" },
  { label: "Insights", className: "right-[22%] bottom-[18%]", dotClassName: "bg-[#2b9ce8]", delay: "delay-500" },
];

function resolveMode(pathname: string, queryMode: string | null): AuthMode {
  if (pathname.includes("login")) return "login";
  if (pathname.includes("signup")) return "signup";
  return queryMode === "login" ? "login" : "signup";
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = resolveMode(location.pathname, searchParams.get("mode"));
  const isSignup = mode === "signup";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    remember: true,
  });

  const modeCopy = useMemo(
    () =>
      isSignup
        ? {
            eyebrow: "Create your Pulse",
            title: "Start a private health memory that gets clearer every day.",
            subtitle:
              "Create an account to build your baseline, connect evidence, and prepare visit-ready summaries.",
            button: "Create account",
            foot: "Already have a Pulse account?",
            footAction: "Log in",
          }
        : {
            eyebrow: "Welcome back",
            title: "Open your health graph and keep the next care decision in focus.",
            subtitle:
              "Log in to review patterns, export summaries, and continue where your timeline left off.",
            button: "Log in",
            foot: "New to Pulse?",
            footAction: "Create account",
          },
    [isSignup],
  );

  function changeMode(nextMode: AuthMode) {
    setError("");
    if (location.pathname === "/auth") {
      setSearchParams({ mode: nextMode });
      return;
    }
    navigate(nextMode === "login" ? "/login" : "/signup", { replace: true });
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password.trim();
    const name = form.name.trim();

    if (isSignup && name.length < 2) {
      setError("Add your name so Pulse can personalize your workspace.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setIsSubmitting(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "pulse_auth_user",
        JSON.stringify({
          name: name || "Pulse member",
          email,
          mode,
          signedInAt: new Date().toISOString(),
        }),
      );

      window.setTimeout(() => {
        navigate(isSignup ? "/onboarding" : "/dashboard");
      }, 420);
    }
  }

  return (
    <main className="min-h-screen bg-[#d8d9df] px-2 font-sans text-pulse-ink">
      <div className="mx-auto min-h-screen max-w-[1540px] overflow-hidden bg-white shadow-[0_0_80px_rgba(36,37,48,0.12)]">
        <header className="border-b border-pulse-line/50 bg-white/88 px-4 py-1.5 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5">
            <Link className="group flex items-center gap-3" to="/" aria-label="Pulse home">
              <img
                alt=""
                className="h-7 w-7 rounded-lg object-contain transition group-hover:scale-105"
                src={pulseLogo}
              />
              <span className="text-sm font-black tracking-normal">PULSE</span>
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 rounded-full border border-pulse-line bg-white px-3 py-1.5 text-[10px] font-black transition hover:-translate-y-0.5 hover:border-pulse-ink"
              to="/"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back home
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-[1100px] gap-4 px-4 py-3 sm:px-6 lg:min-h-[calc(100vh-48px)] lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-10">
          <aside className="pulse-rise order-2 overflow-hidden rounded-[18px] bg-[#f6f6f7] p-3.5 shadow-[0_18px_45px_rgba(17,17,17,0.08)] lg:order-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-pulse-muted">
                  Cognee.ai memory layer
                </p>
                <h1 className="mt-1.5 max-w-md text-xl font-black leading-tight sm:text-2xl">
                  One account for symptoms, records, and living context.
                </h1>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pulse-ink text-white">
                <Network className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="relative mt-3.5 h-[170px] rounded-[16px] border border-pulse-line bg-white/72 shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[size:34px_34px]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 280" fill="none" aria-hidden="true">
                <path
                  className="pulse-wave pulse-wave-lavender"
                  d="M92 92 C155 36 203 121 259 88 C309 59 345 166 425 82"
                />
                <path
                  className="pulse-wave pulse-wave-ink"
                  d="M84 190 C136 120 193 198 258 140 C319 86 360 185 439 138"
                />
              </svg>

              {graphNodes.map((node) => (
                <div
                  className={`pulse-float absolute ${node.className} ${node.delay} flex items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-pulse`}
                  key={node.label}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${node.dotClassName} shadow-[0_0_0_4px_rgba(255,255,255,0.75)]`} />
                  <span className="text-[9px] font-black">{node.label}</span>
                </div>
              ))}

              <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[16px] bg-[#d8fb64] shadow-[0_18px_45px_rgba(125,165,16,0.2)]">
                <img alt="" className="h-8 w-8 object-contain" src={pulseLogo} />
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { label: "12+", copy: "languages", icon: Globe2, tone: "bg-[#f2f1ff]" },
                { label: "Private", copy: "by design", icon: ShieldCheck, tone: "bg-[#e9f9d9]" },
                { label: "Live", copy: "graph memory", icon: Sparkles, tone: "bg-[#fff6cc]" },
              ].map((item) => (
                <div className={`rounded-[14px] ${item.tone} p-2.5`} key={item.copy}>
                  <item.icon className="h-3.5 w-3.5" />
                  <p className="mt-2 text-sm font-black">{item.label}</p>
                  <p className="text-[10px] font-bold text-pulse-muted">{item.copy}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="pulse-rise-delay order-1 flex items-center lg:order-2">
            <div className="w-full rounded-[18px] border border-pulse-line bg-white p-3.5 shadow-[0_18px_45px_rgba(17,17,17,0.08)] sm:p-4 lg:p-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f7f8] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em]">
                <Sparkles className="h-3 w-3 text-[#7f7cff]" />
                {modeCopy.eyebrow}
              </div>

              <h2 className="mt-2.5 max-w-2xl text-xl font-black leading-tight sm:text-2xl">
                {modeCopy.title}
              </h2>
              <p className="mt-1.5 max-w-xl text-xs font-semibold leading-4 text-pulse-muted">
                {modeCopy.subtitle}
              </p>

              <div className="mt-3 grid rounded-full bg-[#f4f4f5] p-1 text-[11px] font-black sm:max-w-[260px] sm:grid-cols-2">
                <button
                  className={`rounded-full px-3 py-1.5 transition ${
                    mode === "login" ? "bg-pulse-ink text-white shadow-pulse" : "text-pulse-muted hover:text-pulse-ink"
                  }`}
                  type="button"
                  onClick={() => changeMode("login")}
                >
                  Log in
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 transition ${
                    mode === "signup" ? "bg-pulse-ink text-white shadow-pulse" : "text-pulse-muted hover:text-pulse-ink"
                  }`}
                  type="button"
                  onClick={() => changeMode("signup")}
                >
                  Sign up
                </button>
              </div>

              <form className="mt-3 grid gap-2.5" onSubmit={submitForm}>
                {isSignup && (
                  <label className="grid gap-1 text-[11px] font-black">
                    Full name
                    <span className="flex items-center gap-2 rounded-[13px] border border-pulse-line bg-[#f7f7f8] px-3 py-2 focus-within:border-pulse-ink">
                      <UserRound className="h-3.5 w-3.5 text-pulse-muted" />
                      <input
                        className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-pulse-muted"
                        name="name"
                        placeholder="Maya Rao"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      />
                    </span>
                  </label>
                )}

                <label className="grid gap-1 text-[11px] font-black">
                  Email
                  <span className="flex items-center gap-2 rounded-[13px] border border-pulse-line bg-[#f7f7f8] px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-pulse-muted" />
                    <input
                      className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-pulse-muted"
                      name="email"
                      placeholder="you@example.com"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </span>
                </label>

                <label className="grid gap-1 text-[11px] font-black">
                  Password
                  <span className="flex items-center gap-2 rounded-[13px] border border-pulse-line bg-[#f7f7f8] px-3 py-2">
                    <Lock className="h-3.5 w-3.5 text-pulse-muted" />
                    <input
                      className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-pulse-muted"
                      name="password"
                      placeholder="At least 6 characters"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    <button
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-pulse-muted transition hover:text-pulse-ink"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-pulse-muted">
                  <label className="flex items-center gap-2">
                    <input
                      checked={form.remember}
                      className="h-3.5 w-3.5 accent-pulse-ink"
                      type="checkbox"
                      onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
                    />
                    Keep me signed in
                  </label>
                  <span>Secured local session</span>
                </div>

                {error && (
                  <div className="rounded-[15px] border border-[#ff6b3a]/30 bg-[#fff0ea] px-3.5 py-2.5 text-xs font-bold text-pulse-ink">
                    {error}
                  </div>
                )}

                <button
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-pulse-ink px-5 py-2.5 text-xs font-black text-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.22)] disabled:translate-y-0 disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Opening Pulse..." : modeCopy.button}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </button>
              </form>

              <div className="mt-3 rounded-[15px] bg-[#f7f7f8] p-2.5">
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {trustPoints.map((point) => (
                    <div className="flex items-start gap-1.5 text-[10px] font-black leading-3.5" key={point}>
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#37c77f]" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] font-semibold text-pulse-muted">
                {modeCopy.foot}{" "}
                <button
                  className="font-black text-pulse-ink hover:underline"
                  type="button"
                  onClick={() => changeMode(isSignup ? "login" : "signup")}
                >
                  {modeCopy.footAction}
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
