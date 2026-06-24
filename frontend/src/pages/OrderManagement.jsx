import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import { getOrders, updateOrderStatus } from "../services/orderService";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh to get the latest status
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">
          Manage Orders
        </h1>
        <p className="text-tx-subtle text-sm mt-1">
          View all orders and update their statuses
        </p>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-tx-main mb-4">Orders List</h3>
        {loading ? (
          <p className="text-tx-subtle">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-base-border-subtle text-sm text-tx-subtle">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    Customer
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    Phone
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    Items
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    Total
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-tx-subtle">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr
                      key={ord._id}
                      className="border-b border-base-border-subtle hover:bg-base-bg transition-colors"
                    >
                      <td className="py-3 px-4 text-tx-main font-medium">
                        {ord.customerId?.name || "‑"}
                      </td>
                      <td className="py-3 px-4 text-tx-muted">
                        {ord.customerId?.whatsappNumber || "‑"}
                      </td>
                      <td className="py-3 px-4 text-tx-muted">
                        {ord.items?.map((i, idx) => (
                          <div key={idx}>
                            {i.quantity}x {i.productName}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-tx-muted font-medium">
                        Rs. {ord.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-tx-muted">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) =>
                            handleStatusChange(ord._id, e.target.value)
                          }
                          className={`px-2 py-1 pr-6 rounded-full text-xs font-medium border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500
                            ${
                              ord.orderStatus === "Pending"
                                ? "bg-warning-50 text-warning-700 border-warning-200"
                                : ord.orderStatus === "Processing"
                                ? "bg-info-50 text-info-700 border-info-200"
                                : ord.orderStatus === "Shipped"
                                ? "bg-primary-50 text-primary-700 border-primary-200"
                                : ord.orderStatus === "Delivered"
                                ? "bg-success-50 text-success-700 border-success-200"
                                : "bg-danger-50 text-danger-700 border-danger-200"
                            }
                          `}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-tx-muted text-right">
                        {new Date(ord.createdAt).toLocaleDateString()}
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
