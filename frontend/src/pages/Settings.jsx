import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { updateTenantCurrency } from "../services/tenantService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

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
        <h1 className="text-2xl font-bold text-tx-main mb-6">Workspace Settings</h1>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-tx-main mb-4">Localization</h2>
          
          {error && <Alert type="error" message={error} className="mb-4" />}
          {success && <Alert type="success" message={success} className="mb-4" />}

          <div className="mb-6">
            <label className="block text-sm font-medium text-tx-main mb-2">
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
            <p className="text-xs text-tx-muted mt-2">
              This currency symbol will be used throughout the dashboard and reports.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading || currency === user?.currency}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="text-lg font-bold text-tx-main mb-4">Subscription Plan</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-base-surface border border-base-border rounded-lg p-4">
              <p className="text-sm text-tx-subtle mb-1">Current Plan</p>
              <p className="text-lg font-bold text-tx-main">{user?.subscription?.plan || 'Free'}</p>
            </div>
            
            <div className="bg-base-surface border border-base-border rounded-lg p-4">
              <p className="text-sm text-tx-subtle mb-1">Status</p>
              <p className={`text-lg font-bold ${user?.subscription?.status === 'Active' ? 'text-success-500' : 'text-danger-500'}`}>
                {user?.subscription?.status || 'Unknown'}
              </p>
            </div>
            
            <div className="bg-base-surface border border-base-border rounded-lg p-4">
              <p className="text-sm text-tx-subtle mb-1">Expires On</p>
              <p className="text-lg font-bold text-tx-main">
                {user?.subscription?.expiresAt 
                  ? new Date(user.subscription.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
