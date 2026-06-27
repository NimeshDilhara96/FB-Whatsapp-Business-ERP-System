import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = useAuthStore((state) => state.login);

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

        try {
            const res = await loginUser({ email, password });
            login(res.data.user, res.data.accessToken);
            navigate("/dashboard");
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setError(`Validation Error: ${data.errors.join(", ")}`);
            } else {
                setError(data?.message || "Login failed");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-bg to-primary-50 flex flex-col items-center justify-center p-4 md:relative">
            {/* Top-Left Branding (centered on mobile, absolute top-left on desktop) */}
            <div className="flex items-center gap-2.5 mb-8 md:mb-0 md:absolute md:top-6 md:left-6">
                <div className="w-8 h-8 bg-primary-500 rounded-lg shadow-sm shadow-primary-200 flex items-center justify-center">
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
                <span className="text-xl font-bold text-tx-main tracking-tight">order Folow Erp</span>
            </div>

            <div className="w-full max-w-md">

                {/* Header Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-tx-main tracking-tight">Welcome back</h1>
                    <p className="text-tx-subtle text-sm mt-1">Sign in to your ERP workspace</p>
                </div>

                {/* Login Card */}
                <Card className="p-8">

                    {/* Error Banner */}
                    <Alert type="error" message={error} className="mb-5" />

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                            rightElement={
                                <a href="#" className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                                    Forgot password?
                                </a>
                            }
                        />
                    </div>

                    {/* Login Button */}
                    <Button onClick={handleLogin} fullWidth className="mt-6">
                        Sign in to Workspace
                    </Button>

                    {/* Register Link */}
                    <p className="text-center text-sm text-tx-subtle mt-5">
                        Don&apos;t have a workspace?{" "}
                        <a href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                            Create one free
                        </a>
                    </p>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-base-border-subtle" />
                        <span className="text-xs text-tx-muted">secured connection</span>
                        <div className="flex-1 h-px bg-base-border-subtle" />
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 bg-base-bg border border-base-border rounded-full px-3.5 py-1.5">
                            <svg className="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-tx-muted font-medium">
                                Secure by <span className="text-primary-500 font-semibold">MommentX Auth</span>
                            </span>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
}