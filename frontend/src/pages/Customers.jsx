import { useState, useEffect, useCallback } from "react";
import {
  getCustomers,
  deleteCustomer,
  updateCustomer,
} from "../services/customerService";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import CustomerSidePanel from "../components/customers/CustomerSidePanel";
import Pagination from "../components/ui/Pagination";
import {
  FiEdit2,
  FiLoader,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const cities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Matara",
  "Negombo",
  "Kurunegala",
  "Jaffna",
  "Gampaha",
  "Anuradhapura",
  "Kegalle",
];

// 0771234567 -> 94771234567 (Sri Lanka local numbers)
const toWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    whatsappNumber: "",
    address: "",
    city: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({});

  const fetchCustomers = useCallback(
    async (currentPage = 1, currentLimit = limit, showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const response = await getCustomers(currentPage, currentLimit);
        const payload = response.data || response;

        if (payload && Array.isArray(payload.data)) {
          setCustomers(payload.data);
          if (payload.pagination) setPagination(payload.pagination);
        } else if (Array.isArray(payload)) {
          setCustomers(payload);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    let active = true;
    getCustomers(1, limit)
      .then((response) => {
        if (!active) return;
        const payload = response.data || response;
        if (payload && Array.isArray(payload.data)) {
          setCustomers(payload.data);
          if (payload.pagination) setPagination(payload.pagination);
        } else if (Array.isArray(payload)) {
          setCustomers(payload);
        }
      })
      .catch((err) => console.error("Failed to fetch customers:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchCustomers(newPage, limit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.whatsappNumber) {
      return setError("Name and WhatsApp Number are required.");
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.whatsappNumber.trim())) {
      return setError(
        "Please enter a valid 10-digit WhatsApp number (e.g. 0771234567)."
      );
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        setSuccess("Customer updated successfully!");
        setFormData({
          name: "",
          whatsappNumber: "",
          address: "",
          city: "",
          notes: "",
        });
        setEditingId(null);
        fetchCustomers(page, limit, false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error saving customer");
    }
  };

  const handleEditClick = (customer) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name || "",
      whatsappNumber: customer.whatsappNumber || "",
      address: customer.address || "",
      city: customer.city || "",
      notes: customer.notes || "",
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      whatsappNumber: "",
      address: "",
      city: "",
      notes: "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        const nextPage =
          customers.length === 1 && page > 1 ? page - 1 : page;
        setPage(nextPage);
        fetchCustomers(nextPage, limit);
      } catch {
        alert("Failed to delete customer");
      }
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const visibleCustomers = searchTerm
    ? customers.filter((c) =>
        [c.name, c.whatsappNumber, c.address, c.city, c.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(searchTerm))
      )
    : customers;

  const effectivePagination = searchTerm
    ? {
        currentPage: 1,
        totalPages: 1,
        totalItems: visibleCustomers.length,
        limit,
      }
    : {
        currentPage: pagination.currentPage || page,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems ?? customers.length,
        limit: pagination.limit || limit,
      };

  return (
    <DashboardLayout>
      <CustomerSidePanel
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Edit Customer Form (Mobile & Desktop) */}
      {editingId && (
        <Card className="mb-6">
          <h3 className="text-base md:text-lg font-bold text-tx-main mb-4">
            Edit customer
          </h3>

          <Alert type="error" message={error} className="mb-4" />
          <Alert type="success" message={success} className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                name="name"
                label="Name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <Input
                type="text"
                name="whatsappNumber"
                label="WhatsApp Number"
                placeholder="0771234567"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
              />
              <Input
                type="text"
                name="address"
                label="Address"
                placeholder="Full Address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <Select
                name="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
                options={cities}
              />
              <Input
                type="text"
                name="notes"
                label="Notes"
                placeholder="Notes (e.g. VIP, Regular)"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
            <div className="pt-2 flex gap-3">
              <Button type="submit" variant="primary">
                Update customer
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ───────── Mobile View ───────── */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-tx-main tracking-tight">
              Customers
            </h1>
            <p className="text-tx-subtle text-xs mt-0.5">
              Tap a customer to view their order history
            </p>
          </div>
          {pagination.totalItems > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 tabular-nums">
              {pagination.totalItems} total
            </span>
          )}
        </div>

        {/* Mobile Search */}
        <label className="relative block mb-3">
          <span className="sr-only">Search customers</span>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or city"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-base-border bg-base-surface text-xs text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          />
        </label>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-tx-subtle">
            <FiLoader className="w-4 h-4 animate-spin" />
            Loading customers…
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="bg-base-surface rounded-2xl border border-base-border-subtle p-8 text-center">
            <p className="text-sm font-semibold text-tx-main">
              {searchTerm
                ? `No customers match “${search.trim()}”`
                : "No customers yet"}
            </p>
            <p className="text-xs text-tx-subtle mt-1">
              {searchTerm
                ? "Try a different name, phone number or city."
                : "Customers are added automatically when you create orders."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleCustomers.map((customer) => {
              const phone = customer.whatsappNumber;
              return (
                <div
                  key={customer._id}
                  className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {customer.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-tx-main truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-tx-subtle tabular-nums">
                          {phone || "No phone"}
                        </p>
                      </div>
                    </button>

                    {customer.notes && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 max-w-28 truncate">
                        {customer.notes}
                      </span>
                    )}
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-tx-subtle mt-2.5 truncate">
                    <FiMapPin className="w-3.5 h-3.5 shrink-0" />
                    {[customer.city, customer.address]
                      .filter(Boolean)
                      .join(", ") || "No address provided"}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-base-border-subtle">
                    <div className="flex items-center gap-2">
                      <a
                        href={phone ? `tel:${phone}` : undefined}
                        aria-label="Call customer"
                        className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-base-border text-xs font-medium text-tx-main ${
                          phone ? "" : "opacity-40 pointer-events-none"
                        }`}
                      >
                        <FiPhone className="w-3.5 h-3.5" />
                        Call
                      </a>
                      <a
                        href={
                          phone
                            ? `https://wa.me/${toWhatsAppNumber(phone)}`
                            : undefined
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp customer"
                        className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 text-xs font-medium text-green-700 ${
                          phone ? "" : "opacity-40 pointer-events-none"
                        }`}
                      >
                        <FaWhatsapp className="w-3.5 h-3.5" />
                        Chat
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(customer)}
                        aria-label="Edit customer"
                        className="h-9 px-2.5 inline-flex items-center gap-1 rounded-lg text-xs font-medium text-tx-muted hover:text-tx-main hover:bg-base-bg"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(customer._id)}
                        aria-label="Delete customer"
                        className="h-9 px-2.5 inline-flex items-center gap-1 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          pagination={effectivePagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="customers"
        />
      </div>

      {/* ───────── Desktop View ───────── */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tx-main tracking-tight">
              Customers
            </h1>
            <p className="text-tx-subtle text-sm mt-1">
              Click any customer to inspect their order history.
            </p>
          </div>
          <label className="relative">
            <span className="sr-only">Search customers</span>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, city or notes"
              className="w-72 lg:w-80 h-10 pl-9 pr-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
            />
          </label>
        </div>

        <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-tx-subtle">
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading customers…
            </div>
          ) : visibleCustomers.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <p className="text-sm font-semibold text-tx-main">
                {searchTerm
                  ? `No customers match “${search.trim()}”`
                  : "No customers found"}
              </p>
              <p className="text-sm text-tx-subtle mt-1">
                {searchTerm
                  ? "Try a different name, phone number or city."
                  : "Customers are created automatically when you place an order."}
              </p>
              {searchTerm && (
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-base-border-subtle text-xs text-tx-subtle">
                    <th className="py-3 pl-5 pr-3 font-medium">Name</th>
                    <th className="py-3 px-3 font-medium">WhatsApp</th>
                    <th className="py-3 px-3 font-medium">City</th>
                    <th className="py-3 px-3 font-medium">Address</th>
                    <th className="py-3 px-3 font-medium">Notes</th>
                    <th className="py-3 pl-3 pr-5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-base-border-subtle last:border-b-0 hover:bg-base-bg/60 transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="font-semibold text-tx-main hover:text-primary-700 hover:underline underline-offset-2 text-left"
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-tx-muted tabular-nums">
                            {customer.whatsappNumber}
                          </span>
                          {customer.whatsappNumber && (
                            <a
                              href={`https://wa.me/${toWhatsAppNumber(customer.whatsappNumber)}`}
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
                      </td>
                      <td className="py-3.5 px-3 text-tx-muted whitespace-nowrap">
                        {customer.city || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-tx-muted max-w-xs truncate">
                        {customer.address || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-tx-muted max-w-xs truncate">
                        {customer.notes || "—"}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(customer)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer._id)}
                          className="text-xs font-semibold text-danger-600 hover:text-danger-700 hover:underline underline-offset-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 pb-4">
            <Pagination
              pagination={effectivePagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              itemLabel="customers"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
