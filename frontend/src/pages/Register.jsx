import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import orderflowLogo from "../assets/orderflow_logo_transparent.png";

export default function Register() {
    const [companyName, setCompanyName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError(null);
        setSuccess(false);
        // VALIDATION: Prevent empty submissions
        if (!companyName || !name || !email || !password) {
            return setError("Please fill in all fields.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return setError("Please enter a valid email address.");
        }

        setIsLoading(true);
        try {
            await registerUser({ companyName, name, email, password });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 1500); 
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setError(`Validation Error: ${data.errors.join(", ")}`);
            } else {
                setError(data?.message || "Registration failed");
            }
            setIsLoading(false);
        }
    };

    const steps = [
        {
            title: "Create your account",
            text: "Register your company and the primary administrator.",
        },
        {
            title: "Add products and customers",
            text: "Set up your catalogue and customer records.",
        },
        {
            title: "Start taking orders",
            text: "Track orders, stock and profit from day one.",
        },
    ];

    return (
        <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
            {/* Brand Panel (desktop only) */}
            <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white px-14 py-12">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                    Order management ERP
                </p>

                <div className="max-w-md">
                    <h2 className="text-3xl font-semibold leading-snug tracking-tight">
                        Set up your business workspace in a few minutes.
                    </h2>
                    <ol className="mt-10 space-y-6">
                        {steps.map((step, index) => (
                            <li key={step.title} className="flex gap-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs font-medium text-slate-300">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-white">{step.title}</p>
                                    <p className="mt-1 text-sm text-slate-400">{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
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
                        Create your workspace
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter your details to set up your account.
                    </p>

                    {/* Banner */}
                    <Alert type="error" message={error} className="mt-6" />
                    {success && <Alert type="success" message="Workspace created successfully! Redirecting..." className="mt-6" />}

                    {/* Form Fields */}
                    <div className="mt-8 space-y-5">
                        <Input
                            label="Company name"
                            placeholder="Your company name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />

                        <Input
                            label="Full name"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

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
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="button"
                        onClick={handleRegister}
                        disabled={isLoading || success}
                        className="mt-8 w-full rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? "Creating..." : success ? "Redirecting..." : "Create workspace"}
                    </button>

                    {/* Login Link */}
                    <p className="mt-6 text-sm text-slate-500">
                        Already have a workspace?{" "}
                        <Link to="/login" className="font-semibold text-slate-900 hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-12 border-t border-slate-200 pt-5 text-xs text-slate-400">
                        Secured by MommentX Auth.
                    </p>
                </div>
            </main>
        </div>
    );
}
