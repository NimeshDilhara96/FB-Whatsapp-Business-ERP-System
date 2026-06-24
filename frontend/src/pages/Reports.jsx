import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import { getOrders } from "../services/orderService";

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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

  // Calculate metrics
  const totalOrders = filteredOrders.length;
  
  const totalRevenue = filteredOrders.reduce((sum, o) => {
    if (o.orderStatus === "Returned" || o.orderStatus === "Cancelled") {
      return sum;
    }
    return sum + (o.totalAmount || 0);
  }, 0);

  const returnedOrders = filteredOrders.filter(o => o.orderStatus === "Returned").length;
  const cancelledOrders = filteredOrders.filter(o => o.orderStatus === "Cancelled").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx-main tracking-tight">
            Reports
          </h1>
          <p className="text-tx-subtle text-sm mt-1">
            Analyze your business performance over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-tx-subtle">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 border border-base-border-subtle rounded-md text-sm text-tx-main bg-base-bg focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="28days">Last 28 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Orders</span>
          <span className="text-3xl font-bold text-tx-main flex items-center gap-2">
            <span className="text-2xl">📦</span> {loading ? "..." : totalOrders}
          </span>
        </Card>
        
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Revenue</span>
          <span className="text-3xl font-bold text-primary-600 flex items-center gap-2">
            <span className="text-2xl">💰</span> {loading ? "..." : `Rs. ${totalRevenue.toLocaleString()}`}
          </span>
        </Card>

        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Returned</span>
          <span className="text-3xl font-bold text-warning-600 flex items-center gap-2">
            <span className="text-2xl">↩️</span> {loading ? "..." : returnedOrders}
          </span>
        </Card>
        
        <Card className="flex flex-col">
          <span className="text-tx-subtle text-sm font-medium mb-2">Cancelled</span>
          <span className="text-3xl font-bold text-danger-500 flex items-center gap-2">
            <span className="text-2xl">❌</span> {loading ? "..." : cancelledOrders}
          </span>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-tx-main mb-4">Orders Breakdown</h3>
        {loading ? (
          <p className="text-tx-subtle">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-base-border-subtle text-sm text-tx-subtle">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Items</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-tx-subtle">
                      No orders found for this timeframe.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr
                      key={ord._id}
                      className="border-b border-base-border-subtle hover:bg-base-bg transition-colors"
                    >
                      <td className="py-3 px-4 text-tx-muted whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-tx-main font-medium">
                        {ord.customerId?.name || "‑"}
                        <div className="text-xs text-tx-subtle font-normal">
                          {ord.customerId?.whatsappNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-tx-muted">
                        {ord.items?.map((i, idx) => (
                          <div key={idx}>
                            {i.quantity}x {i.productName}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-tx-muted">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border
                          ${
                            ord.orderStatus === "Pending"
                              ? "bg-warning-50 text-warning-700 border-warning-200"
                              : ord.orderStatus === "Processing"
                              ? "bg-info-50 text-info-700 border-info-200"
                              : ord.orderStatus === "Shipped"
                              ? "bg-primary-50 text-primary-700 border-primary-200"
                              : ord.orderStatus === "Delivered"
                              ? "bg-success-50 text-success-700 border-success-200"
                              : ord.orderStatus === "Returned"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-danger-50 text-danger-700 border-danger-200"
                          }
                        `}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-tx-main font-medium text-right">
                        Rs. {ord.totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default Reports;
