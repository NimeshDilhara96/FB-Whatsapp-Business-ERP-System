import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import { Link } from "react-router-dom";
import {
  FiChevronDown, FiChevronRight, FiClipboard, FiRotateCcw, FiCheck, FiAlertTriangle, FiPlus
} from "react-icons/fi";

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('7');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const { getDashboardAnalytics } = await import('../services/analyticsService');
                const data = await getDashboardAnalytics(dateFilter);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [dateFilter]);

    // Extract metrics with defaults
    const { 
        ordersToday = 0, totalRevenue = 0, pendingRevenue = 0, lowStockCount = 0, returnedOrdersCount = 0,
        inventoryValue = 0, totalProfit = 0, activeFunnel = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 }, 
        totalCustomersCount = 0, newCustomersCount = 0,
        chartData = [], topProducts = [], topCustomers = [], sourceData = [], recentPendingOrders = []
    } = dashboardData || {};

    const pendingOrders = recentPendingOrders;
    const currency = user?.currency || 'Rs.';
    const pendingCount = activeFunnel?.Pending || 0;

    // Mobile "Needs attention" list
    const attentionItems = [
        {
            key: 'confirm',
            to: '/order-management',
            icon: FiClipboard,
            iconClass: 'bg-amber-100 text-amber-600',
            title: 'Orders to confirm',
            subtitle: `${currency} ${pendingRevenue.toLocaleString()} waiting on COD`,
            count: pendingCount,
        },
        {
            key: 'returns',
            to: '/order-management',
            icon: FiRotateCcw,
            iconClass: 'bg-orange-100 text-orange-600',
            title: 'Returns',
            subtitle: 'Follow up with customer',
            count: returnedOrdersCount,
        },
        {
            key: 'stock',
            to: '/products',
            icon: lowStockCount > 0 ? FiAlertTriangle : FiCheck,
            iconClass: lowStockCount > 0 ? 'bg-danger-50 text-danger-600' : 'bg-primary-50 text-primary-600',
            title: 'Low stock',
            subtitle: lowStockCount > 0 ? `${lowStockCount} product${lowStockCount > 1 ? 's' : ''} running low` : 'All products well stocked',
            count: lowStockCount,
        },
    ];
    const attentionCount = attentionItems.length;

    return (
        <DashboardLayout>
            <CustomerSidePanel 
                customer={selectedCustomer} 
                onClose={() => setSelectedCustomer(null)} 
            />
            {/* ───────── Mobile View ───────── */}
            <div className="md:hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-tx-main tracking-tight truncate">
                            {user?.companyName || "ERP Dashboard"}
                        </h1>
                        <p className="text-tx-subtle text-xs mt-0.5">Welcome back, {user?.name || 'Admin'}</p>
                    </div>
                    <div className="relative shrink-0">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="appearance-none bg-base-surface border border-base-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-tx-main shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="all">All time</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tx-muted" />
                    </div>
                </div>

                {/* Net Profit Hero Card */}
                <div className="rounded-2xl bg-emerald-800 text-white p-4 shadow-md mb-3">
                    <p className="text-xs font-medium text-emerald-100">Net profit</p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                        {loading ? "..." : `${currency} ${totalProfit.toLocaleString()}`}
                    </p>
                    <div className="border-t border-white/15 mt-4 pt-3 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] text-emerald-100">Collected revenue</p>
                            <p className="text-sm font-bold">{loading ? "..." : `${currency} ${totalRevenue.toLocaleString()}`}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] text-emerald-100">Inventory value</p>
                            <p className="text-sm font-bold">{loading ? "..." : `${currency} ${inventoryValue.toLocaleString()}`}</p>
                        </div>
                    </div>
                </div>

                {/* Needs Attention */}
                <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-tx-main">Needs attention</h3>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-700 rounded-full">
                            {loading ? "..." : `${attentionCount} items`}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {attentionItems.map(({ key, to, icon: Icon, iconClass, title, subtitle, count }) => (
                            <Link
                                key={key}
                                to={to}
                                className="flex items-center gap-3 py-2 -mx-1 px-1 rounded-lg hover:bg-base-bg transition-colors"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-tx-main truncate">{title}</p>
                                    <p className="text-[11px] text-tx-subtle truncate">{subtitle}</p>
                                </div>
                                <span className="text-base font-bold text-tx-main">{loading ? "..." : count}</span>
                                <FiChevronRight className="w-4 h-4 text-tx-subtle" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4">
                        <p className="text-[11px] text-tx-subtle">Orders today</p>
                        <p className="text-xl font-bold text-tx-main mt-1">{loading ? "..." : ordersToday}</p>
                    </div>
                    <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4">
                        <p className="text-[11px] text-tx-subtle">Pending COD</p>
                        <p className="text-xl font-bold text-tx-main mt-1">{loading ? "..." : `${currency} ${pendingRevenue.toLocaleString()}`}</p>
                    </div>
                </div>

                {/* Floating New Order Button */}
                <Link
                    to="/orders"
                    className="fixed right-4 bottom-20 z-30 flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold pl-4 pr-5 py-3 rounded-full shadow-lg transition-colors"
                >
                    <FiPlus className="w-4 h-4" />
                    New order
                </Link>
            </div>

            {/* ───────── Desktop View ───────── */}
            <div className="hidden md:block">
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
                        <span className="text-2xl">📈</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${totalProfit.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Collected Revenue</span>
                    <span className="text-3xl font-bold text-success-600 flex items-center gap-2">
                        <span className="text-2xl">💰</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${totalRevenue.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="text-tx-subtle text-sm font-medium mb-2">Inventory Value</span>
                    <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
                        <span className="text-2xl">📦</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${inventoryValue.toLocaleString()}`}
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
                    <span className="text-2xl font-bold text-warning-500">{loading ? "..." : `${user?.currency || 'Rs.'} ${pendingRevenue.toLocaleString()}`}</span>
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
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${user?.currency || 'Rs.'}${value}`} />
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
                                    <span className="font-semibold text-primary-400">{user?.currency || 'Rs.'} {src.value.toLocaleString()}</span>
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
                                    <span className="font-semibold text-primary-400">{user?.currency || 'Rs.'} {customer.total.toLocaleString()}</span>
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
                            {loading ? "..." : activeFunnel.Pending} Total
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
                                        <span className="font-semibold text-tx-main">{user?.currency || 'Rs.'} {order.totalAmount?.toLocaleString()}</span>
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
            </div>
        </DashboardLayout>
    );
}