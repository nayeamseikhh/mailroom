
import { useState } from "react";
import {
  FiSend,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";

const STEPS = [
  {
    title: "Import your contacts",
    body: "Upload a CSV or add people one by one.",
  },
  {
    title: "Pick a template",
    body: "Start from a layout and edit the text.",
  },
  {
    title: "Send and watch results",
    body: "See opens and clicks as they happen.",
  },
];

const PASSWORD_RULES = [
  {
    label: "At least 12 characters",
    test: (password) => password.length >= 12,
  },
  {
    label: "Contains a letter",
    test: (password) => /[A-Za-z]/.test(password),
  },
  {
    label: "Contains a number",
    test: (password) => /\d/.test(password),
  },
];

function Logo({ dark = false }) {
  return (
    <Link
      to="/"
      aria-label="Mailroom home"
      className={`inline-flex items-center gap-2.5 ${dark ? "text-white" : "text-[#16201E]"
        }`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-md border border-emerald-200/25 bg-emerald-400/15 text-emerald-200 shadow-sm backdrop-blur">
        <FiSend aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Mailroom</span>
    </Link>
  );
}

function BrandPanel() {
  return (
    <aside className="hidden flex-col justify-between bg-[#10231F] p-12 text-[#C4D2CE] lg:flex lg:w-[46%]">
      <Logo dark />

      <div>
        <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
          Your first campaign is a few minutes away.
        </h2>

        <ol className="mt-10 max-w-sm space-y-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/25 text-sm font-semibold text-emerald-100">
                {index + 1}
              </span>

              <div>
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-0.5 text-sm">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm text-[#8FA39E]">
        Email campaigns, kept simple.
      </p>
    </aside>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2.5 rounded-md border border-[#F0C9A8] bg-[#FFF4E8] px-4 py-3 text-sm text-[#8A4B0F]"
    >
      <FiAlertCircle
        size={18}
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    ok: rule.test(form.password),
  }));

  const passwordOk = passwordRules.every((rule) => rule.ok);

  const inputClass =
    "w-full rounded-md border border-[#CBD3CF] bg-white py-3 pl-11 pr-4 text-[15px] text-[#16201E] placeholder:text-[#8A9893] focus:border-[#2F4BE0] focus:outline-2 focus:outline-offset-0 focus:outline-[#2F4BE0]/30";

  const iconClass =
    "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9893]";

  const update = (field) => (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (name.length > 100) {
      setError("Your name must be 100 characters or fewer.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (email.length > 254) {
      setError("Please enter a shorter email address.");
      return;
    }

    if (!passwordOk) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== form.confirm) {
      setError("The passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      // The backend must accept { name, email, password }.
      await register({
        name,
        email,
        password,
      });

      // Registration should establish an authenticated session
      // before navigating to the protected dashboard.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      if (!err?.response) {
        setError(
          "Cannot connect to the server. Check that your backend is running on port 5001.",
        );
      } else if (status === 400) {
        setError(serverMessage || "Please check the information you entered.");
      } else if (status === 409) {
        setError(
          serverMessage || "An account with this email already exists. Please log in.",
        );
      } else if (status === 429) {
        setError("Too many attempts. Please wait and try again.");
      } else if (status >= 500) {
        setError(
          serverMessage ||
          "The server could not create your account. Check the backend terminal for the actual error.",
        );
      } else {
        setError(serverMessage || "Unable to create your account. Please try again.");
      }

      // Keep diagnostic details in the developer console only.
      console.error("Registration failed:", {
        status,
        message: err?.message,
        response: err?.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-theme min-h-screen bg-[#F2F4F1] font-sans text-[#16201E] lg:flex">
      <BrandPanel />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-[#5B6B67]">
            It takes less than a minute.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 space-y-5"
          >
            <ErrorMessage message={error} />

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium"
              >
                Full name
              </label>

              <div className="relative">
                <FiUser className={iconClass} aria-hidden="true" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Your full name"
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>

              <div className="relative">
                <FiMail className={iconClass} aria-hidden="true" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <FiLock className={iconClass} aria-hidden="true" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Create a password"
                  disabled={loading}
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-[#5B6B67] hover:text-[#16201E] focus-visible:outline-2 focus-visible:outline-[#4F6DFF]"
                >
                  {showPassword ? (
                    <FiEyeOff size={18} aria-hidden="true" />
                  ) : (
                    <FiEye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              <ul
                className="mt-3 space-y-1.5"
                aria-label="Password requirements"
              >
                {passwordRules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-2 text-sm ${rule.ok ? "text-[#1F7A56]" : "text-[#5B6B67]"
                      }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${rule.ok
                          ? "bg-[#1F9D6B] text-white"
                          : "border border-[#B5C0BC]"
                        }`}
                    >
                      {rule.ok && (
                        <FiCheck size={11} aria-hidden="true" />
                      )}
                    </span>

                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="mb-1.5 block text-sm font-medium"
              >
                Confirm password
              </label>

              <div className="relative">
                <FiLock className={iconClass} aria-hidden="true" />

                <input
                  id="confirm"
                  name="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.confirm}
                  onChange={update("confirm")}
                  placeholder="Enter the password again"
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) => setAgree(event.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 accent-[#2F4BE0]"
              />

              <span>
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-medium text-[#2F4BE0] underline-offset-2 hover:underline"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-[#2F4BE0] underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#2F4BE0] px-4 py-3 text-[15px] font-medium text-white hover:bg-[#2640C2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4BE0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#5B6B67]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[#2F4BE0] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#4F6DFF]"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
