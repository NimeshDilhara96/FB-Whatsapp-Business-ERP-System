import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Sidebar({ isOpen, onClose }) {
  const logout = useAuthStore((state) => state.logout);
  const navItemClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-tx-muted hover:text-primary-700 hover:bg-primary-50 transition-colors cursor-pointer";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-tx-main/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-base-surface border-r border-base-border flex flex-col shadow-sm z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-base-border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg shadow-sm shadow-primary-200 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-tx-main tracking-tight">
              SocialERP
            </h2>
          </div>
          {/* Close button (Mobile only) */}
          <button
            onClick={onClose}
            className="md:hidden text-tx-subtle hover:text-tx-main"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1.5">
          <Link to="/dashboard" onClick={onClose} className={navItemClass}>
            <span className="text-lg">📊</span> Dashboard
          </Link>
          <Link to="/products" onClick={onClose} className={navItemClass}>
            <span className="text-lg">📦</span> Products
          </Link>
          <Link to="/customers" onClick={onClose} className={navItemClass}>
            <span className="text-lg">👥</span> Customers
          </Link>
          <Link to="/orders" onClick={onClose} className={navItemClass}>
            <span className="text-lg">🧾</span> Create Order
          </Link>
          <Link to="/order-management" onClick={onClose} className={navItemClass}>
            <span className="text-lg">📋</span> Manage Orders
          </Link>
          <p className={navItemClass}>
            <span className="text-lg">📦</span> Inventory
          </p>
          <p className={navItemClass}>
            <span className="text-lg">💰</span> Reports
          </p>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-base-border-subtle shrink-0">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-tx-muted bg-base-bg border border-base-border rounded-xl hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
