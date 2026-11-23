import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { updateTenantCurrency } from "../services/tenantService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

const changelogData = [
  {
    version: "v1.0.8",
    date: "november 23, 2026",
    changes: ["adding security features and ui/ux improvements"],
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
      "Adding online Store Feature",
      "Added Subscription Plan feature",
      "Security update",
    ],
  },
  {
    version: "v1.0.3",
    date: "July 09, 2026",
    changes: ["Multiple tenant create issue fix(bug Fixed)"],
  },
  {
    version: "v1.0.2",
    date: "June 30, 2026",
    changes: [
      " Server migration from us-east to south-Asia",
      "Speed optimization",
    ],
  },
  {
    version: "v1.0.1",
    date: "June 29, 2026",
    changes: [" rate limiting, and request sanitization", "speed optimization"],
  },
  {
    version: "v1.0.0",
    date: "June 27, 2026",
    changes: [
      "Multi-tenancy: Secure, 100% isolated data environments for independent businesses.",
      "Smart Order Engine: Strict state-machine logic (Pending ➔ Processing ➔ Shipped ➔ Delivered) with real-time inventory sync.",
      "Subscription Management: Automated billing tiers (Free/Basic/Pro) with a secure Read-Only Mode for expired plans.",
      "Financial Dashboard: Real-time analytics for revenue and receivables.",
    ],
  },
];

export default function Settings() {
  const { user, updateUserCurrency } = useAuthStore();
  const [currency, setCurrency] = useState(user?.currency || "Rs.");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const currencies = [
    { label: "Rupees (Rs.)", value: "Rs." },
    { label: "US Dollar ($)", value: "$" },
    { label: "Euro (€)", value: "€" },
    { label: "British Pound (£)", value: "£" },
  ];

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateTenantCurrency(currency);
      updateUserCurrency(currency);
      setSuccess("Currency updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update currency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-tx-main">
          Workspace Settings
        </h1>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-tx-main">Localization</h2>

          {error && <Alert type="error" message={error} className="mb-4" />}
          {success && (
            <Alert type="success" message={success} className="mb-4" />
          )}

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-tx-main">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm text-tx-main bg-base-bg border border-base-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-tx-muted">
              This currency symbol will be used throughout the dashboard and
              reports.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-tx-main">
              Storefront Link
            </h3>

            <div className="p-4 mb-4 border rounded-lg bg-primary-50 border-primary-200">
              <p className="text-sm font-bold text-primary-800">
                Coming Soon! 🚀
              </p>
              <p className="mt-1 text-xs text-primary-700">
                We are actively building the public storefront feature. Soon
                you'll be able to share a unique link with your customers to let
                them view your products directly!
              </p>
            </div>

            <div className="hidden">
              {user?.subscription?.plan === "Pro" ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        user?.shopSlug
                          ? `${import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3000"}/${user.shopSlug}`
                          : "Not available"
                      }
                      className="w-full pl-4 pr-4 py-2.5 text-sm text-tx-main bg-base-bg border border-base-border rounded-lg focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (user?.shopSlug) {
                          navigator.clipboard.writeText(
                            `${import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3000"}/${user.shopSlug}`,
                          );
                          setSuccess("Storefront link copied to clipboard.");
                        }
                      }}
                      disabled={!user?.shopSlug}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-tx-muted">
                    Share this link with your customers to let them view your
                    available products.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-between gap-4 p-4 border rounded-lg bg-warning-50 border-warning-200 sm:flex-row">
                  <div>
                    <p className="text-sm font-bold text-warning-800">
                      Pro Feature
                    </p>
                    <p className="mt-1 text-xs text-warning-700">
                      Upgrade your workspace to the Pro plan to unlock your
                      unique public storefront.
                    </p>
                  </div>
                  <Button variant="primary" className="whitespace-nowrap">
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading || currency === user?.currency}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="mb-4 text-lg font-bold text-tx-main">
            Subscription Plan
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-4 border rounded-lg bg-base-surface border-base-border">
              <p className="mb-1 text-sm text-tx-subtle">Current Plan</p>
              <p className="text-lg font-bold text-tx-main">
                {user?.subscription?.plan || "Free"}
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-base-surface border-base-border">
              <p className="mb-1 text-sm text-tx-subtle">Status</p>
              <p
                className={`text-lg font-bold ${user?.subscription?.status === "Active" ? "text-success-500" : "text-danger-500"}`}
              >
                {user?.subscription?.status || "Unknown"}
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-base-surface border-base-border">
              <p className="mb-1 text-sm text-tx-subtle">Expires On</p>
              <p className="text-lg font-bold text-tx-main">
                {user?.subscription?.expiresAt
                  ? new Date(user.subscription.expiresAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="mb-4 text-lg font-bold text-tx-main">
            System Changelog & Updates
          </h2>
          <div className="space-y-6">
            {changelogData.map((release, index) => (
              <div
                key={index}
                className="pb-2 pl-4 border-l-2 border-primary-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-md text-tx-main">
                    {release.version}
                  </h3>
                  <span className="text-xs text-tx-muted">{release.date}</span>
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  {release.changes.map((change, idx) => (
                    <li key={idx} className="text-sm text-tx-subtle">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
