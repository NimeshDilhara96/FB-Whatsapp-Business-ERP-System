import { useState } from "react";
import { registerUser } from "../services/authService";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            await registerUser({ name, email, password });
            alert("Registered Successfully");
        } catch (err) {
            alert(err.response?.data?.message);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Register</h2>

            <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
            <br />

            <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <br />

            <input
                placeholder="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <br />

            <button onClick={handleRegister}>Register</button>
        </div>
    );
}