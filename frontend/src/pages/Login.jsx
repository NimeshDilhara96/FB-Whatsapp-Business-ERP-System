import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        try {
            const res = await loginUser({ email, password });

            login(res.data.user, res.data.token);

            alert("Login Success");
            navigate("/dashboard");
        } catch (err) {
            alert(err.response?.data?.message);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Login</h2>

            <input
                placeholder="Email"
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