import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuthStore } from "../store/authStore";

const Reports = () => {
  const user = useAuthStore((state) => state.user);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { getReportAnalytics } = await import('../services/analyticsService');
      const data = await getReportAnalytics(timeframe);
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const {
      totalOrders = 0, totalRevenue = 0, pendingRevenue = 0, returnedOrders = 0, cancelledOrders = 0, returnRate = 0,
      totalFilteredProfit = 0, aov = 0,
      topProducts = [], topCustomers = [], orderStatusData = [], chartData = [], sourceData = [],
      quickStats = { salesToday: 0, profitToday: 0, salesThisWeek: 0, profitThisWeek: 0, salesThisMonth: 0, profitThisMonth: 0 }
  } = reportData || {};

  const { salesToday, salesThisWeek, salesThisMonth, profitToday, profitThisWeek, profitThisMonth } = quickStats;


  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx-main tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-tx-subtle text-sm mt-1">
            Deep dive into your sales, products, and customer data
          </p>
        </div>
      </div>

      {/* Quick Sales Overview (Independent of Timeframe) */}
      <h3 className="text-lg font-semibold text-tx-main mb-3">Quick Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="flex flex-col bg-primary-900/10 border-primary-500/20">
          <span className="text-primary-400 text-sm font-medium mb-2">Sales Today</span>
          <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
            {user?.currency || 'Rs.'} {loading ? "..." : salesToday.toLocaleString()}
          </span>
          <span className="text-xs text-success-500 font-medium mt-1">
             Profit: {user?.currency || 'Rs.'} {loading ? "..." : profitToday.toLocaleString()}
          </span>
        </Card>
        <Card className="flex flex-col bg-primary-900/10 border-primary-500/20">
          <span className="text-primary-400 text-sm font-medium mb-2">Sales This Week</span>
          <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
            {user?.currency || 'Rs.'} {loading ? "..." : salesThisWeek.toLocaleString()}
          </span>
          <span className="text-xs text-success-500 font-medium mt-1">
             Profit: {user?.currency || 'Rs.'} {loading ? "..." : profitThisWeek.toLocaleString()}
          </span>
        </Card>
        <Card className="flex flex-col bg-primary-900/10 border-primary-500/20">
          <span className="text-primary-400 text-sm font-medium mb-2">Sales This Month</span>
          <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
            {user?.currency || 'Rs.'} {loading ? "..." : salesThisMonth.toLocaleString()}
          </span>
          <span className="text-xs text-success-500 font-medium mt-1">
             Profit: {user?.currency || 'Rs.'} {loading ? "..." : profitThisMonth.toLocaleString()}
          </span>
        </Card>
        <Card className="flex flex-col bg-success-900/10 border-success-500/20">
          <span className="text-success-400 text-sm font-medium mb-2">Monthly Margin</span>
          <span className="text-3xl font-bold text-success-500 flex items-center gap-2">
            {loading ? "..." : (salesThisMonth > 0 ? ((profitThisMonth / salesThisMonth) * 100).toFixed(1) : 0)}%
          </span>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-t border-bg-border pt-6">
        <h3 className="text-lg font-semibold text-tx-main">Detailed Analysis</h3>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <label className="text-sm font-medium text-tx-subtle">Filter Period:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 border border-bg-border rounded-md text-sm text-tx-main bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="28days">Last 28 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Filtered Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Total Orders</span>
          <span className="text-2xl font-bold text-tx-main">{loading ? "..." : totalOrders}</span>
        </Card>
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Collected Revenue</span>
          <span className="text-2xl font-bold text-primary-500">{user?.currency || 'Rs.'} {loading ? "..." : totalRevenue.toLocaleString()}</span>
        </Card>
        <Card className="flex flex-col bg-success-900/10 border-success-500/20">
          <span className="text-success-400 text-sm font-medium mb-2">Net Profit</span>
          <span className="text-2xl font-bold text-success-500">{user?.currency || 'Rs.'} {loading ? "..." : totalFilteredProfit.toLocaleString()}</span>
        </Card>
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Average Order</span>
          <span className="text-2xl font-bold text-info-500">{user?.currency || 'Rs.'} {loading ? "..." : Math.round(aov).toLocaleString()}</span>
        </Card>
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Pending Revenue</span>
          <span className="text-2xl font-bold text-warning-500">{user?.currency || 'Rs.'} {loading ? "..." : pendingRevenue.toLocaleString()}</span>
        </Card>
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Return Rate</span>
          <span className="text-2xl font-bold text-danger-500">{loading ? "..." : `${returnRate}%`}</span>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
            <h3 className="text-lg font-semibold text-tx-main mb-4">Sales Trend</h3>
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
                            <Bar dataKey="sales" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-tx-subtle">No sales data for this period</div>
                )}
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
            <h3 className="text-lg font-semibold text-tx-main mb-4">Sales by Source</h3>
            <div className="h-72 w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-tx-subtle">Loading chart...</div>
                ) : sourceData && sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} 
                                itemStyle={{ color: '#F3F4F6' }}
                                formatter={(value) => `${user?.currency || 'Rs.'} ${value}`}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-tx-subtle">No data</div>
                )}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-tx-main mb-4">Order Status</h3>
            <div className="h-72 w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-tx-subtle">Loading chart...</div>
                ) : orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} 
                                itemStyle={{ color: '#F3F4F6' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-tx-subtle">No data</div>
                )}
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
            <h3 className="text-lg font-semibold text-tx-main mb-4">Most Profitable Products</h3>
            <div className="flex flex-col gap-4">
                {loading ? (
                    <span className="text-tx-subtle text-sm">Loading...</span>
                ) : topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-bg-surface/50 rounded-lg border border-bg-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-900/30 flex items-center justify-center text-primary-400 font-bold text-xs">
                                    {index + 1}
                                </div>
                                <span className="text-sm font-medium text-tx-main">{product.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-success-500">{user?.currency || 'Rs.'} {product.profit.toLocaleString()}</div>
                                <div className="text-xs font-semibold text-tx-subtle">{product.sales} units</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <span className="text-tx-subtle text-sm text-center py-4">No data</span>
                )}
            </div>
        </Card>

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
                    <span className="text-tx-subtle text-sm text-center py-4">No data</span>
                )}
            </div>
        </Card>
      </div>

    </DashboardLayout>
  );
};

export default Reports;
