import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [ordersData, productsData] = await Promise.all([
                    getOrders(),
                    getProducts()
                ]);
                
                setOrders(ordersData || []);

                if (Array.isArray(productsData)) {
                    setProducts(productsData);
                } else if (productsData && Array.isArray(productsData.data)) {
                    setProducts(productsData.data);
                } else if (productsData && Array.isArray(productsData.products)) {
                    setProducts(productsData.products);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Calculate metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
    const totalRevenue = orders.reduce((sum, o) => {
        if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") {
            return sum; // Do not include in revenue
        }
        return sum + (o.totalAmount || 0);
    }, 0);
    const lowStockCount = products.filter(p => p.stockQuantity < 5).length;
    const returnedOrdersCount = orders.filter(o => o.orderStatus === "Returned").length;

    return (
        <DashboardLayout>
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl font-bold text-tx-main tracking-tight">
                    {user?.companyName ? `${user.companyName} Dashboard` : "ERP Dashboard"}
                </h1>
                <p className="text-tx-subtle text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                {/* Orders Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Orders Today</span>
                    <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
                        <span className="text-2xl">📦</span> {loading ? "..." : ordersToday}
                    </span>
                </Card>
                
                {/* Revenue Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Total Revenue</span>
                    <span className="text-3xl font-bold text-primary-600 flex items-center gap-2">
                        <span className="text-2xl">💰</span> {loading ? "..." : `Rs. ${totalRevenue.toLocaleString()}`}
                    </span>
                </Card>

                {/* Returned Orders Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Returned Orders</span>
                    <span className="text-3xl font-bold text-warning-600 flex items-center gap-2">
                        <span className="text-2xl">↩️</span> {loading ? "..." : returnedOrdersCount}
                    </span>
                </Card>
                
                {/* Alerts Card */}
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Low Stock Alerts</span>
                    <span className="text-3xl font-bold text-danger-500 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> {loading ? "..." : lowStockCount}
                    </span>
                </Card>
            </div>
        </DashboardLayout>
    );
}