import { useState, useEffect, useCallback } from "react";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import DashboardLayout from "../layouts/DashboardLayout";
import Alert from "../components/ui/Alert";
import Pagination from "../components/ui/Pagination";
import { useAuthStore } from "../store/authStore";
import {
  FiEdit2,
  FiLoader,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const LOW_STOCK_THRESHOLD = 5;

const emptyForm = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stockQuantity: "",
};

const stockFilters = [
  { id: "all", label: "All" },
  { id: "low", label: "Low stock" },
  { id: "out", label: "Out of stock" },
];

const getStockBadge = (qty) => {
  const n = Number(qty) || 0;
  if (n <= 0) {
    return {
      label: "Out of stock",
      dot: "bg-red-500",
      badge: "bg-red-100 text-red-700",
    };
  }
  if (n < LOW_STOCK_THRESHOLD) {
    return {
      label: `Low stock · ${n}`,
      dot: "bg-amber-500",
      badge: "bg-amber-100 text-amber-800",
    };
  }
  return {
    label: `In stock · ${n}`,
    dot: "bg-emerald-500",
    badge: "bg-green-100 text-green-800",
  };
};

const Products = () => {
  const user = useAuthStore((state) => state.user);
  const currency = user?.currency || "Rs.";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadAllProducts = useCallback(async () => {
    const response = await getProducts(1, 100);
    const payload = response.data || response;
    if (payload && Array.isArray(payload.data)) {
      let all = payload.data;
      const totalPages = payload.pagination?.totalPages || 1;
      if (totalPages > 1) {
        const extra = await Promise.all(
          Array.from({ length: Math.min(totalPages - 1, 9) }, (_, i) =>
            getProducts(i + 2, 100)
          )
        );
        for (const res of extra) {
          const p = res.data || res;
          if (p && Array.isArray(p.data)) {
            all = all.concat(p.data);
          }
        }
      }
      return all;
    }
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.products)) return payload.products;
    return [];
  }, []);

  const refreshProducts = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const all = await loadAllProducts();
        setProducts(all);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [loadAllProducts]
  );

  useEffect(() => {
    let active = true;
    loadAllProducts()
      .then((all) => {
        if (active) setProducts(all);
      })
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAllProducts]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError(null);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Auto-dismiss feedback banner
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const openAddDrawer = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price !== undefined ? String(product.price) : "",
      costPrice:
        product.costPrice !== undefined && product.costPrice !== null
          ? String(product.costPrice)
          : "",
      stockQuantity:
        product.stockQuantity !== undefined ? String(product.stockQuantity) : "0",
    });
    setError(null);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      return setError("Product name must be at least 2 characters.");
    }
    if (formData.price === "" || isNaN(formData.price) || Number(formData.price) < 0) {
      return setError("Selling price must be 0 or greater.");
    }
    if (
      formData.costPrice !== "" &&
      (isNaN(formData.costPrice) || Number(formData.costPrice) < 0)
    ) {
      return setError("Cost price cannot be negative.");
    }
    if (
      formData.stockQuantity === "" ||
      isNaN(formData.stockQuantity) ||
      Number(formData.stockQuantity) < 0
    ) {
      return setError("Stock quantity must be 0 or greater.");
    }

    const payload = {
      name: trimmedName,
      description: formData.description.trim(),
      price: Number(formData.price),
      costPrice: formData.costPrice === "" ? 0 : Number(formData.costPrice),
      stockQuantity: Number(formData.stockQuantity),
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateProduct(editingId, payload);
        setToastMsg(`Updated “${trimmedName}”.`);
      } else {
        await createProduct(payload);
        setToastMsg(`Added “${trimmedName}” to inventory.`);
        setPage(1);
      }
      closeDrawer();
      await refreshProducts(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? This can't be undone.`)) {
      return;
    }
    try {
      await deleteProduct(product._id);
      setToastMsg(`Deleted “${product.name}”.`);
      await refreshProducts(false);
    } catch {
      alert("Failed to delete product.");
    }
  };

  // Filter counts & list
  const getFilterCount = (filterId) => {
    if (filterId === "all") return products.length;
    if (filterId === "low") {
      return products.filter(
        (p) => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) < LOW_STOCK_THRESHOLD
      ).length;
    }
    if (filterId === "out") {
      return products.filter((p) => Number(p.stockQuantity) <= 0).length;
    }
    return products.length;
  };

  const stockFiltered = products.filter((p) => {
    const qty = Number(p.stockQuantity) || 0;
    if (activeFilter === "low") return qty > 0 && qty < LOW_STOCK_THRESHOLD;
    if (activeFilter === "out") return qty <= 0;
    return true;
  });

  const searchTerm = search.trim().toLowerCase();
  const visibleProducts = searchTerm
    ? stockFiltered.filter((p) =>
        [p.name, p.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(searchTerm))
      )
    : stockFiltered;

  const totalItems = visibleProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedProducts = visibleProducts.slice(
    (safePage - 1) * limit,
    safePage * limit
  );

  const listPagination = {
    currentPage: safePage,
    totalPages,
    totalItems,
    limit,
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Live profit calculation inside drawer
  const draftPrice = Number(formData.price);
  const draftCost = Number(formData.costPrice);
  const showMarginHint =
    formData.price !== "" &&
    !isNaN(draftPrice) &&
    draftPrice > 0 &&
    formData.costPrice !== "" &&
    !isNaN(draftCost) &&
    draftCost >= 0;
  const draftProfit = draftPrice - draftCost;
  const draftMarginPct = draftPrice > 0 ? Math.round((draftProfit / draftPrice) * 100) : 0;

  return (
    <DashboardLayout>
      {/* Feedback banner */}
      {toastMsg && (
        <div className="mb-4">
          <Alert type="success" message={toastMsg} />
        </div>
      )}

      {/* ───────── Mobile View ───────── */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-tx-main tracking-tight">
              Inventory
            </h1>
            <p className="text-tx-subtle text-xs mt-0.5">
              Products, prices and stock levels
            </p>
          </div>
          {products.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 tabular-nums">
              {products.length} items
            </span>
          )}
        </div>

        {/* Mobile Search */}
        <label className="relative block mb-3">
          <span className="sr-only">Search products</span>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search product name or description"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-base-border bg-base-surface text-xs text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          />
        </label>

        {/* Mobile Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-2">
          {stockFilters.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFilter(f.id);
                  setPage(1);
                }}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "bg-base-surface border-base-border text-tx-muted"
                }`}
              >
                {f.label}
                <span
                  className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    active
                      ? "bg-emerald-800 text-white"
                      : "bg-base-border-subtle text-tx-muted"
                  }`}
                >
                  {getFilterCount(f.id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Cards */}
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-tx-subtle">
            <FiLoader className="w-4 h-4 animate-spin" />
            Loading inventory…
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="bg-base-surface rounded-2xl border border-base-border-subtle p-8 text-center">
            <FiPackage className="w-6 h-6 text-tx-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-tx-main">
              {searchTerm
                ? `No products match “${search.trim()}”`
                : activeFilter === "low"
                ? "No low-stock products"
                : activeFilter === "out"
                ? "No out-of-stock products"
                : "No products yet"}
            </p>
            <p className="text-xs text-tx-subtle mt-1">
              {searchTerm
                ? "Try a different product name or description."
                : activeFilter === "all"
                ? "Add your first product to start creating orders."
                : "All other products are well stocked."}
            </p>
            {activeFilter === "all" && !searchTerm && (
              <button
                type="button"
                onClick={openAddDrawer}
                className="mt-4 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add product
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedProducts.map((product) => {
              const price = Number(product.price) || 0;
              const cost = Number(product.costPrice) || 0;
              const stock = getStockBadge(product.stockQuantity);
              return (
                <div
                  key={product._id}
                  className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-tx-main truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-tx-subtle mt-0.5 line-clamp-2">
                        {product.description || "No description"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-tx-main tabular-nums">
                        {currency} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {cost > 0 && (
                        <p className="text-[11px] text-tx-subtle tabular-nums mt-0.5">
                          Cost {currency} {cost.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-base-border-subtle">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums ${stock.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stock.dot}`} />
                      {stock.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDrawer(product)}
                        className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-base-border bg-base-surface text-xs font-semibold text-tx-main hover:bg-base-bg"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        aria-label={`Delete ${product.name}`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-danger-600 hover:bg-danger-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          pagination={listPagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="products"
        />

        {/* Floating Add Product Button */}
        <button
          type="button"
          onClick={openAddDrawer}
          className="fixed right-4 bottom-20 z-30 flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold pl-4 pr-5 py-3 rounded-full shadow-lg transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add product
        </button>
      </div>

      {/* ───────── Desktop View ───────── */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tx-main tracking-tight">
              Inventory
            </h1>
            <p className="text-tx-subtle text-sm mt-1">
              Manage your product catalog, pricing and stock levels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative">
              <span className="sr-only">Search products</span>
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-subtle pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search product or description"
                className="w-64 lg:w-80 h-10 pl-9 pr-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              />
            </label>
            <button
              type="button"
              onClick={openAddDrawer}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add product
            </button>
          </div>
        </div>

        <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
          {/* Stock filter tabs */}
          <div className="flex items-center justify-between gap-4 px-2 border-b border-base-border">
            <div role="tablist" aria-label="Stock filters" className="flex">
              {stockFilters.map((f) => {
                const active = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveFilter(f.id);
                      setPage(1);
                    }}
                    className={`relative flex items-center gap-2 px-4 h-12 text-sm font-medium transition-colors ${
                      active ? "text-tx-main" : "text-tx-subtle hover:text-tx-main"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                        active
                          ? "bg-emerald-800 text-white"
                          : "bg-base-border-subtle text-tx-muted"
                      }`}
                    >
                      {getFilterCount(f.id)}
                    </span>
                    {active && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-emerald-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-tx-subtle">
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading products…
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <p className="text-sm font-semibold text-tx-main">
                {searchTerm
                  ? `No products match “${search.trim()}”`
                  : activeFilter === "low"
                  ? "No low-stock products"
                  : activeFilter === "out"
                  ? "No out-of-stock products"
                  : "No products yet"}
              </p>
              <p className="text-sm text-tx-subtle mt-1">
                {searchTerm
                  ? "Try a different name or description."
                  : activeFilter === "all"
                  ? "Add your first product so you can select it when creating orders."
                  : "All other items are above the low-stock threshold."}
              </p>
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 h-9 px-4 rounded-lg border border-base-border text-sm font-medium text-tx-main hover:bg-base-bg"
                >
                  Clear search
                </button>
              ) : (
                activeFilter === "all" && (
                  <button
                    type="button"
                    onClick={openAddDrawer}
                    className="mt-4 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add product
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-base-border-subtle text-xs text-tx-subtle">
                    <th className="py-3 pl-5 pr-3 font-medium">Product</th>
                    <th className="py-3 px-3 font-medium text-right">Selling price</th>
                    <th className="py-3 px-3 font-medium text-right">Cost / Profit</th>
                    <th className="py-3 px-3 font-medium">Stock</th>
                    <th className="py-3 pl-3 pr-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const price = Number(product.price) || 0;
                    const cost = Number(product.costPrice) || 0;
                    const profit = price - cost;
                    const stock = getStockBadge(product.stockQuantity);

                    return (
                      <tr
                        key={product._id}
                        className="border-b border-base-border-subtle last:border-b-0 hover:bg-base-bg/60 transition-colors"
                      >
                        <td className="py-3.5 pl-5 pr-3 max-w-md">
                          <p className="font-semibold text-tx-main truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-tx-subtle truncate mt-0.5">
                            {product.description || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-semibold text-tx-main tabular-nums">
                          {currency}{" "}
                          {price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap tabular-nums">
                          {cost > 0 ? (
                            <>
                              <p className="text-xs text-tx-muted">
                                {currency}{" "}
                                {cost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p
                                className={`text-[11px] font-medium mt-0.5 ${
                                  profit >= 0 ? "text-emerald-700" : "text-danger-600"
                                }`}
                              >
                                {profit >= 0 ? "+" : ""}
                                {currency} {profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-tx-subtle">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${stock.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stock.dot}`} />
                            {stock.label}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-right space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(product)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="text-xs font-semibold text-danger-600 hover:text-danger-700 hover:underline underline-offset-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 pb-4">
            <Pagination
              pagination={listPagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              itemLabel="products"
            />
          </div>
        </div>
      </div>

      {/* ───────── Add / Edit Product Slide-Over Drawer ───────── */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-tx-main/25 backdrop-blur-[1px]"
            onClick={closeDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-drawer-title"
            className="fixed inset-y-0 right-0 z-50 w-full md:max-w-md bg-base-surface shadow-2xl border-l border-base-border flex flex-col"
          >
            {/* Drawer Header */}
            <div className="h-14 px-5 border-b border-base-border-subtle flex items-center justify-between shrink-0">
              <h2
                id="product-drawer-title"
                className="text-base font-bold text-tx-main"
              >
                {editingId ? "Edit product" : "Add product"}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close"
                className="w-9 h-9 -mr-2 flex items-center justify-center rounded-lg text-tx-subtle hover:text-tx-main hover:bg-base-bg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <form
              id="product-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              <Alert type="error" message={error} />

              <div>
                <label
                  htmlFor="prod-name"
                  className="block text-xs font-semibold text-tx-main mb-1.5"
                >
                  Product name <span className="text-danger-500">*</span>
                </label>
                <input
                  id="prod-name"
                  type="text"
                  name="name"
                  autoFocus
                  placeholder="e.g. Wall Art 076"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prod-price"
                    className="block text-xs font-semibold text-tx-main mb-1.5"
                  >
                    Selling price ({currency}) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main tabular-nums placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-cost"
                    className="block text-xs font-semibold text-tx-main mb-1.5"
                  >
                    Cost price ({currency})
                  </label>
                  <input
                    id="prod-cost"
                    type="number"
                    name="costPrice"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main tabular-nums placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </div>

              {showMarginHint && (
                <p
                  className={`text-xs font-medium tabular-nums ${
                    draftProfit >= 0 ? "text-emerald-700" : "text-danger-600"
                  }`}
                >
                  Profit per unit: {currency}{" "}
                  {draftProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ({draftMarginPct}% margin)
                </p>
              )}

              <div>
                <label
                  htmlFor="prod-stock"
                  className="block text-xs font-semibold text-tx-main mb-1.5"
                >
                  Stock quantity <span className="text-danger-500">*</span>
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  name="stockQuantity"
                  min="0"
                  placeholder="0"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main tabular-nums placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
                <p className="text-[11px] text-tx-subtle mt-1">
                  Items below {LOW_STOCK_THRESHOLD} units are flagged as low stock.
                </p>
              </div>

              <div>
                <label
                  htmlFor="prod-desc"
                  className="block text-xs font-semibold text-tx-main mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  name="description"
                  rows={3}
                  placeholder="Size, color, material or short notes (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 resize-none"
                />
              </div>
            </form>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-base-border-subtle bg-base-surface flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={closeDrawer}
                className="flex-1 h-11 rounded-xl border border-base-border bg-base-surface text-sm font-semibold text-tx-main hover:bg-base-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={saving}
                className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {saving && <FiLoader className="w-4 h-4 animate-spin" />}
                {saving
                  ? "Saving…"
                  : editingId
                  ? "Update product"
                  : "Save product"}
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Products;
