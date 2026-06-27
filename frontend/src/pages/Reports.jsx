import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuthStore } from "../store/authStore";

const Reports = () => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
          getOrders(),
          getProducts()
      ]);
      setOrders(ordersData || []);
      
      // Ensure products is an array
      let prods = [];
      if (Array.isArray(productsData)) prods = productsData;
      else if (productsData?.data) prods = productsData.data;
      else if (productsData?.products) prods = productsData.products;
      setProducts(prods);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders based on the selected timeframe
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      switch (timeframe) {
        case "today": {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return orderDate >= today;
        }
        case "7days": {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return orderDate >= sevenDaysAgo;
        }
        case "28days": {
          const twentyEightDaysAgo = new Date();
          twentyEightDaysAgo.setDate(now.getDate() - 28);
          return orderDate >= twentyEightDaysAgo;
        }
        case "month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return orderDate >= startOfMonth;
        }
        case "all":
        default:
          return true;
      }
    });
  }, [orders, timeframe]);

  // Calculate generic metrics
  const {
      totalOrders, totalRevenue, pendingRevenue, returnedOrders, cancelledOrders, returnRate,
      totalFilteredProfit, aov,
      topProducts, topCustomers, orderStatusData, chartData, sourceData
  } = useMemo(() => {
      const totalOrders = filteredOrders.length;
      let totalFilteredProfit = 0;
      let totalFilteredCost = 0;

      const totalRevenue = filteredOrders.reduce((sum, o) => {
        if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return sum;
        if (o.paymentStatus !== "Paid") return sum;
        
        const rev = o.totalAmount || 0;
        let cost = 0;
        o.items?.forEach(item => {
            const prod = products.find(p => p.name === item.productName);
            if (prod && prod.costPrice) {
                cost += prod.costPrice * item.quantity;
            }
        });
        totalFilteredCost += cost;
        totalFilteredProfit += (rev - cost);
        
        return sum + rev;
      }, 0);

      const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

      const pendingRevenue = filteredOrders.reduce((sum, o) => {
        if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return sum;
        if (o.paymentStatus === "Paid") return sum;
        return sum + (o.totalAmount || 0);
      }, 0);

      const returnedOrders = filteredOrders.filter(o => o.orderStatus === "Returned").length;
      const cancelledOrders = filteredOrders.filter(o => o.orderStatus === "Cancelled").length;
      const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(1) : 0;

      // Top Products (by Profit & Quantity)
      const productStats = {};
      filteredOrders.forEach(o => {
          if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
          if (o.paymentStatus !== "Paid") return;
          o.items?.forEach(item => {
              const name = item.productName;
              if (!productStats[name]) productStats[name] = { sales: 0, profit: 0 };
              productStats[name].sales += (item.quantity || 0);

              const prod = products.find(p => p.name === name);
              const cost = (prod && prod.costPrice) ? prod.costPrice : 0;
              const itemRev = (item.price || 0) * (item.quantity || 0);
              productStats[name].profit += (itemRev - (cost * item.quantity));
          });
      });
      const topProducts = Object.entries(productStats)
          .sort((a, b) => b[1].profit - a[1].profit) // Sort by Profit
          .slice(0, 5)
          .map(([name, stats]) => ({ name, sales: stats.sales, profit: stats.profit }));

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

      // Order Status Distribution
      const statusCounts = {};
      filteredOrders.forEach(o => {
          statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
      });
      const COLORS = {
          'Pending': '#F59E0B', 
          'Processing': '#3B82F6',
          'Shipped': '#8B5CF6',
          'Delivered': '#10B981',
          'Completed': '#059669',
          'Cancelled': '#EF4444',
          'Returned': '#F97316'
      };
      const orderStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, color: COLORS[name] || '#6B7280' }));

      // Chart Data (Paid Only)
      const sortedFiltered = [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const allMap = new Map();
      sortedFiltered.forEach(o => {
          if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
          if (o.paymentStatus !== "Paid") return;
          
          const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          allMap.set(dateStr, (allMap.get(dateStr) || 0) + (o.totalAmount || 0));
      });
      const chartData = Array.from(allMap, ([date, sales]) => ({ date, sales }));

      // Order Source Distribution (Paid Only)
      const sourceCounts = {};
      filteredOrders.forEach(o => {
          if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
          if (o.paymentStatus !== "Paid") return;
          
          const source = o.source || 'WhatsApp';
          sourceCounts[source] = (sourceCounts[source] || 0) + (o.totalAmount || 0);
      });
      const SOURCE_COLORS = {
          'WhatsApp': '#25D366', 
          'Facebook': '#1877F2',
          'Website': '#8B5CF6',
          'Other': '#6B7280'
      };
      const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value, color: SOURCE_COLORS[name] || '#6B7280' }));

      return {
          totalOrders, totalRevenue, pendingRevenue, returnedOrders, cancelledOrders, returnRate,
          totalFilteredProfit, aov,
          topProducts, topCustomers, orderStatusData, chartData, sourceData
      };
  }, [filteredOrders, products]);

  // Overall quick stats (Daily, Weekly, Monthly) independent of filter
  const { salesToday, salesThisWeek, salesThisMonth, profitToday, profitThisWeek, profitThisMonth } = useMemo(() => {
      let sToday = 0, sWeek = 0, sMonth = 0;
      let pToday = 0, pWeek = 0, pMonth = 0;
      const now = new Date();
      
      const todayStart = new Date(now);
      todayStart.setHours(0,0,0,0);
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0,0,0,0);

      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0,0,0,0);

      orders.forEach(o => {
          if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") return;
          if (o.paymentStatus !== "Paid") return;
          
          const d = new Date(o.createdAt);
          const amount = o.totalAmount || 0;
          
          let cost = 0;
          o.items?.forEach(item => {
              const prod = products.find(p => p.name === item.productName);
              if (prod && prod.costPrice) {
                  cost += prod.costPrice * item.quantity;
              }
          });
          const profit = amount - cost;

          if (d >= todayStart) { sToday += amount; pToday += profit; }
          if (d >= weekStart) { sWeek += amount; pWeek += profit; }
          if (d >= monthStart) { sMonth += amount; pMonth += profit; }
      });

      return { salesToday: sToday, salesThisWeek: sWeek, salesThisMonth: sMonth, profitToday: pToday, profitThisWeek: pWeek, profitThisMonth: pMonth };
  }, [orders, products]);


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
