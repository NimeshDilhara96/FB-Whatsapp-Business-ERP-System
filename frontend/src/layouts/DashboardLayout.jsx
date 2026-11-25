import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiClipboard, FiUsers, FiBox, FiMoreHorizontal, FiBell } from "react-icons/fi";
import Sidebar from "../components/layout/Sidebar";
import orderflowLogo from "../assets/orderflow_logo_transparent.png";

const mobileNavItems = [
    { to: "/dashboard", label: "Home", icon: FiHome },
    { to: "/order-management", label: "Orders", icon: FiClipboard },
    { to: "/customers", label: "Customers", icon: FiUsers },
    { to: "/products", label: "Inventory", icon: FiBox },
];

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navClass = ({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] font-semibold transition-colors ${
            isActive ? "text-primary-600" : "text-tx-muted hover:text-tx-main"
        }`;

    return (
        <div className="flex h-screen bg-base-bg font-sans text-tx-main overflow-hidden">

            {/* Sidebar */}
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden h-16 bg-base-surface border-b border-base-border-subtle flex items-center justify-between px-4 shrink-0">
                    <NavLink to="/dashboard" className="flex items-center -ml-2">
                        <img
                            src={orderflowLogo}
                            alt="Orderflow Logo"
                            className="object-contain w-auto h-14"
                        />
                    </NavLink>
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="relative p-2 -mr-2 text-tx-main hover:text-primary-600"
                    >
                        <FiBell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white" />
                    </button>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-4 pb-28 md:p-8 max-w-7xl mx-auto min-h-full">
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Navigation (Hidden on Desktop) */}
                <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-base-surface border-t border-base-border flex items-stretch">
                    {mobileNavItems.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={navClass}>
                            <Icon className="w-5 h-5" />
                            {label}
                        </NavLink>
                    ))}
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] font-semibold text-tx-muted hover:text-tx-main"
                    >
                        <FiMoreHorizontal className="w-5 h-5" />
                        More
                    </button>
                </nav>
            </div>

        </div>
    );
}
