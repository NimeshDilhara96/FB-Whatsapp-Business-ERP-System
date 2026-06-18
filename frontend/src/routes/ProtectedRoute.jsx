import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const token = useAuthStore((state) => state.accessToken);

    if (!token) {
        return <Navigate to="/login" />;
    }

    return children;
}