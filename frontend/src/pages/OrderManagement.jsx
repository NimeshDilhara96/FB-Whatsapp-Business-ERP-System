import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import { getOrders, updateOrderDetails } from "../services/orderService";
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import { useAuthStore } from "../store/authStore";

const OrderManagement = () => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("new_orders");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Tab Definitions
  const tabs = [
    { id: "new_orders", label: "New Orders" },
    { id: "in_transit", label: "In Transit" },
    { id: "payments_due", label: "Payments Due" },
    { id: "history", label: "History" },
  ];

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDetailsChange = async (orderId, updates) => {
    const order = orders.find((o) => o._id === orderId);
    
    // UI Validation: Cannot complete an unpaid order
    if (updates.orderStatus === "Completed") {
      const isPaid = updates.paymentStatus === "Paid" || (order && order.paymentStatus === "Paid");
      if (!isPaid) {
        alert("Cannot mark order as Completed until it is Paid.");
        return;
      }
    }

    // Optimistically update UI so the dropdown feels instant and doesn't flicker
    setOrders((prev) => 
      prev.map(ord => ord._id === orderId ? { ...ord, ...updates } : ord)
    );

    try {
      await updateOrderDetails(orderId, updates);
      fetchOrders(false); // Silent background refresh
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
      fetchOrders(false); // Revert UI if failed
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "new_orders") {
      return o.orderStatus === "Pending" || o.orderStatus === "Processing";
    }
    if (activeTab === "in_transit") {
      return o.orderStatus === "Shipped" || o.orderStatus === "Delivered";
    }
    if (activeTab === "payments_due") {
      return (
        o.paymentStatus !== "Paid" &&
        o.orderStatus !== "Cancelled" &&
        o.orderStatus !== "Returned" &&
        o.orderStatus !== "Completed"
      );
    }
    if (activeTab === "history") {
      if (historyFilter === "all") {
        return (
          o.orderStatus === "Completed" ||
          o.orderStatus === "Cancelled" ||
          o.orderStatus === "Returned"
        );
      }
      return o.orderStatus === historyFilter;
    }
    return true;
  });

  const getTabCount = (tabId) => {
    return orders.filter((o) => {
      if (tabId === "new_orders")
        return o.orderStatus === "Pending" || o.orderStatus === "Processing";
      if (tabId === "in_transit")
        return o.orderStatus === "Shipped" || o.orderStatus === "Delivered";
      if (tabId === "payments_due")
        return (
          o.paymentStatus !== "Paid" &&
          o.orderStatus !== "Cancelled" &&
          o.orderStatus !== "Returned" &&
          o.orderStatus !== "Completed"
        );
      if (tabId === "history")
        return (
          o.orderStatus === "Completed" ||
          o.orderStatus === "Cancelled" ||
          o.orderStatus === "Returned"
        );
      return true;
    }).length;
  };

  // Source එකට අනුව ලස්සන පාටක් දෙන Function එක
  const getSourceBadge = (source) => {
    const s = source || "Other";
    if (s === "WhatsApp") return "bg-green-100 text-green-700 border-green-200";
    if (s === "Facebook") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "Instagram") return "bg-pink-100 text-pink-700 border-pink-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <DashboardLayout>
      <CustomerSidePanel
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">
          Manage Orders
        </h1>
        <p className="text-tx-subtle text-sm mt-1">
          View all orders, payments, and update their statuses
        </p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-base-border-subtle mb-6 pb-2 gap-4">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto custom-scrollbar flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-[9px]
                  ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 bg-primary-50/50"
                      : "border-transparent text-tx-subtle hover:text-tx-main hover:bg-base-surface"
                  }
                `}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${
                    activeTab === tab.id
                      ? "bg-primary-100 text-primary-700"
                      : "bg-base-border text-tx-muted"
                  }
                `}
                >
                  {getTabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>

          {/* History Sub-Filter */}
          {activeTab === "history" && (
            <div className="flex-shrink-0">
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-base-border rounded-md text-sm font-medium text-tx-main bg-base-surface focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
              >
                <option value="all">All History</option>
                <option value="Completed">Completed Only</option>
                <option value="Returned">Returned Only</option>
                <option value="Cancelled">Cancelled Only</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-tx-subtle">
            Loading orders...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-base-border-subtle text-sm text-tx-subtle">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Order Details</th>
                  <th className="py-3 px-4 font-medium">Payment Info</th>
                  <th className="py-3 px-4 font-medium">Order Status</th>
                  <th className="py-3 px-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-tx-subtle"
                    >
                      No orders found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr
                      key={ord._id}
                      className="border-b border-base-border-subtle hover:bg-base-bg/50 transition-colors"
                    >
                      {/* 1. Customer Column */}
                      <td className="py-4 px-4 align-top">
                        <div
                          className={`font-semibold ${ord.customerId ? "text-primary-600 cursor-pointer hover:underline" : "text-tx-main"}`}
                          onClick={() =>
                            ord.customerId &&
                            setSelectedCustomer(ord.customerId)
                          }
                        >
                          {ord.customerId?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-tx-muted mt-1">
                          📞 {ord.customerId?.whatsappNumber || "No Number"}
                        </div>
                        <div className="text-xs text-tx-muted mt-0.5">
                          📍{" "}
                          {ord.customerId?.city
                            ? `${ord.customerId.city}, `
                            : ""}
                          {ord.customerId?.address || ""}
                        </div>
                      </td>

                      {/* 2. Order Details Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="text-tx-main mb-2">
                          {ord.items?.map((i, idx) => (
                            <div key={idx} className="mb-0.5">
                              <span className="font-medium">{i.quantity}x</span>{" "}
                              {i.productName}
                            </div>
                          ))}
                        </div>
                        {/* Source Badge */}
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getSourceBadge(ord.source)}`}
                        >
                          From: {ord.source || "WhatsApp"}
                        </span>
                      </td>

                      {/* 3. Payment Info Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-tx-main text-base mb-1">
                          {user?.currency || 'Rs.'} {ord.totalAmount?.toFixed(2)}
                        </div>
                        <div className="text-xs text-tx-muted font-medium mb-2 uppercase tracking-wide">
                          Method: {ord.paymentMethod || "COD"}
                        </div>
                        {/* Payment Status Dropdown */}
                        <select
                          value={ord.paymentStatus || "Pending"}
                          disabled={
                            ord.orderStatus === "Cancelled" ||
                            ord.orderStatus === "Returned" ||
                            ord.orderStatus === "Completed"
                          }
                          onChange={(e) =>
                            handleDetailsChange(ord._id, {
                              paymentStatus: e.target.value,
                            })
                          }
                          className={`px-2 py-1 pr-6 rounded-md text-xs font-bold border appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500
                            ${ord.orderStatus === "Cancelled" || ord.orderStatus === "Returned" || ord.orderStatus === "Completed" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            ${(ord.paymentStatus || "Pending") === "Paid" ? "bg-success-50 text-success-700 border-success-200" : "bg-warning-50 text-warning-700 border-warning-200"}
                          `}
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Paid">✅ Paid</option>
                        </select>
                      </td>

                      {/* 4. Order Status Column */}
                      <td className="py-4 px-4 align-top">
                        <select
                          value={ord.orderStatus}
                          disabled={
                            ord.orderStatus === "Cancelled" ||
                            ord.orderStatus === "Returned" ||
                            ord.orderStatus === "Completed"
                          }
                          onChange={(e) =>
                            handleDetailsChange(ord._id, {
                              orderStatus: e.target.value,
                            })
                          }
                          className={`px-3 py-1.5 pr-8 rounded-full text-xs font-bold border appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm
                            ${ord.orderStatus === "Cancelled" || ord.orderStatus === "Returned" || ord.orderStatus === "Completed" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                            ${
                              ord.orderStatus === "Pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : ord.orderStatus === "Processing"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : ord.orderStatus === "Shipped"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : ord.orderStatus === "Delivered"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : ord.orderStatus === "Returned"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : ord.orderStatus === "Completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                            }
                          `}
                        >
                          <option value={ord.orderStatus}>
                            {ord.orderStatus}
                          </option>
                          {ord.orderStatus === "Pending" && (
                            <>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Cancelled">Cancelled</option>
                            </>
                          )}
                          {ord.orderStatus === "Processing" && (
                            <>
                              <option value="Shipped">Shipped</option>
                              <option value="Cancelled">Cancelled</option>
                            </>
                          )}
                          {ord.orderStatus === "Shipped" && (
                            <>
                              <option value="Delivered">Delivered</option>
                              <option value="Returned">Returned</option>
                            </>
                          )}
                          {ord.orderStatus === "Delivered" && (
                            <>
                              <option value="Completed">Completed</option>
                              <option value="Returned">Returned</option>
                            </>
                          )}
                        </select>
                      </td>

                      {/* 5. Date Column */}
                      <td className="py-4 px-4 align-top text-right text-tx-muted">
                        <div className="font-medium text-tx-main">
                          {new Date(ord.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                        <div className="text-xs mt-0.5">
                          {new Date(ord.createdAt).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
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

export default OrderManagement;
