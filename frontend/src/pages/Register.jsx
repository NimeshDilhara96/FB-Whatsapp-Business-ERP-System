import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

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
            // The backend natively generates the tenantId, so we just pass the companyName!
            await registerUser({ companyName, name, email, password });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 1500); // Redirect after brief success message
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
        <div style={{ padding: 20 }}>
            <h2>Create Your Workspace</h2>
            {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
            {success && <p style={{ color: "green", fontWeight: "bold" }}>Workspace created successfully! Redirecting...</p>}

            <input 
                placeholder="Your Company Name" 
                onChange={(e) => setCompanyName(e.target.value)} 
            />
            <br />

            <input placeholder="Your Full Name" onChange={(e) => setName(e.target.value)} />
            <br />

            <input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
            <br />

            <input
                placeholder="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <br />

            <button onClick={handleRegister}>Create Workspace</button>
        </div>
    );
}