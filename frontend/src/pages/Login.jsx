import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";

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
        <div style={{ padding: 20 }}>
            <h2>Login to Workspace</h2>
            {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

            <input
                placeholder="Email Address"
                onChange={(e) => setEmail(e.target.value)}
            />
            <br />

            <input
                placeholder="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <br />

            <button onClick={handleLogin}>Login</button>
        </div>
    );
}