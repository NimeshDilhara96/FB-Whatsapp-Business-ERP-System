import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import { getCustomers } from "../services/customerService";

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('7');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [ordersData, productsData, customersData] = await Promise.all([
                    getOrders(),
                    getProducts(),
                    getCustomers()
                ]);
                
                setOrders(ordersData || []);
                setCustomers(customersData || []);

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
    const { 
        ordersToday, totalRevenue, pendingRevenue, lowStockCount, returnedOrdersCount,
        inventoryValue, totalProfit, activeFunnel, totalCustomersCount, newCustomersCount
    } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let tRev = 0;
        let pRev = 0;
        let tCost = 0;
        let activeFunnel = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 };

        orders.forEach(o => {
            if (activeFunnel[o.orderStatus] !== undefined) {
                activeFunnel[o.orderStatus]++;
            }

            if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
            
            if (o.paymentStatus === "Paid") {
                tRev += (o.totalAmount || 0);
                // Calculate cost of goods sold for profit
                o.items?.forEach(item => {
                    const prod = products.find(p => p.name === item.productName);
                    if (prod && prod.costPrice) {
                        tCost += prod.costPrice * item.quantity;
                    }
                });
            } else {
                pRev += (o.totalAmount || 0);
            }
        });

        const invVal = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stockQuantity || 0)), 0);

        return {
            ordersToday: orders.filter(o => new Date(o.createdAt) >= today).length,
            totalRevenue: tRev,
            pendingRevenue: pRev,
            lowStockCount: products.filter(p => p.stockQuantity < 5).length,
            returnedOrdersCount: orders.filter(o => o.orderStatus === "Returned").length,
            totalProfit: tRev - tCost,
            inventoryValue: invVal,
            activeFunnel,
            totalCustomersCount: customers.length,
            newCustomersCount: customers.filter(c => new Date(c.createdAt) >= today).length,
        };
    }, [orders, products, customers]);

    const { chartData, topProducts, topCustomers, sourceData } = useMemo(() => {
        const now = new Date();
        const filterDate = new Date();
        if (dateFilter === '7') {
            filterDate.setDate(now.getDate() - 7);
        } else if (dateFilter === '30') {
            filterDate.setDate(now.getDate() - 30);
        } else {
            filterDate.setFullYear(2000); 
        }

        const filteredOrders = orders.filter(o => new Date(o.createdAt) >= filterDate);

        // Chart Data
        let chartData = [];
        if (dateFilter === 'all') {
            const sortedFiltered = [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const allMap = new Map();
            sortedFiltered.forEach(o => {
                if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
                if (o.paymentStatus !== "Paid") return;
                
                const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                allMap.set(dateStr, (allMap.get(dateStr) || 0) + (o.totalAmount || 0));
            });
            chartData = Array.from(allMap, ([date, sales]) => ({ date, sales }));
        } else {
            const salesDataMap = {};
            const daysToIterate = parseInt(dateFilter);
            for (let i = daysToIterate - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                salesDataMap[dateStr] = 0;
            }
            filteredOrders.forEach(o => {
                if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
                if (o.paymentStatus !== "Paid") return;

                const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (salesDataMap[dateStr] !== undefined) {
                    salesDataMap[dateStr] += (o.totalAmount || 0);
                }
            });
            chartData = Object.keys(salesDataMap).map(date => ({
                date,
                sales: salesDataMap[date]
            }));
        }

        // Top Products
        const productSales = {};
        filteredOrders.forEach(o => {
            if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
            o.items?.forEach(item => {
                const name = item.productName;
                productSales[name] = (productSales[name] || 0) + (item.quantity || 0);
            });
        });
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, sales]) => ({ name, sales }));

        // Top Customers
        const customerSales = {};
        filteredOrders.forEach(o => {
            if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
            const customer = o.customerId;
            if (customer && customer.name) {
                const id = customer._id || customer;
                if (!customerSales[id]) {
                    customerSales[id] = { name: customer.name, total: 0 };
                }
                customerSales[id].total += (o.totalAmount || 0);
            }
        });
        const topCustomers = Object.values(customerSales)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Orders by Source
        const sourceCounts = {};
        filteredOrders.forEach(o => {
            if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
            const source = o.source || 'WhatsApp';
            sourceCounts[source] = (sourceCounts[source] || 0) + (o.totalAmount || 0);
        });
        const SOURCE_COLORS = {
            'WhatsApp': '#25D366', 
            'Facebook': '#1877F2',
            'Website': '#8B5CF6',
            'Other': '#6B7280'
        };
        const sourceData = Object.entries(sourceCounts)
            .map(([name, value]) => ({ name, value, color: SOURCE_COLORS[name] || '#6B7280' }))
            .sort((a, b) => b.value - a.value);

        return { chartData, topProducts, topCustomers, sourceData };
    }, [orders, dateFilter]);

    const pendingOrders = useMemo(() => {
        return orders
            .filter(o => o.orderStatus === 'Pending')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }, [orders]);

    return (
        <DashboardLayout>
            <CustomerSidePanel 
                customer={selectedCustomer} 
                onClose={() => setSelectedCustomer(null)} 
            />
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-tx-main tracking-tight">
                        {user?.companyName ? `${user.companyName} Dashboard` : "ERP Dashboard"}
                    </h1>
                    <p className="text-tx-subtle text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
                </div>
                <div>
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-bg-surface border border-bg-border rounded-lg px-4 py-2 text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* 1. ERP & Finance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4">
                <Card className="flex flex-col border-primary-500/20 bg-primary-50/10">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Net Profit</span>
                    <span className="text-3xl font-bold text-primary-600 flex items-center gap-2">
                        <span className="text-2xl">📈</span> {loading ? "..." : `Rs. ${totalProfit.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Collected Revenue</span>
                    <span className="text-3xl font-bold text-success-600 flex items-center gap-2">
                        <span className="text-2xl">💰</span> {loading ? "..." : `Rs. ${totalRevenue.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Inventory Value</span>
                    <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
                        <span className="text-2xl">📦</span> {loading ? "..." : `Rs. ${inventoryValue.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Total Customers</span>
                    <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
                        <span className="text-2xl">👥</span> {loading ? "..." : totalCustomersCount}
                    </span>
                    <span className="text-xs text-primary-600 font-medium mt-1">
                        +{loading ? "..." : newCustomersCount} new today
                    </span>
                </Card>
            </div>

            {/* 2. Operations Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Orders Today</span>
                    <span className="text-2xl font-bold text-tx-main">{loading ? "..." : ordersToday}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Pending Revenue (COD)</span>
                    <span className="text-2xl font-bold text-warning-500">{loading ? "..." : `Rs. ${pendingRevenue.toLocaleString()}`}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Returns</span>
                    <span className="text-2xl font-bold text-orange-500">{loading ? "..." : returnedOrdersCount}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Low Stock Alerts</span>
                    <span className="text-2xl font-bold text-danger-500">{loading ? "..." : lowStockCount}</span>
                </Card>
            </div>
            
            {/* Active Order Funnel */}
            <Card className="mb-6">
                <h3 className="text-lg font-semibold text-tx-main mb-4">Active Orders Pipeline</h3>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
                    <div className="flex-1 w-full bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
                        <p className="text-warning-700 text-sm font-bold uppercase tracking-wider mb-1">Pending</p>
                        <p className="text-3xl font-black text-warning-600">{loading ? "..." : activeFunnel.Pending}</p>
                    </div>
                    <span className="text-tx-muted text-2xl hidden md:block">→</span>
                    <div className="flex-1 w-full bg-info-50 border border-info-200 rounded-xl p-4 text-center">
                        <p className="text-info-700 text-sm font-bold uppercase tracking-wider mb-1">Processing</p>
                        <p className="text-3xl font-black text-info-600">{loading ? "..." : activeFunnel.Processing}</p>
                    </div>
                    <span className="text-tx-muted text-2xl hidden md:block">→</span>
                    <div className="flex-1 w-full bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
                        <p className="text-primary-700 text-sm font-bold uppercase tracking-wider mb-1">Shipped</p>
                        <p className="text-3xl font-black text-primary-600">{loading ? "..." : activeFunnel.Shipped}</p>
                    </div>
                    <span className="text-tx-muted text-2xl hidden md:block">→</span>
                    <div className="flex-1 w-full bg-success-50 border border-success-200 rounded-xl p-4 text-center">
                        <p className="text-success-700 text-sm font-bold uppercase tracking-wider mb-1">Delivered</p>
                        <p className="text-3xl font-black text-success-600">{loading ? "..." : activeFunnel.Delivered}</p>
                    </div>
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Chart Section */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-tx-main mb-4">Sales Overview</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-tx-subtle">Loading chart...</div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${value}`} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} 
                                        itemStyle={{ color: '#10B981' }}
                                    />
                                    <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-tx-subtle">No sales data for this period</div>
                        )}
                    </div>
                </Card>

                {/* Top Products */}
                <Card>
                    <h3 className="text-lg font-semibold text-tx-main mb-4">Top Products</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-tx-subtle text-sm">Loading...</span>
                        ) : topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 font-bold text-xs">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-tx-main">{product.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-primary-400">{product.sales} sold</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-tx-subtle text-sm">No sales data</span>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders by Source */}
                <Card>
                    <h3 className="text-lg font-semibold text-tx-main mb-4">Sales by Source</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-tx-subtle text-sm">Loading...</span>
                        ) : sourceData && sourceData.length > 0 ? (
                            sourceData.map((src, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-bg-surface/50 rounded-lg border border-bg-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color }}></div>
                                        <span className="font-medium text-tx-main">{src.name}</span>
                                    </div>
                                    <span className="font-semibold text-primary-400">Rs. {src.value.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-tx-subtle text-sm text-center py-4">No data</span>
                        )}
                    </div>
                </Card>

                {/* Top Customers */}
                <Card>
                    <h3 className="text-lg font-semibold text-tx-main mb-4">Top Customers</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-tx-subtle text-sm">Loading...</span>
                        ) : topCustomers.length > 0 ? (
                            topCustomers.map((customer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-bg-surface/50 rounded-lg border border-bg-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400 font-bold">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-tx-main">{customer.name}</span>
                                    </div>
                                    <span className="font-semibold text-primary-400">Rs. {customer.total.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-tx-subtle text-sm">No customer data</span>
                        )}
                    </div>
                </Card>

                {/* Pending Orders */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-tx-main">Pending Orders</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold bg-warning-900/30 text-warning-400 rounded-full">
                            {orders.filter(o => o.orderStatus === 'Pending').length} Total
                        </span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <span className="text-tx-subtle text-sm">Loading...</span>
                        ) : pendingOrders.length > 0 ? (
                            pendingOrders.map((order, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between p-3 bg-bg-surface/50 rounded-lg border border-bg-border/50 cursor-pointer hover:bg-base-surface transition-colors"
                                    onClick={() => {
                                        if (order.customerId) setSelectedCustomer(order.customerId);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-tx-main">{order.customerId?.name || 'Unknown'}</span>
                                        <span className="text-xs text-tx-subtle">
                                            {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-semibold text-tx-main">Rs. {order.totalAmount?.toLocaleString()}</span>
                                        <span className="text-xs text-warning-400 font-medium">Pending</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="text-tx-subtle text-sm py-4">No pending orders</span>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}