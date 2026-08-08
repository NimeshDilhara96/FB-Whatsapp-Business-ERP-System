import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  FiPieChart,
  FiUsers,
  FiBriefcase,
  FiLogOut,
} from "react-icons/fi";

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/superadmin/dashboard", icon: FiPieChart },
    { name: "Tenants", href: "/superadmin/tenants", icon: FiBriefcase },
    { name: "Users", href: "/superadmin/users", icon: FiUsers },
  ];

  return (
    <div className="flex h-screen bg-base-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-base-border flex flex-col">
        <div className="p-6 border-b border-base-border">
          <h2 className="text-xl font-bold text-primary-600">ERP Admin</h2>
          <p className="text-xs text-tx-muted mt-1">Super Administrator</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-tx-main hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-base-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-tx-main truncate">
                {user?.name}
              </p>
              <p className="text-xs text-tx-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-base-bg p-8">
        <Outlet />
      </main>
    </div>
  );
}
