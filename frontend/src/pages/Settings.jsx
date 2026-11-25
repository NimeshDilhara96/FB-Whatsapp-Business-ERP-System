import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { updateTenantCurrency } from "../services/tenantService";
import Alert from "../components/ui/Alert";
import {
  FiCheck,
  FiClock,
  FiCreditCard,
  FiGlobe,
  FiInfo,
  FiLoader,
  FiShoppingBag,
} from "react-icons/fi";

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

const currencies = [
  { label: "Sri Lankan Rupee", code: "LKR", value: "Rs." },
  { label: "US Dollar", code: "USD", value: "$" },
  { label: "Euro", code: "EUR", value: "€" },
  { label: "British Pound", code: "GBP", value: "£" },
];

const navSections = [
  { id: "store", label: "Store details", icon: FiShoppingBag },
  { id: "localization", label: "Currency", icon: FiGlobe },
  { id: "subscription", label: "Subscription", icon: FiCreditCard },
  { id: "updates", label: "Updates", icon: FiClock },
];

const changelogData = [
  {
    version: "v1.0.8",
    date: "November 23, 2026",
    changes: ["Security enhancements and mobile & desktop UI/UX improvements"],
  },
  {
    version: "v1.0.5",
    date: "September 22, 2026",
    changes: ["Performance optimization", "Security optimization"],
  },
  {
    version: "v1.0.4",
    date: "August 08, 2026",
    changes: [
      "Added online Store feature",
      "Added Subscription Plan feature",
      "Security update",
    ],
  },
  {
    version: "v1.0.3",
    date: "July 09, 2026",
    changes: ["Fixed multiple tenant creation issue"],
  },
  {
    version: "v1.0.2",
    date: "June 30, 2026",
    changes: [
      "Server migration from US-East to South Asia",
      "Speed optimization",
    ],
  },
  {
    version: "v1.0.1",
    date: "June 29, 2026",
    changes: [
      "Rate limiting and request sanitization",
      "Speed optimization",
    ],
  },
  {
    version: "v1.0.0",
    date: "June 27, 2026",
    changes: [
      "Multi-tenancy: Secure, isolated data environments for independent businesses.",
      "Smart Order Engine: Strict state-machine flow (Pending → Processing → Shipped → Delivered) with real-time inventory sync.",
      "Subscription Management: Automated billing tiers (Free/Basic/Pro) with read-only mode for expired plans.",
      "Financial Dashboard: Real-time analytics for revenue and receivables.",
    ],
  },
];

export default function Settings() {
  const { user, updateUserCurrency } = useAuthStore();
  const [activeSection, setActiveSection] = useState("store");

  // Store details form state (UI-only for now; backend wiring planned later)
  const initialStore = {
    companyName: user?.companyName || "",
    shopSlug: user?.shopSlug || "",
    whatsappNumber: user?.whatsappNumber || "",
    email: user?.email || "",
    city: user?.city || "",
    address: user?.address || "",
    tagline: user?.tagline || "",
  };
  const [storeForm, setStoreForm] = useState(initialStore);
  const [storeNotice, setStoreNotice] = useState(null);
  const [storeError, setStoreError] = useState(null);

  // Currency form state (wired to existing PUT /tenant/currency API)
  const [currency, setCurrency] = useState(user?.currency || "Rs.");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencySuccess, setCurrencySuccess] = useState(null);
  const [currencyError, setCurrencyError] = useState(null);

  const hasStoreChanges =
    storeForm.companyName !== initialStore.companyName ||
    storeForm.shopSlug !== initialStore.shopSlug ||
    storeForm.whatsappNumber !== initialStore.whatsappNumber ||
    storeForm.email !== initialStore.email ||
    storeForm.city !== initialStore.city ||
    storeForm.address !== initialStore.address ||
    storeForm.tagline !== initialStore.tagline;

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreNotice(null);
    setStoreError(null);
    if (name === "shopSlug") {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setStoreForm((prev) => ({ ...prev, shopSlug: cleaned }));
      return;
    }
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    setStoreError(null);
    setStoreNotice(null);

    if (storeForm.companyName.trim().length < 2) {
      return setStoreError("Store name must be at least 2 characters.");
    }
    if (
      storeForm.whatsappNumber.trim() &&
      !/^[0-9]{10}$/.test(storeForm.whatsappNumber.trim())
    ) {
      return setStoreError(
        "Please enter a valid 10-digit WhatsApp number (e.g. 0771234567)."
      );
    }

    setStoreNotice(
      "Store details UI is ready. Saving to the server will be enabled once the backend endpoint is connected."
    );
  };

  const handleResetStore = () => {
    setStoreForm(initialStore);
    setStoreError(null);
    setStoreNotice(null);
  };

  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    setCurrencyError(null);
    setCurrencySuccess(null);
    try {
      await updateTenantCurrency(currency);
      updateUserCurrency(currency);
      setCurrencySuccess("Default currency updated.");
    } catch (err) {
      setCurrencyError(
        err.response?.data?.message || "Failed to update currency."
      );
    } finally {
      setSavingCurrency(false);
    }
  };

  const plan = user?.subscription?.plan || "Free";
  const status = user?.subscription?.status || "Unknown";
  const isActivePlan = status === "Active";
  const expiresLabel = user?.subscription?.expiresAt
    ? new Date(user.subscription.expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-tx-main tracking-tight">
            Settings
          </h1>
          <p className="text-tx-subtle text-xs md:text-sm mt-0.5 md:mt-1">
            Manage your store profile, currency, and workspace plan.
          </p>
        </div>

        {/* Mobile Section Chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-3">
          {navSections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "bg-base-surface border-base-border text-tx-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Desktop 2-Column Shell / Mobile Single Column */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Desktop Left Settings Nav */}
          <nav
            aria-label="Settings sections"
            className="hidden md:flex flex-col gap-1 w-56 shrink-0 bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-2"
          >
            {navSections.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                    active
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-tx-muted hover:text-tx-main hover:bg-base-bg"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Main Settings Pane */}
          <div className="flex-1 w-full min-w-0 space-y-5">
            {/* ───────── 1. Store Details ───────── */}
            {activeSection === "store" && (
              <>
                <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
                  <div className="p-4 md:p-6 border-b border-base-border-subtle flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-tx-main">
                        Store details
                      </h2>
                      <p className="text-xs text-tx-subtle mt-0.5">
                        Business information shown on your dashboard, invoices,
                        and customer links.
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      UI Preview
                    </span>
                  </div>

                  <form
                    onSubmit={handleStoreSubmit}
                    className="p-4 md:p-6 space-y-4"
                  >
                    {storeError && <Alert type="error" message={storeError} />}
                    {storeNotice && (
                      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-primary-200 bg-primary-50 text-xs text-primary-800">
                        <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-primary-700" />
                        <span>{storeNotice}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="store-name"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          Store / Business name{" "}
                          <span className="text-danger-500">*</span>
                        </label>
                        <input
                          id="store-name"
                          name="companyName"
                          type="text"
                          value={storeForm.companyName}
                          onChange={handleStoreChange}
                          placeholder="e.g. Noon Arts"
                          className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="store-slug"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          Store handle
                        </label>
                        <div className="flex items-center h-10 rounded-lg border border-base-border bg-base-surface overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/30">
                          <span className="px-2.5 text-xs text-tx-subtle bg-base-bg border-r border-base-border h-full inline-flex items-center shrink-0">
                            shop/
                          </span>
                          <input
                            id="store-slug"
                            name="shopSlug"
                            type="text"
                            value={storeForm.shopSlug}
                            onChange={handleStoreChange}
                            placeholder="noon-arts"
                            className="w-full h-full px-2.5 text-sm text-tx-main placeholder:text-tx-subtle outline-none bg-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="store-whatsapp"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          Business WhatsApp number
                        </label>
                        <input
                          id="store-whatsapp"
                          name="whatsappNumber"
                          type="tel"
                          value={storeForm.whatsappNumber}
                          onChange={handleStoreChange}
                          placeholder="0771234567"
                          className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main tabular-nums placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="store-email"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          Business email
                        </label>
                        <input
                          id="store-email"
                          name="email"
                          type="email"
                          value={storeForm.email}
                          onChange={handleStoreChange}
                          placeholder="orders@yourstore.com"
                          className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="store-city"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          City
                        </label>
                        <select
                          id="store-city"
                          name="city"
                          value={storeForm.city}
                          onChange={handleStoreChange}
                          className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        >
                          <option value="">Select city</option>
                          {cities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="store-address"
                          className="block text-xs font-semibold text-tx-main mb-1.5"
                        >
                          Store address
                        </label>
                        <input
                          id="store-address"
                          name="address"
                          type="text"
                          value={storeForm.address}
                          onChange={handleStoreChange}
                          placeholder="Street address"
                          className="w-full h-10 px-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="store-tagline"
                        className="block text-xs font-semibold text-tx-main mb-1.5"
                      >
                        Short description / receipt note
                      </label>
                      <textarea
                        id="store-tagline"
                        name="tagline"
                        rows={2}
                        value={storeForm.tagline}
                        onChange={handleStoreChange}
                        placeholder="e.g. Handcrafted gifts delivered island-wide."
                        className="w-full p-3 rounded-lg border border-base-border bg-base-surface text-sm text-tx-main placeholder:text-tx-subtle outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 resize-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-base-border-subtle flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
                      {hasStoreChanges && (
                        <button
                          type="button"
                          onClick={handleResetStore}
                          className="h-10 px-4 rounded-xl border border-base-border bg-base-surface text-xs font-semibold text-tx-main hover:bg-base-bg transition-colors"
                        >
                          Discard changes
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!hasStoreChanges}
                        className="h-10 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save store details
                      </button>
                    </div>
                  </form>
                </div>

                {/* Storefront Preview Card */}
                <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-tx-main">
                        Public storefront link
                      </h3>
                      <p className="text-xs text-tx-subtle mt-1">
                        We are building a shareable catalog link so customers
                        can browse your products directly before messaging you
                        on WhatsApp.
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                      Coming soon
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ───────── 2. Currency & Localization ───────── */}
            {activeSection === "localization" && (
              <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
                <div className="p-4 md:p-6 border-b border-base-border-subtle">
                  <h2 className="text-base md:text-lg font-bold text-tx-main">
                    Currency & localization
                  </h2>
                  <p className="text-xs text-tx-subtle mt-0.5">
                    Used across your dashboard, orders, inventory, and reports.
                  </p>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                  {currencyError && (
                    <Alert type="error" message={currencyError} />
                  )}
                  {currencySuccess && (
                    <Alert type="success" message={currencySuccess} />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currencies.map((c) => {
                      const selected = currency === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setCurrency(c.value);
                            setCurrencySuccess(null);
                            setCurrencyError(null);
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors ${
                            selected
                              ? "border-emerald-700 bg-primary-50/60"
                              : "border-base-border bg-base-surface hover:bg-base-bg"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                                selected
                                  ? "bg-emerald-800 text-white"
                                  : "bg-base-bg text-tx-main"
                              }`}
                            >
                              {c.value}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-tx-main">
                                {c.label}
                              </p>
                              <p className="text-xs text-tx-subtle">{c.code}</p>
                            </div>
                          </div>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center">
                              <FiCheck className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-tx-subtle tabular-nums">
                    Format preview:{" "}
                    <span className="font-semibold text-tx-main">
                      {currency} 24,500.00
                    </span>
                  </p>

                  <div className="pt-3 border-t border-base-border-subtle flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveCurrency}
                      disabled={savingCurrency || currency === user?.currency}
                      className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingCurrency && (
                        <FiLoader className="w-4 h-4 animate-spin" />
                      )}
                      {savingCurrency ? "Saving…" : "Save currency"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────── 3. Subscription Plan ───────── */}
            {activeSection === "subscription" && (
              <div className="space-y-4">
                {/* Plan Hero */}
                <div className="rounded-2xl bg-emerald-800 text-white p-5 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-100">
                        Current workspace plan
                      </p>
                      <p className="text-2xl font-bold tracking-tight mt-1">
                        {plan} Plan
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isActivePlan
                          ? "bg-white/15 text-white"
                          : "bg-danger-500 text-white"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="border-t border-white/15 mt-4 pt-3 flex items-center justify-between text-xs">
                    <span className="text-emerald-100">Valid until</span>
                    <span className="font-semibold tabular-nums">
                      {expiresLabel}
                    </span>
                  </div>
                </div>

                {/* Workspace Summary */}
                <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm p-4 md:p-6">
                  <h3 className="text-sm font-bold text-tx-main mb-3">
                    Workspace account
                  </h3>
                  <dl className="divide-y divide-base-border-subtle text-sm">
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-tx-subtle text-xs">Owner</dt>
                      <dd className="font-semibold text-tx-main text-xs md:text-sm">
                        {user?.name || "—"}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-tx-subtle text-xs">Email</dt>
                      <dd className="font-medium text-tx-main text-xs md:text-sm truncate">
                        {user?.email || "—"}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-tx-subtle text-xs">Store</dt>
                      <dd className="font-medium text-tx-main text-xs md:text-sm">
                        {user?.companyName || "—"}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-tx-subtle text-xs">Currency</dt>
                      <dd className="font-medium text-tx-main text-xs md:text-sm">
                        {user?.currency || "Rs."}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* ───────── 4. Changelog & Updates ───────── */}
            {activeSection === "updates" && (
              <div className="bg-base-surface rounded-2xl border border-base-border-subtle shadow-sm">
                <div className="p-4 md:p-6 border-b border-base-border-subtle">
                  <h2 className="text-base md:text-lg font-bold text-tx-main">
                    Release notes
                  </h2>
                  <p className="text-xs text-tx-subtle mt-0.5">
                    Recent improvements and fixes to Orderflow.
                  </p>
                </div>

                <div className="p-4 md:p-6 space-y-5">
                  {changelogData.map((release, index) => (
                    <div
                      key={release.version}
                      className="pl-4 border-l-2 border-emerald-700/70"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-tx-main">
                            {release.version}
                          </h3>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-tx-subtle">
                          {release.date}
                        </span>
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-xs md:text-sm text-tx-subtle">
                        {release.changes.map((change, idx) => (
                          <li key={idx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
