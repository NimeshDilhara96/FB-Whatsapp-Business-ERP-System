import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

export default function Register() {
    const [companyName, setCompanyName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
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
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-bg to-primary-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-tx-main tracking-tight">Create your workspace</h1>
                    <p className="text-tx-subtle text-sm mt-1">Set up your ERP account in seconds</p>
                </div>

                {/* Register Card */}
                <Card className="p-8">

                    {/* Banner */}
                    <Alert type="error" message={error} className="mb-5" />
                    {success && <Alert type="success" message="Workspace created successfully! Redirecting..." className="mb-5" />}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <Input
                            label="Company Name"
                            placeholder="Your Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />

                        <Input
                            label="Full Name"
                            placeholder="Your Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />

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
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Register Button */}
                    <Button onClick={handleRegister} fullWidth className="mt-6">
                        Create Workspace
                    </Button>

                    {/* Login Link */}
                    <p className="text-center text-sm text-tx-subtle mt-5">
                        Already have a workspace?{" "}
                        <a href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                            Sign in
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