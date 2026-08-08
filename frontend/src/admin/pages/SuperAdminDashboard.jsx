import { useEffect, useState } from "react";
import { getPlatformStats } from "../services/superAdminService";
import Card from "../../components/ui/Card";
import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getPlatformStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  const statCards = [
    {
      title: "Total Tenants",
      value: stats?.totalTenants || 0,
      icon: FiBriefcase,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeTenants || 0,
      icon: FiCheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Super Admins",
      value: stats?.superAdmins || 0,
      icon: FiShield,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">Platform Overview</h1>
        <p className="text-sm text-tx-muted mt-1">
          Monitor your ERP system's health and statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tx-subtle">{stat.title}</p>
                <p className="text-3xl font-bold text-tx-main mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
