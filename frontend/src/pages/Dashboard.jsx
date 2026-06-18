import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                    {user?.companyName ? `${user.companyName} Dashboard` : "ERP Dashboard"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Orders Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-gray-500 text-sm font-medium mb-2">Orders Today</span>
                    <span className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📦</span> 10
                    </span>
                </div>
                
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-gray-500 text-sm font-medium mb-2">Revenue</span>
                    <span className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                        <span className="text-2xl">💰</span> Rs. 25,000
                    </span>
                </div>
                
                {/* Alerts Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-gray-500 text-sm font-medium mb-2">Low Stock Alerts</span>
                    <span className="text-3xl font-bold text-red-500 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> 3
                    </span>
                </div>
            </div>
        </DashboardLayout>
    );
}