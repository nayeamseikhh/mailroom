import { useEffect, useState } from "react";
import {
  FiSend,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";

const BARS = [
  { label: "Sent", pct: 100, color: "#C9D4FF" },
  { label: "Dellected", pct: 98, color: "#97AAFF" },
  { label: "Opened", pct: 43, color: "#4F6DFF" },
  { label: "Clicked", pct: 9, color: "#7F95FF" },
];

function Logo({ dark = false }) {
  return (
    <Link
      to="/dashboard"
      className={`inline-flex items-center gap-2.5 ${dark ? "text-white" : "text-[#16201E]"}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-md border border-emerald-200/25 bg-emerald-400/15 text-emerald-200 shadow-sm backdrop-blur">
        <FiSend aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Mailroom</span>
    </Link>
  );
}

function BrandPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <aside className="hidden flex-col justify-between bg-[#10231F] p-12 text-[#C4D2CE] lg:flex lg:w-[46%]">
      <Logo dark />

      <div>
        <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
          Know who opened your email.
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed">
          Build a campaign, send it to your list, and watch the results come in.
        </p>

        <div className="mt-10 max-w-sm space-y-3" aria-hidden="true">
          {BARS.map((b, i) => (
            <div key={b.label} className="flex items-center gap-4">
              <span className="w-20 text-sm">{b.label}</span>
              <div className="h-5 flex-1 rounded-sm bg-white/10">
                <div
                  className="h-full rounded-sm transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    width: mounted ? `${b.pct}%` : "0%",
                    backgroundColor: b.color,
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-[#8FA39E]">Email campaigns, kept simple.</p>
    </aside>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password, remember });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to log in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-[#CBD3CF] bg-white py-3 pl-11 pr-4 text-[15px] placeholder:text-[#8A9893] focus:border-[#2F4BE0] focus:outline-2 focus:outline-offset-0 focus:outline-[#2F4BE0]/30";

  return (
    <div className="auth-theme min-h-screen bg-[#F2F4F1] font-sans text-[#16201E] lg:flex">
      <BrandPanel />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-2 text-[#5B6B67]">
            Welcome back. Enter your details to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-[#F0C9A8] bg-[#FFF4E8] px-4 py-3 text-sm text-[#8A4B0F]"
              >
                <FiAlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <div className="relative">
                <FiMail
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9893]"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
              </div>
              <div className="relative">
                <FiLock
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9893]"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-[#5B6B67] hover:text-[#16201E] focus-visible:outline-2 focus-visible:outline-[#4F6DFF]"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[#2F4BE0]"
              />
              Keep me logged in for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#2F4BE0] px-4 py-3 text-[15px] font-medium text-white hover:bg-[#2640C2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4BE0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5B6B67]">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-[#2F4BE0] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#4F6DFF]"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
