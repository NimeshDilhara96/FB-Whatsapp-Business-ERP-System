import { useEffect, useState } from "react";
import { getAllTenants, updateTenantStatus } from "../services/superAdminService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function ManageTenants() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const { data } = await getAllTenants();
      setTenants(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await updateTenantStatus(tenantId, newStatus);
      // Update local state
      setTenants((prev) =>
        prev.map((t) =>
          t._id === tenantId
            ? { ...t, subscription: { ...t.subscription, status: newStatus } }
            : t
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">Manage Tenants</h1>
        <p className="text-sm text-tx-muted mt-1">
          View and manage all registered companies/shops on the platform.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-base-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Shop Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-tx-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-base-border">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-tx-main">{tenant.companyName}</div>
                    <div className="text-xs text-tx-muted">{tenant.tenantId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-tx-subtle">{tenant.shopSlug || "N/A"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {tenant.subscription?.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.subscription?.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : tenant.subscription?.status === "Suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tenant.subscription?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-tx-subtle">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {tenant.subscription?.status === "Active" ? (
                      <button
                        onClick={() => handleStatusChange(tenant._id, "Suspended")}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(tenant._id, "Active")}
                        className="text-green-600 hover:text-green-900 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-tx-muted">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
