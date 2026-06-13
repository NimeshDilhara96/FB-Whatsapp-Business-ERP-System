import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const token = useAuthStore((state) => state.token);

    if (!token) {
        return <Navigate to="/" />;
    }

    return children;
}