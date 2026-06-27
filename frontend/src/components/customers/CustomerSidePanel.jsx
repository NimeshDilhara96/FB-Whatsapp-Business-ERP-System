import React, { useState, useEffect } from 'react';
import { getCustomerOrders } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';

const CustomerSidePanel = ({ customer, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (customer?._id) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await getCustomerOrders(customer._id);
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch customer orders", error);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [customer]);

  if (!customer) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-tx-main/20 z-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-base-surface shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden border-l border-base-border">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-base-border-subtle bg-base-bg shrink-0">
          <h3 className="text-xl font-bold text-tx-main">Customer Profile</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-tx-subtle hover:text-tx-main transition-colors rounded-md hover:bg-base-surface">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Customer Details */}
          <div className="px-6 py-6 border-b border-base-border-subtle bg-base-surface">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold">
                {customer.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-tx-main">{customer.name}</h4>
                <p className="text-sm text-tx-subtle">{customer.whatsappNumber}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-tx-subtle w-5">📍</span>
                <p className="text-tx-main">{customer.address || "No address provided"}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-tx-subtle w-5">🏙️</span>
                <p className="text-tx-main">{customer.city || "No city provided"}</p>
              </div>
              {customer.notes && (
                <div className="flex items-start gap-3">
                  <span className="text-tx-subtle w-5">📝</span>
                  <p className="text-tx-main italic">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="px-6 py-6 bg-base-bg min-h-full">
            <h4 className="text-md font-bold text-tx-main mb-4 flex items-center gap-2">
              Order History
              <span className="bg-base-border text-tx-muted px-2 py-0.5 rounded-full text-xs">
                {orders.length}
              </span>
            </h4>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-tx-subtle">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 bg-base-surface rounded-xl border border-base-border border-dashed">
                <p className="text-tx-subtle text-sm">No orders found for this customer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-base-surface border border-base-border-subtle rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-tx-subtle font-medium">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-primary-600 font-medium mt-0.5 flex items-center gap-1.5">
                          <span>{order.source || 'WhatsApp'}</span>
                          <span className="text-tx-subtle">•</span>
                          <span>{order.paymentMethod || 'Cash on Delivery'}</span>
                        </p>
                        <p className="text-sm font-bold text-tx-main mt-1">
                          {user?.currency || 'Rs.'} {order.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                        ${
                          order.orderStatus === "Pending"
                            ? "bg-warning-50 text-warning-700 border-warning-200"
                            : order.orderStatus === "Processing"
                            ? "bg-info-50 text-info-700 border-info-200"
                            : order.orderStatus === "Shipped"
                            ? "bg-primary-50 text-primary-700 border-primary-200"
                            : order.orderStatus === "Delivered"
                            ? "bg-success-50 text-success-700 border-success-200"
                            : order.orderStatus === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.orderStatus === "Returned"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-danger-50 text-danger-700 border-danger-200"
                        }
                      `}>
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="border-t border-base-border-subtle pt-3 mt-3">
                      <p className="text-xs font-medium text-tx-subtle mb-2 uppercase tracking-wider">Items</p>
                      <ul className="space-y-1.5">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm items-center">
                            <span className="text-tx-main">
                              {item.productName} <span className="text-tx-subtle text-xs ml-1">({user?.currency || 'Rs.'} {item.price || 0})</span>
                            </span>
                            <span className="text-tx-muted font-medium bg-base-bg px-2 py-0.5 rounded-md">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSidePanel;
