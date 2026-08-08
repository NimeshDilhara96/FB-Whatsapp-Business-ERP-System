import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "./services/authService";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import OrderManagement from "./pages/OrderManagement";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import ProtectedRoute from "./routes/ProtectedRoute";

// Super Admin Imports
import SuperAdminRoute from "./admin/routes/SuperAdminRoute";
import SuperAdminLayout from "./admin/layouts/SuperAdminLayout";
import SuperAdminDashboard from "./admin/pages/SuperAdminDashboard";
import ManageTenants from "./admin/pages/ManageTenants";
import ManageUsers from "./admin/pages/ManageUsers";

export default function App() {
  const login = useAuthStore((state) => state.login);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await getCurrentUser();
        login(res.data.user);
      } catch (error) {
        // Not authenticated, that's fine. ProtectedRoute will redirect.
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [login]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* define the explic /login route */}
        <Route path="/login" element={<Login />} />
        {/* explic /register route */}
        <Route path="/register" element={<Register />} />


        {/* protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-management"
          element={
            <ProtectedRoute>
              <OrderManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* super admin routes */}
        <Route
          path="/superadmin"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="tenants" element={<ManageTenants />} />
          <Route path="users" element={<ManageUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
