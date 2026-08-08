import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const SuperAdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "superadmin") {
    // Redirect normal users to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default SuperAdminRoute;
