import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import orderflowLogo from "../assets/orderflow_logo_transparent.png";
import TurnstileWidget from "../components/ui/TurnstileWidget";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const submitLogin = async (token) => {
    if (isLoading) return;
    setError(null);
    try {
      setIsLoading(true);
      const res = await loginUser({ email, password, turnstileToken: token });
      login(res.data.user);

      if (res.data.user.role === "superadmin") {
        navigate("/superadmin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setIsLoading(false);
      setTurnstileToken("");
      setShowTurnstile(false);
      setTurnstileResetKey((prev) => prev + 1);
      const data = err.response?.data;
      if (data?.errors) {
        setError(`Validation Error: ${data.errors.join(", ")}`);
      } else {
        setError(data?.message || "Login failed");
      }
    }
  };

  const handleLogin = async () => {
    setError(null);
    // VALIDATION: Prevent empty submissions
    if (!email || !password) {
      return setError("Please enter both email and password.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address.");
    }

    if (!turnstileToken) {
      setShowTurnstile(true);
      return;
    }

    await submitLogin(turnstileToken);
  };

  const features = [
    {
      title: "Isolated workspaces",
      text: "Every business operates in its own secure, separate tenant.",
    },
    {
      title: "Orders and inventory",
      text: "Stock is updated transactionally with every order placed.",
    },
    {
      title: "Profit reporting",
      text: "Revenue, cost and margin reports for any period.",
    },
  ];

  return (
    <>
      {/* ── Server Cold-Start Loading Overlay ── */}
      {isLoading && (
        <div className="ss-overlay">
          {/* Spinner */}
          <svg
            className="ss-spinner"
            width="40"
            height="40"
            viewBox="0 0 36 36"
            fill="none"
          >
            <circle cx="18" cy="18" r="15" stroke="#e4e4e7" strokeWidth="3" />
            <path
              d="M18 3 A15 15 0 0 1 33 18"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Text */}
          <div className="ss-text-group max-w-xs px-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-1.5 tracking-tight">
              Waking up server
            </h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              This demo runs on a free-tier service which requires a brief cold start. Please allow <span className="font-medium text-slate-700">10–30 seconds</span>.
            </p>
            <div className="border border-slate-200 rounded-md px-3 py-2 w-full">
              <p className="text-xs text-slate-600 font-medium text-center">
                Production performance will be instant
              </p>
            </div>
          </div>

          {/* Progress track */}
          <div className="ss-track">
            <div className="ss-bar" />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
        {/* Brand Panel (desktop only) */}
        <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white px-14 py-12">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Order management ERP
          </p>

          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-snug tracking-tight">
              Manage orders, inventory and customers from one workspace.
            </h2>
            <dl className="mt-10 space-y-6">
              {features.map((item) => (
                <div key={item.title} className="border-l-2 border-slate-700 pl-4">
                  <dt className="text-sm font-semibold text-white">{item.title}</dt>
                  <dd className="mt-1 text-sm text-slate-400">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MommentX. All rights reserved.
          </p>
        </aside>

        {/* Form Panel */}
        <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-sm mx-auto">
            <img
              src={orderflowLogo}
              alt="Orderflow"
              className="h-24 w-auto -ml-5 -mt-4 mb-4 object-contain"
            />

            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your credentials to access your workspace.
            </p>

            {/* Error Banner */}
            <Alert type="error" message={error} className="mt-6" />

            {/* Form Fields */}
            <div className="mt-8 space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <a
                    href="#"
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
                  >
                    Forgot password?
                  </a>
                }
              />
            </div>

            {/* On-demand Security Challenge */}
            {showTurnstile && (
              <div className="mt-6">
                <p
                  className={`text-xs text-center mb-2 ${
                    turnstileToken
                      ? "text-primary-700 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {turnstileToken
                    ? "Verification successful. Signing in..."
                    : "Verifying your browser security..."}
                </p>
                <TurnstileWidget
                  onVerify={(token) => {
                    setTurnstileToken(token);
                    setTimeout(() => submitLogin(token), 500);
                  }}
                  onExpire={() => {
                    setTurnstileToken("");
                    setTurnstileResetKey((prev) => prev + 1);
                  }}
                  onError={() => {
                    setTurnstileToken("");
                    setShowTurnstile(false);
                    setError(
                      "Security verification failed to load. Please try again."
                    );
                  }}
                  resetKey={turnstileResetKey}
                />
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading || showTurnstile}
              className="mt-8 w-full rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {turnstileToken
                ? "Verified. Signing in..."
                : showTurnstile
                ? "Waiting for security check..."
                : "Sign in"}
            </button>

            {/* Register Link */}
            <p className="mt-6 text-sm text-slate-500">
              Don&apos;t have a workspace?{" "}
              <Link
                to="/register"
                className="font-semibold text-slate-900 hover:underline"
              >
                Create one
              </Link>
            </p>

            <p className="mt-12 border-t border-slate-200 pt-5 text-xs text-slate-400">
              Protected by Cloudflare Turnstile. Secured by MommentX Auth.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
