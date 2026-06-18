import { useAuthStore } from "../store/authStore";

export default function DashboardLayout({ children }) {
    const logout = useAuthStore((state) => state.logout);

    const navItemClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer";

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800">

            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
                
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg shadow-sm shadow-emerald-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">SocialERP</h2>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1.5">
                    <p className={navItemClass}><span className="text-lg">📊</span> Dashboard</p>
                    <p className={navItemClass}><span className="text-lg">📦</span> Products</p>
                    <p className={navItemClass}><span className="text-lg">👥</span> Customers</p>
                    <p className={navItemClass}><span className="text-lg">🧾</span> Orders</p>
                    <p className={navItemClass}><span className="text-lg">📦</span> Inventory</p>
                    <p className={navItemClass}><span className="text-lg">💰</span> Reports</p>
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button 
                        onClick={logout} 
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50">
                <div className="p-8 max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </div>
            
        </div>
    );
}