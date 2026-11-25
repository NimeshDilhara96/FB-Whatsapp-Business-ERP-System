import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getOrders, updateOrderDetails } from "../services/orderService";
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import { useAuthStore } from "../store/authStore";
import Pagination from "../components/ui/Pagination";
import {
  FiArrowDown, FiArrowUp, FiCheck, FiChevronLeft, FiChevronRight, FiMapPin,
  FiPhone, FiRotateCcw, FiSearch, FiPlus, FiLoader, FiMoreHorizontal,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

// Desktop: the most likely next step for each status, shown as a visible button
const primaryAction = {
  Pending: { to: "Processing", label: "Start processing" },
  Processing: { to: "Shipped", label: "Mark shipped" },
  Shipped: { to: "Delivered", label: "Mark delivered" },
  Delivered: { to: "Completed", label: "Complete order" },
};

// Desktop: less common transitions, shown in the "more" menu
const secondaryLabels = {
  Shipped: "Skip to shipped",
  Cancelled: "Cancel order",
  Returned: "Mark as returned",
};
const destructiveStatuses = ["Cancelled", "Returned"];

const emptyMessages = {
  new_orders: { title: "No new orders", body: "Orders waiting to be processed will show up here." },
  in_transit: { title: "Nothing in transit", body: "Shipped and delivered orders will show up here." },
  payments_due: { title: "All payments collected", body: "Unpaid open orders will show up here." },
  history: { title: "No closed orders", body: "Completed, returned and cancelled orders will show up here." },
};

// Allowed status transitions (same rules as the desktop dropdown)
const nextStatuses = {
  Pending: ["Processing", "Shipped", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Returned"],
  Delivered: ["Completed", "Returned"],
};

// Status buttons shown in the mobile "Order status" grid
const statusGrid = (current) =>
  current === "Shipped" || current === "Delivered"
    ? ["Shipped", "Delivered", "Completed", "Returned"]
    : ["Pending", "Processing", "Shipped", "Delivered"];

const statusStyles = {
  Pending: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700", selected: "border-amber-500 bg-amber-50 text-amber-800" },
  Processing: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700", selected: "border-blue-500 bg-blue-50 text-blue-800" },
  Shipped: { dot: "bg-emerald-600", badge: "bg-indigo-100 text-indigo-700", selected: "border-emerald-600 bg-emerald-50 text-emerald-800" },
  Delivered: { dot: "bg-gray-500", badge: "bg-green-100 text-green-700", selected: "border-green-600 bg-green-50 text-green-800" },
  Completed: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", selected: "border-emerald-500 bg-emerald-50 text-emerald-800" },
  Returned: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700", selected: "border-orange-500 bg-orange-50 text-orange-800" },
  Cancelled: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", selected: "border-red-500 bg-red-50 text-red-800" },
};

// "Today · 2:37 PM" or "Sep 21 · 2 months ago"
const formatOrderDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;

  const days = Math.floor((now - d) / 86400000);
  let ago;
  if (days < 7) ago = `${days} days ago`;
  else if (days < 30) ago = `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  else if (days < 365) ago = `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  else ago = `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${ago}`;
};

// 0771234567 -> 94771234567 (Sri Lanka local numbers)
const toWhatsAppNumber = (phone) => {
  const digits = String(phone).replace(/\D/g, "");
  return digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
};

const OrderManagement = () => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new_orders");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortNewest, setSortNewest] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftPayment, setDraftPayment] = useState("Pending");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Tab Definitions
  const tabs = [
    { id: "new_orders", label: "New Orders" },
    { id: "in_transit", label: "In Transit" },
    { id: "payments_due", label: "Payments Due" },
    { id: "history", label: "History" },
  ];

  const loadAllOrders = useCallback(async () => {
    const response = await getOrders(1, 100);
    const payload = response.data || response;
    if (payload && Array.isArray(payload.data)) {
      let all = payload.data;
      const totalPages = payload.pagination?.totalPages || 1;
      if (totalPages > 1) {
        const extraPages = await Promise.all(
          Array.from({ length: Math.min(totalPages - 1, 9) }, (_, i) =>
            getOrders(i + 2, 100)
          )
        );
        for (const res of extraPages) {
          const p = res.data || res;
          if (p && Array.isArray(p.data)) {
            all = all.concat(p.data);
          }
        }
      }
      return all;
    }
    return Array.isArray(payload) ? payload : [];
  }, []);

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const all = await loadAllOrders();
        setOrders(all);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [loadAllOrders]
  );

  useEffect(() => {
    let active = true;
    loadAllOrders()
      .then((all) => {
        if (active) setOrders(all);
      })
      .catch((err) => console.error("Failed to fetch orders", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAllOrders]);

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
      setSavingId(orderId);
      await updateOrderDetails(orderId, updates);
      await fetchOrders(false); // Silent background refresh
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
      fetchOrders(false); // Revert UI if failed
    } finally {
      setSavingId(null);
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

  // ── Shared filtering, sorting & pagination helpers ──
  const currency = user?.currency || "Rs.";

  const searchTerm = search.trim().toLowerCase();
  const visibleOrders = searchTerm
    ? filteredOrders.filter((o) =>
        [
          o.customerId?.name,
          o.customerId?.whatsappNumber,
          o.customerId?.city,
          ...(o.items || []).map((i) => i.productName),
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(searchTerm))
      )
    : filteredOrders;

  const sortedOrders = [...visibleOrders].sort((a, b) => {
    const diff = new Date(b.createdAt) - new Date(a.createdAt);
    return sortNewest ? diff : -diff;
  });

  const totalItems = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedOrders = sortedOrders.slice(
    (safePage - 1) * limit,
    safePage * limit
  );

  const tabPagination = {
    currentPage: safePage,
    totalPages,
    totalItems,
    limit,
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    setOpenMenuId(null);
  };

  const isLocked = (ord) =>
    ord.orderStatus === "Cancelled" ||
    ord.orderStatus === "Returned" ||
    ord.orderStatus === "Completed";

  const openEditor = (ord) => {
    setEditingOrder(ord);
    setDraftStatus(ord.orderStatus);
    setDraftPayment(ord.paymentStatus || "Pending");
  };

  const closeEditor = () => setEditingOrder(null);

  const changeStatus = (ord, status) => {
    setOpenMenuId(null);
    if (status === "Cancelled" && !window.confirm(`Cancel ${ord.customerId?.name || "this"}'s order? This can't be undone.`)) return;
    if (status === "Returned" && !window.confirm(`Mark ${ord.customerId?.name || "this"}'s order as returned? This can't be undone.`)) return;
    handleDetailsChange(ord._id, { orderStatus: status });
  };

  const hasDraftChanges =
    !!editingOrder &&
    (draftStatus !== editingOrder.orderStatus ||
      draftPayment !== (editingOrder.paymentStatus || "Pending"));

  const saveEditor = async () => {
    if (!editingOrder || !hasDraftChanges) return;
    const updates = {};
    if (draftPayment !== (editingOrder.paymentStatus || "Pending")) updates.paymentStatus = draftPayment;
    if (draftStatus !== editingOrder.orderStatus) updates.orderStatus = draftStatus;

    if (updates.orderStatus === "Completed" && draftPayment !== "Paid") {
      alert("Cannot mark order as Completed until it is Paid.");
      return;
    }
    closeEditor();
    await handleDetailsChange(editingOrder._id, updates);
  };

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
          <div>
            <h1 className="text-xl font-bold text-tx-main tracking-tight">Manage orders</h1>
            <p className="text-tx-subtle text-xs mt-0.5">Payments and delivery status</p>
          </div>
          <button
            type="button"
            onClick={() => setSortNewest((v) => !v)}
            aria-label={sortNewest ? "Showing newest first" : "Showing oldest first"}
            title={sortNewest ? "Newest first" : "Oldest first"}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border border-base-border bg-base-surface text-tx-main shadow-sm"
          >
            {sortNewest ? <FiArrowDown className="w-4 h-4" /> : <FiArrowUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Search */}
        <label className="relative block mb-3">
          <span className="sr-only">Search orders</span>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customer, phone or product"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-base-border bg-base-surface text-xs text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          />
        </label>

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "bg-base-surface border-base-border text-tx-muted"
                }`}
              >
                {tab.label}
                <span
                  className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-emerald-800 text-white" : "bg-base-border-subtle text-tx-muted"
                  }`}
                >
                  {getTabCount(tab.id)}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "history" && (
          <select
            value={historyFilter}
            onChange={(e) => {
              setHistoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full mb-3 px-3 py-2 border border-base-border rounded-xl text-sm font-medium text-tx-main bg-base-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All History</option>
            <option value="Completed">Completed Only</option>
            <option value="Returned">Returned Only</option>
            <option value="Cancelled">Cancelled Only</option>
          </select>
        )}

        {/* Order cards */}
        {loading ? (
          <div className="py-10 text-center text-sm text-tx-subtle">Loading orders...</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-tx-subtle">No orders found in this category.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedOrders.map((ord) => {
              const phone = ord.customerId?.whatsappNumber;
              const locked = isLocked(ord);
              const paid = (ord.paymentStatus || "Pending") === "Paid";
              return (
                <div
                  key={ord._id}
                  className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4"
                >
                  {/* Customer + amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => ord.customerId && setSelectedCustomer(ord.customerId)}
                        className="text-sm font-bold text-tx-main truncate max-w-full text-left"
                      >
                        {ord.customerId?.name || "Unknown"}
                      </button>
                      <p className="flex items-center gap-1 text-[11px] text-tx-subtle mt-0.5 truncate">
                        <FiMapPin className="w-3 h-3 shrink-0" />
                        {[ord.customerId?.city, ord.customerId?.address].filter(Boolean).join(", ") || "No address"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-tx-main">
                        {currency} {(ord.totalAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-tx-subtle mt-0.5">{formatOrderDate(ord.createdAt)}</p>
                    </div>
                  </div>

                  <div className="border-t border-base-border-subtle my-3" />

                  {/* Items + source */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-tx-main min-w-0">
                      {ord.items?.map((i, idx) => (
                        <p key={idx} className="truncate">
                          <span className="font-bold">{i.quantity}×</span> {i.productName}
                        </p>
                      ))}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSourceBadge(ord.source)}`}>
                      {ord.source || "WhatsApp"}
                    </span>
                  </div>

                  {/* Payment method + badges */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] text-tx-subtle truncate">{ord.paymentMethod || "COD"}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {paid ? "Paid" : "Payment pending"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[ord.orderStatus]?.badge || "bg-gray-100 text-gray-700"}`}>
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={phone ? `tel:${phone}` : undefined}
                      aria-label="Call customer"
                      className={`w-10 h-9 flex items-center justify-center rounded-lg border border-base-border text-tx-main ${phone ? "" : "opacity-40 pointer-events-none"}`}
                    >
                      <FiPhone className="w-4 h-4" />
                    </a>
                    <a
                      href={phone ? `https://wa.me/${toWhatsAppNumber(phone)}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Message on WhatsApp"
                      className={`w-10 h-9 flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 text-primary-700 ${phone ? "" : "opacity-40 pointer-events-none"}`}
                    >
                      <FaWhatsapp className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEditor(ord)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors"
                    >
                      {locked ? "View details" : "Update status"}
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          pagination={tabPagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="orders"
        />

        {/* Order details / update status sheet */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 bg-base-bg flex flex-col">
            <div className="h-14 bg-base-surface border-b border-base-border-subtle flex items-center gap-2 px-2 shrink-0">
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Back"
                className="w-10 h-10 flex items-center justify-center text-tx-main"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-bold text-tx-main">Order details</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Summary */}
              <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-tx-main truncate">{editingOrder.customerId?.name || "Unknown"}</p>
                    <p className="text-[11px] text-tx-subtle mt-0.5 truncate">
                      {[editingOrder.customerId?.whatsappNumber, editingOrder.customerId?.city, editingOrder.customerId?.address]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSourceBadge(editingOrder.source)}`}>
                    {editingOrder.source || "WhatsApp"}
                  </span>
                </div>
                <div className="border-t border-base-border-subtle my-3" />
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-tx-main min-w-0">
                    {editingOrder.items?.map((i, idx) => (
                      <p key={idx} className="truncate">
                        <span className="font-bold">{i.quantity}×</span> {i.productName}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-tx-main shrink-0">
                    {currency} {(editingOrder.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <p className="text-[11px] text-tx-subtle mt-2">
                  {new Date(editingOrder.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Payment */}
              <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-tx-main">Payment</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      draftPayment === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {draftPayment}
                  </span>
                </div>
                <p className="text-[11px] text-tx-subtle mt-0.5">{editingOrder.paymentMethod || "COD"}</p>
                <button
                  type="button"
                  disabled={isLocked(editingOrder)}
                  onClick={() => setDraftPayment((p) => (p === "Paid" ? "Pending" : "Paid"))}
                  className={`w-full mt-3 h-10 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    draftPayment === "Paid"
                      ? "border-base-border text-tx-muted bg-base-surface"
                      : "border-emerald-700 text-emerald-800 bg-base-surface hover:bg-primary-50"
                  }`}
                >
                  {draftPayment === "Paid" ? (
                    <>
                      <FiRotateCcw className="w-4 h-4" /> Mark as pending
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" /> Mark payment received
                    </>
                  )}
                </button>
              </div>

              {/* Order status */}
              <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4">
                <p className="text-sm font-bold text-tx-main mb-3">Order status</p>
                {isLocked(editingOrder) ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[editingOrder.orderStatus]?.badge || "bg-gray-100 text-gray-700"}`}>
                      {editingOrder.orderStatus}
                    </span>
                    <span className="text-[11px] text-tx-subtle">This order is closed and can't be changed.</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {statusGrid(editingOrder.orderStatus).map((status) => {
                        const allowed = status === editingOrder.orderStatus || (nextStatuses[editingOrder.orderStatus] || []).includes(status);
                        const selected = draftStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            disabled={!allowed}
                            onClick={() => setDraftStatus(status)}
                            className={`h-11 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              selected
                                ? statusStyles[status].selected
                                : "border-base-border bg-base-surface text-tx-main"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusStyles[status].dot}`} />
                            {status}
                          </button>
                        );
                      })}
                    </div>
                    {(nextStatuses[editingOrder.orderStatus] || []).includes("Cancelled") && (
                      <button
                        type="button"
                        onClick={() => setDraftStatus((s) => (s === "Cancelled" ? editingOrder.orderStatus : "Cancelled"))}
                        className={`w-full mt-3 text-xs font-semibold ${
                          draftStatus === "Cancelled" ? "text-tx-muted" : "text-danger-600"
                        }`}
                      >
                        {draftStatus === "Cancelled" ? "Undo cancel" : "Cancel order"}
                      </button>
                    )}
                    {draftStatus === "Cancelled" && (
                      <p className="mt-2 text-center text-[11px] font-semibold text-danger-600">
                        This order will be cancelled when you save.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-base-surface border-t border-base-border-subtle shrink-0">
              <button
                type="button"
                onClick={saveEditor}
                disabled={!hasDraftChanges}
                className="w-full h-12 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ───────── Desktop View ───────── */}
      <div className="hidden md:block">
        {/* Page header */}
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tx-main tracking-tight">Manage orders</h1>
            <p className="text-tx-subtle text-sm mt-1">
              Track payments and move orders through delivery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative">
              <span className="sr-only">Search orders</span>
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search customer, phone or product"
                className="w-64 lg:w-80 h-10 pl-9 pr-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              />
            </label>
            <Link
              to="/orders"
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              New order
            </Link>
          </div>
        </div>

        <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-4 px-2 border-b border-base-border">
            <div role="tablist" aria-label="Order categories" className="flex">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                      setOpenMenuId(null);
                    }}
                    className={`relative flex items-center gap-2 px-4 h-12 text-sm font-medium transition-colors ${
                      active ? "text-tx-main" : "text-tx-subtle hover:text-tx-main"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                        active ? "bg-emerald-800 text-white" : "bg-base-border-subtle text-tx-muted"
                      }`}
                    >
                      {getTabCount(tab.id)}
                    </span>
                    {active && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-emerald-700" />
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === "history" && (
              <select
                value={historyFilter}
                onChange={(e) => {
                  setHistoryFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter history"
                className="mr-2 h-9 px-3 border border-base-border rounded-lg text-sm text-tx-main bg-base-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              >
                <option value="all">All closed orders</option>
                <option value="Completed">Completed</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-tx-subtle">
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading orders…
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <p className="text-sm font-semibold text-tx-main">
                {search.trim() ? `No orders match “${search.trim()}”` : emptyMessages[activeTab].title}
              </p>
              <p className="text-sm text-tx-subtle mt-1">
                {search.trim() ? "Try a different name, phone number or product." : emptyMessages[activeTab].body}
              </p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 h-9 px-4 rounded-lg border border-base-border text-sm font-medium text-tx-main hover:bg-base-bg"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-border-subtle text-xs text-tx-subtle">
                  <th scope="col" className="py-3 pl-5 pr-3 font-medium">Customer</th>
                  <th scope="col" className="py-3 px-3 font-medium">Items</th>
                  <th scope="col" className="py-3 px-3 font-medium hidden lg:table-cell">Placed</th>
                  <th scope="col" className="py-3 px-3 font-medium text-right">Amount</th>
                  <th scope="col" className="py-3 px-3 font-medium">Payment</th>
                  <th scope="col" className="py-3 px-3 font-medium">Status</th>
                  <th scope="col" className="py-3 pl-3 pr-5 font-medium text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((ord) => {
                  const locked = isLocked(ord);
                  const paid = (ord.paymentStatus || "Pending") === "Paid";
                  const saving = savingId === ord._id;
                  const primary = primaryAction[ord.orderStatus];
                  const needsPayment = primary?.to === "Completed" && !paid;
                  const secondary = (nextStatuses[ord.orderStatus] || []).filter((s) => s !== primary?.to);
                  const extraItems = (ord.items?.length || 0) - 2;

                  return (
                    <tr
                      key={ord._id}
                      className={`border-b border-base-border-subtle last:border-b-0 align-top transition-opacity hover:bg-base-bg/60 ${
                        saving ? "opacity-60" : ""
                      }`}
                    >
                      {/* Customer */}
                      <td className="py-4 pl-5 pr-3 max-w-56">
                        {ord.customerId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(ord.customerId)}
                            className="font-semibold text-tx-main hover:text-primary-700 hover:underline underline-offset-2 text-left"
                          >
                            {ord.customerId.name}
                          </button>
                        ) : (
                          <span className="font-semibold text-tx-main">Unknown</span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-tx-subtle tabular-nums">
                            {ord.customerId?.whatsappNumber || "No phone"}
                          </span>
                          {ord.customerId?.whatsappNumber && (
                            <a
                              href={`https://wa.me/${toWhatsAppNumber(ord.customerId.whatsappNumber)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open chat in WhatsApp"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-green-200 bg-green-50 text-[11px] font-medium text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                              Chat
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-tx-subtle truncate" title={[ord.customerId?.city, ord.customerId?.address].filter(Boolean).join(", ")}>
                          {[ord.customerId?.city, ord.customerId?.address].filter(Boolean).join(", ") || "No address"}
                        </p>
                        {/* Date shown here when the Placed column is hidden */}
                        <p className="text-xs text-tx-subtle mt-1 lg:hidden">{formatOrderDate(ord.createdAt)}</p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-3 max-w-64">
                        {ord.items?.slice(0, 2).map((i, idx) => (
                          <p key={idx} className="text-tx-main truncate">
                            <span className="text-tx-subtle tabular-nums">{i.quantity}×</span> {i.productName}
                          </p>
                        ))}
                        {extraItems > 0 && (
                          <p className="text-xs text-tx-subtle">+{extraItems} more</p>
                        )}
                        <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium border ${getSourceBadge(ord.source)}`}>
                          {ord.source || "WhatsApp"}
                        </span>
                      </td>

                      {/* Placed */}
                      <td className="py-4 px-3 hidden lg:table-cell whitespace-nowrap">
                        <p className="text-tx-main">
                          {new Date(ord.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-xs text-tx-subtle mt-0.5">
                          {new Date(ord.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 text-right whitespace-nowrap">
                        <p className="font-semibold text-tx-main tabular-nums">
                          {currency} {(ord.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-tx-subtle mt-0.5">{ord.paymentMethod || "COD"}</p>
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {paid && <FiCheck className="w-3 h-3" />}
                          {paid ? "Paid" : "Unpaid"}
                        </span>
                        {!paid && !locked && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleDetailsChange(ord._id, { paymentStatus: "Paid" })}
                            className="block mt-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 disabled:opacity-50"
                          >
                            Mark as paid
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ord.orderStatus]?.badge || "bg-gray-100 text-gray-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[ord.orderStatus]?.dot || "bg-gray-400"}`} />
                          {ord.orderStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-5 whitespace-nowrap">
                        {saving ? (
                          <div className="flex items-center justify-end gap-1.5 h-8 text-xs text-tx-subtle">
                            <FiLoader className="w-3.5 h-3.5 animate-spin" /> Saving…
                          </div>
                        ) : locked ? (
                          <div className="flex items-center justify-end h-8 text-xs text-tx-subtle">Closed</div>
                        ) : (
                          <div className="relative flex items-center justify-end gap-1.5">
                            {primary && (
                              <button
                                type="button"
                                disabled={needsPayment}
                                title={needsPayment ? "Mark this order as paid before completing it" : undefined}
                                onClick={() => changeStatus(ord, primary.to)}
                                className="h-8 px-3 rounded-lg border border-base-border bg-base-surface text-xs font-semibold text-tx-main hover:border-emerald-700 hover:text-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-base-border disabled:hover:text-tx-main"
                              >
                                {primary.label}
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="More actions"
                              aria-haspopup="menu"
                              aria-expanded={openMenuId === ord._id}
                              onClick={() => setOpenMenuId((id) => (id === ord._id ? null : ord._id))}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-tx-subtle hover:bg-base-border-subtle hover:text-tx-main"
                            >
                              <FiMoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === ord._id && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Close menu"
                                  className="fixed inset-0 z-10 cursor-default"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div
                                  role="menu"
                                  className="absolute right-0 top-full mt-1 z-20 w-48 py-1 rounded-xl border border-base-border bg-base-surface shadow-lg text-left"
                                >
                                  {secondary
                                    .filter((s) => !destructiveStatuses.includes(s))
                                    .map((s) => (
                                      <MenuItem key={s} onClick={() => changeStatus(ord, s)}>
                                        {secondaryLabels[s]}
                                      </MenuItem>
                                    ))}
                                  <MenuItem
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleDetailsChange(ord._id, { paymentStatus: paid ? "Pending" : "Paid" });
                                    }}
                                  >
                                    {paid ? "Mark as unpaid" : "Mark as paid"}
                                  </MenuItem>
                                  {ord.customerId && (
                                    <MenuItem
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setSelectedCustomer(ord.customerId);
                                      }}
                                    >
                                      View customer
                                    </MenuItem>
                                  )}
                                  {secondary.some((s) => destructiveStatuses.includes(s)) && (
                                    <div className="my-1 border-t border-base-border-subtle" />
                                  )}
                                  {secondary
                                    .filter((s) => destructiveStatuses.includes(s))
                                    .map((s) => (
                                      <MenuItem key={s} danger onClick={() => changeStatus(ord, s)}>
                                        {secondaryLabels[s]}
                                      </MenuItem>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="px-5 pb-4">
            <Pagination
              pagination={tabPagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              itemLabel="orders"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const MenuItem = ({ children, onClick, danger = false }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
      danger ? "text-danger-600 hover:bg-danger-50" : "text-tx-main hover:bg-base-bg"
    }`}
  >
    {children}
  </button>
);

export default OrderManagement;
