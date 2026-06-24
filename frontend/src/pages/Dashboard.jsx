import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);

    return (
        <DashboardLayout>
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl font-bold text-tx-main tracking-tight">
                    {user?.companyName ? `${user.companyName} Dashboard` : "ERP Dashboard"}
                </h1>
                <p className="text-tx-subtle text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Orders Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Orders Today</span>
                    <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
                        <span className="text-2xl">📦</span> 10
                    </span>
                </Card>
                
                {/* Revenue Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Revenue</span>
                    <span className="text-3xl font-bold text-primary-600 flex items-center gap-2">
                        <span className="text-2xl">💰</span> Rs. 25,000
                    </span>
                </Card>
                
                {/* Alerts Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Low Stock Alerts</span>
                    <span className="text-3xl font-bold text-danger-500 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> 3
                    </span>
                </Card>
            </div>
        </DashboardLayout>
    );
}