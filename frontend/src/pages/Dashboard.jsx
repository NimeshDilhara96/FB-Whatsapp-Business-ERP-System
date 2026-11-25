import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import { Link } from "react-router-dom";
import {
  FiChevronDown, FiChevronRight, FiClipboard, FiRotateCcw, FiCheck,
  FiAlertTriangle, FiPlus, FiPhone, FiBarChart2, FiLoader
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { updateOrderDetails } from "../services/orderService";

const toWhatsAppNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
};

const formatPaymentShort = (method) => {
    if (!method || method === "Cash on Delivery") return "COD";
    if (method === "Direct Bank Transfer") return "Bank transfer";
    if (method === "Online Payment") return "Online";
    return method;
};

const getSourceBadgeClass = (source) => {
    if (source === "WhatsApp") return "bg-emerald-50 text-emerald-700";
    if (source === "Facebook") return "bg-blue-50 text-blue-700";
    if (source === "Instagram") return "bg-pink-50 text-pink-700";
    return "bg-gray-100 text-gray-700";
};

const formatRelativeOrderAge = (createdAt) => {
    if (!createdAt) return { label: "", isOld: false };
    const d = new Date(createdAt);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return { label: "Today", isOld: false };
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return { label: "Yesterday", isOld: false };
    }
    const days = Math.max(1, Math.floor((now - d) / 86400000));
    let label;
    if (days < 7) label = `${days} days ago`;
    else if (days < 30) label = `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
    else if (days < 365) label = `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
    else label = `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
    return { label, isOld: days >= 3 };
};

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('7');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);

    const loadDashboardData = useCallback(async (filter) => {
        const { getDashboardAnalytics } = await import('../services/analyticsService');
        return getDashboardAnalytics(filter);
    }, []);

    useEffect(() => {
        let active = true;
        loadDashboardData(dateFilter)
            .then((data) => {
                if (active) setDashboardData(data);
            })
            .catch((error) => {
                console.error("Failed to fetch dashboard data", error);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [dateFilter, loadDashboardData]);

    const handleDateFilterChange = (value) => {
        setLoading(true);
        setDateFilter(value);
    };

    const handleConfirmPendingOrder = async (orderId) => {
        try {
            setConfirmingId(orderId);
            await updateOrderDetails(orderId, { orderStatus: "Processing" });
            const data = await loadDashboardData(dateFilter);
            setDashboardData(data);
        } catch (error) {
            console.error("Failed to confirm order", error);
            alert(error.response?.data?.message || "Failed to confirm order");
        } finally {
            setConfirmingId(null);
        }
    };

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
                        <h1 className="text-xl font-bold tracking-tight truncate text-tx-main">
                            {user?.companyName || "ERP Dashboard"}
                        </h1>
                        <p className="text-tx-subtle text-xs mt-0.5">Welcome back, {user?.name || 'Admin'}</p>
                    </div>
                    <div className="relative shrink-0">
                        <select
                            value={dateFilter}
                            onChange={(e) => handleDateFilterChange(e.target.value)}
                            className="py-2 pl-3 pr-8 text-xs font-semibold border shadow-sm appearance-none bg-base-surface border-base-border rounded-xl text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="all">All time</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tx-muted" />
                    </div>
                </div>

                {/* Net Profit Hero Card */}
                <div className="p-4 mb-3 text-white shadow-md rounded-2xl bg-emerald-800">
                    <p className="text-xs font-medium text-emerald-100">Net profit</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                        {loading ? "..." : `${currency} ${totalProfit.toLocaleString()}`}
                    </p>
                    <div className="flex items-end justify-between gap-3 pt-3 mt-4 border-t border-white/15">
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
                <div className="p-4 mb-3 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
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
                                className="flex items-center gap-3 px-1 py-2 -mx-1 transition-colors rounded-lg hover:bg-base-bg"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-tx-main">{title}</p>
                                    <p className="text-[11px] text-tx-subtle truncate">{subtitle}</p>
                                </div>
                                <span className="text-base font-bold text-tx-main">{loading ? "..." : count}</span>
                                <FiChevronRight className="w-4 h-4 text-tx-subtle" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-4 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                        <p className="text-[11px] text-tx-subtle">Orders today</p>
                        <p className="mt-1 text-xl font-bold text-tx-main tabular-nums">{loading ? "..." : ordersToday}</p>
                    </div>
                    <div className="p-4 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                        <p className="text-[11px] text-tx-subtle">Pending COD</p>
                        <p className="mt-1 text-xl font-bold text-tx-main tabular-nums">{loading ? "..." : `${currency} ${pendingRevenue.toLocaleString()}`}</p>
                    </div>
                </div>

                {/* Active Orders Pipeline */}
                <div className="mb-5">
                    <h3 className="text-sm font-bold text-tx-main mb-2.5">Active orders</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                        {[
                            { key: "Pending", label: "Pending", dot: "bg-amber-500", count: activeFunnel.Pending || 0, highlight: true },
                            { key: "Processing", label: "Processing", dot: "bg-blue-500", count: activeFunnel.Processing || 0 },
                            { key: "Shipped", label: "Shipped", dot: "bg-emerald-600", count: activeFunnel.Shipped || 0 },
                            { key: "Delivered", label: "Delivered", dot: "bg-gray-500", count: activeFunnel.Delivered || 0 },
                        ].map(({ key, label, dot, count, highlight }) => (
                            <Link
                                key={key}
                                to="/order-management"
                                className={`flex items-center justify-between px-3.5 py-3.5 rounded-2xl border shadow-xs transition-colors ${
                                    highlight && count > 0
                                        ? "bg-amber-50/40 border-amber-500/80"
                                        : "bg-base-surface border-base-border-subtle"
                                }`}
                            >
                                <span className="flex items-center gap-2 text-xs font-semibold text-tx-main">
                                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                                    {label}
                                </span>
                                <span className="text-lg font-bold text-tx-main tabular-nums">
                                    {loading ? "…" : count}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="text-sm font-bold text-tx-main">Pending orders</h3>
                        <span className="text-xs text-tx-subtle tabular-nums">
                            {loading ? "…" : `${pendingCount} total`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-6 text-xs text-center border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle text-tx-subtle">
                            Loading pending orders…
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="p-6 text-center border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                            <p className="text-xs font-semibold text-tx-main">All caught up</p>
                            <p className="text-[11px] text-tx-subtle mt-0.5">No pending orders waiting for confirmation.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {pendingOrders.map((order) => {
                                const phone = order.customerId?.whatsappNumber;
                                const itemCount = order.items?.length || 0;
                                const age = formatRelativeOrderAge(order.createdAt);
                                const isConfirming = confirmingId === order._id;

                                return (
                                    <div
                                        key={order._id}
                                        className="p-4 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => order.customerId && setSelectedCustomer(order.customerId)}
                                                    className="max-w-full text-sm font-bold text-left truncate text-tx-main"
                                                >
                                                    {order.customerId?.name || "Unknown"}
                                                </button>
                                                <p className={`text-[11px] mt-0.5 ${age.isOld ? "text-danger-600 font-medium" : "text-tx-subtle"}`}>
                                                    {age.label} · {itemCount} {itemCount === 1 ? "item" : "items"}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-tx-main tabular-nums shrink-0">
                                                {currency} {(order.totalAmount || 0).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-2.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${getSourceBadgeClass(order.source || "WhatsApp")}`}>
                                                {order.source || "WhatsApp"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
                                                {formatPaymentShort(order.paymentMethod)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-2 mt-3">
                                            <a
                                                href={phone ? `https://wa.me/${toWhatsAppNumber(phone)}` : undefined}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`h-9 inline-flex items-center justify-center gap-1.5 rounded-xl border border-base-border bg-base-surface text-xs font-semibold text-tx-main transition-colors hover:bg-base-bg ${
                                                    phone ? "" : "opacity-40 pointer-events-none"
                                                }`}
                                            >
                                                <FaWhatsapp className="w-3.5 h-3.5 text-tx-muted" />
                                                Chat
                                            </a>
                                            <a
                                                href={phone ? `tel:${phone}` : undefined}
                                                className={`h-9 inline-flex items-center justify-center gap-1.5 rounded-xl border border-base-border bg-base-surface text-xs font-semibold text-tx-main transition-colors hover:bg-base-bg ${
                                                    phone ? "" : "opacity-40 pointer-events-none"
                                                }`}
                                            >
                                                <FiPhone className="w-3.5 h-3.5 text-tx-muted" />
                                                Call
                                            </a>
                                            <button
                                                type="button"
                                                disabled={isConfirming}
                                                onClick={() => handleConfirmPendingOrder(order._id)}
                                                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                                            >
                                                {isConfirming ? (
                                                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <FiCheck className="w-3.5 h-3.5" />
                                                )}
                                                {isConfirming ? "Saving…" : "Confirm"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sales Overview */}
                <div className="p-4 mb-5 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                    <h3 className="mb-3 text-sm font-bold text-tx-main">Sales overview</h3>
                    {loading ? (
                        <div className="flex items-center justify-center text-xs h-36 text-tx-subtle">
                            Loading chart…
                        </div>
                    ) : chartData.some((d) => Number(d.sales) > 0) ? (
                        <div className="w-full h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6', fontSize: '12px' }}
                                        itemStyle={{ color: '#10B981' }}
                                        formatter={(value) => [`${currency} ${Number(value).toLocaleString()}`, "Sales"]}
                                    />
                                    <Bar dataKey="sales" fill="#065F46" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-8 text-center rounded-xl bg-base-bg">
                            <FiBarChart2 className="w-5 h-5 mb-2 text-tx-subtle" />
                            <p className="text-xs font-bold text-tx-main">No sales yet</p>
                            <p className="text-[11px] text-tx-subtle mt-0.5">
                                Confirmed orders will appear here as a chart.
                            </p>
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="p-4 mb-5 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                    <h3 className="mb-3 text-sm font-bold text-tx-main">Top customers</h3>
                    {loading ? (
                        <p className="text-xs text-tx-subtle">Loading…</p>
                    ) : topCustomers.length > 0 ? (
                        <div className="flex flex-col divide-y divide-base-border-subtle">
                            {topCustomers.map((customer, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center min-w-0 gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-indigo-600 rounded-full bg-indigo-50 shrink-0">
                                            {customer.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <span className="text-xs font-semibold truncate text-tx-main">{customer.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-tx-main tabular-nums shrink-0">
                                        {currency} {(customer.total || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-tx-subtle">No customer data yet.</p>
                    )}
                </div>

                {/* Top Products (shown when sales exist) */}
                {!loading && topProducts.length > 0 && (
                    <div className="p-4 mb-5 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                        <h3 className="mb-3 text-sm font-bold text-tx-main">Top products</h3>
                        <div className="flex flex-col divide-y divide-base-border-subtle">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center min-w-0 gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-700 font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                                            {index + 1}
                                        </span>
                                        <span className="text-xs font-semibold truncate text-tx-main">{product.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-700 tabular-nums shrink-0">
                                        {product.sales} sold
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sales by Source (shown when paid orders exist) */}
                {!loading && sourceData.length > 0 && (
                    <div className="p-4 mb-4 border shadow-sm bg-base-surface rounded-2xl border-base-border-subtle">
                        <h3 className="mb-3 text-sm font-bold text-tx-main">Sales by source</h3>
                        <div className="flex flex-col divide-y divide-base-border-subtle">
                            {sourceData.map((src, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                                        <span className="text-xs font-semibold truncate text-tx-main">{src.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-tx-main tabular-nums shrink-0">
                                        {currency} {(src.value || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Floating New Order Button */}
                <Link
                    to="/orders"
                    className="fixed z-30 flex items-center gap-2 py-3 pl-4 pr-5 text-sm font-semibold text-white transition-colors rounded-full shadow-lg right-4 bottom-20 bg-emerald-800 hover:bg-emerald-900"
                >
                    <FiPlus className="w-4 h-4" />
                    New order
                </Link>
            </div>

            {/* ───────── Desktop View ───────── */}
            <div className="hidden md:block">
            <div className="flex flex-col justify-between gap-4 mb-6 md:mb-8 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-tx-main">
                        {user?.companyName ? `${user.companyName} Dashboard` : "ERP Dashboard"}
                    </h1>
                    <p className="mt-1 text-sm text-tx-subtle">Welcome back, {user?.name || 'Admin'}</p>
                </div>
                <div>
                    <select
                        value={dateFilter}
                        onChange={(e) => handleDateFilterChange(e.target.value)}
                        className="px-4 py-2 text-sm border rounded-lg bg-bg-surface border-bg-border text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* 1. ERP & Finance Overview */}
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                <Card className="flex flex-col border-primary-500/20 bg-primary-50/10">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Net Profit</span>
                    <span className="flex items-center gap-2 text-3xl font-bold text-primary-600">
                        <span className="text-2xl">📈</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${totalProfit.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Collected Revenue</span>
                    <span className="flex items-center gap-2 text-3xl font-bold text-success-600">
                        <span className="text-2xl">💰</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${totalRevenue.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Inventory Value</span>
                    <span className="flex items-center gap-2 text-3xl font-bold text-tx-main">
                        <span className="text-2xl">📦</span> {loading ? "..." : `${user?.currency || 'Rs.'} ${inventoryValue.toLocaleString()}`}
                    </span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Total Customers</span>
                    <span className="flex items-center gap-2 text-3xl font-bold text-tx-main">
                        <span className="text-2xl">👥</span> {loading ? "..." : totalCustomersCount}
                    </span>
                    <span className="mt-1 text-xs font-medium text-primary-600">
                        +{loading ? "..." : newCustomersCount} new today
                    </span>
                </Card>
            </div>

            {/* 2. Operations Overview */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Orders Today</span>
                    <span className="text-2xl font-bold text-tx-main">{loading ? "..." : ordersToday}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Pending Revenue (COD)</span>
                    <span className="text-2xl font-bold text-warning-500">{loading ? "..." : `${user?.currency || 'Rs.'} ${pendingRevenue.toLocaleString()}`}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Returns</span>
                    <span className="text-2xl font-bold text-orange-500">{loading ? "..." : returnedOrdersCount}</span>
                </Card>
                <Card className="flex flex-col">
                    <span className="mb-2 text-sm font-medium text-tx-subtle">Low Stock Alerts</span>
                    <span className="text-2xl font-bold text-danger-500">{loading ? "..." : lowStockCount}</span>
                </Card>
            </div>
            
            {/* Active Order Funnel */}
            <Card className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-tx-main">Active Orders Pipeline</h3>
                <div className="flex flex-col items-center justify-between w-full gap-4 md:flex-row">
                    <div className="flex-1 w-full p-4 text-center border bg-warning-50 border-warning-200 rounded-xl">
                        <p className="mb-1 text-sm font-bold tracking-wider uppercase text-warning-700">Pending</p>
                        <p className="text-3xl font-black text-warning-600">{loading ? "..." : activeFunnel.Pending}</p>
                    </div>
                    <span className="hidden text-2xl text-tx-muted md:block">→</span>
                    <div className="flex-1 w-full p-4 text-center border bg-info-50 border-info-200 rounded-xl">
                        <p className="mb-1 text-sm font-bold tracking-wider uppercase text-info-700">Processing</p>
                        <p className="text-3xl font-black text-info-600">{loading ? "..." : activeFunnel.Processing}</p>
                    </div>
                    <span className="hidden text-2xl text-tx-muted md:block">→</span>
                    <div className="flex-1 w-full p-4 text-center border bg-primary-50 border-primary-200 rounded-xl">
                        <p className="mb-1 text-sm font-bold tracking-wider uppercase text-primary-700">Shipped</p>
                        <p className="text-3xl font-black text-primary-600">{loading ? "..." : activeFunnel.Shipped}</p>
                    </div>
                    <span className="hidden text-2xl text-tx-muted md:block">→</span>
                    <div className="flex-1 w-full p-4 text-center border bg-success-50 border-success-200 rounded-xl">
                        <p className="mb-1 text-sm font-bold tracking-wider uppercase text-success-700">Delivered</p>
                        <p className="text-3xl font-black text-success-600">{loading ? "..." : activeFunnel.Delivered}</p>
                    </div>
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
                {/* Chart Section */}
                <Card className="lg:col-span-2">
                    <h3 className="mb-4 text-lg font-semibold text-tx-main">Sales Overview</h3>
                    <div className="w-full h-72">
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
                    <h3 className="mb-4 text-lg font-semibold text-tx-main">Top Products</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-sm text-tx-subtle">Loading...</span>
                        ) : topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-primary-900/50 text-primary-400">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-tx-main">{product.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-primary-400">{product.sales} sold</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-tx-subtle">No sales data</span>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Orders by Source */}
                <Card>
                    <h3 className="mb-4 text-lg font-semibold text-tx-main">Sales by Source</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-sm text-tx-subtle">Loading...</span>
                        ) : sourceData && sourceData.length > 0 ? (
                            sourceData.map((src, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-bg-surface/50 border-bg-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color }}></div>
                                        <span className="font-medium text-tx-main">{src.name}</span>
                                    </div>
                                    <span className="font-semibold text-primary-400">{user?.currency || 'Rs.'} {src.value.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <span className="py-4 text-sm text-center text-tx-subtle">No data</span>
                        )}
                    </div>
                </Card>

                {/* Top Customers */}
                <Card>
                    <h3 className="mb-4 text-lg font-semibold text-tx-main">Top Customers</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <span className="text-sm text-tx-subtle">Loading...</span>
                        ) : topCustomers.length > 0 ? (
                            topCustomers.map((customer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-bg-surface/50 border-bg-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 font-bold text-indigo-400 rounded-full bg-indigo-900/30">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-tx-main">{customer.name}</span>
                                    </div>
                                    <span className="font-semibold text-primary-400">{user?.currency || 'Rs.'} {customer.total.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-tx-subtle">No customer data</span>
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
                            <span className="text-sm text-tx-subtle">Loading...</span>
                        ) : pendingOrders.length > 0 ? (
                            pendingOrders.map((order, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between p-3 transition-colors border rounded-lg cursor-pointer bg-bg-surface/50 border-bg-border/50 hover:bg-base-surface"
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
                                        <span className="text-xs font-medium text-warning-400">Pending</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="py-4 text-sm text-tx-subtle">No pending orders</span>
                        )}
                    </div>
                </Card>
            </div>
            </div>
        </DashboardLayout>
    );
}