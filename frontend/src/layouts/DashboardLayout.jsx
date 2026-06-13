import { useAuthStore } from "../store/authStore";

export default function DashboardLayout({ children }) {
    const logout = useAuthStore((state) => state.logout);

    return (
        <div style={{ display: "flex", height: "100vh" }}>

            {/* Sidebar */}
            <div style={{ width: 250, background: "#111", color: "white", padding: 20 }}>
                <h2>SocialERP</h2>

                <p>📊 Dashboard</p>
                <p>📦 Products</p>
                <p>👥 Customers</p>
                <p>🧾 Orders</p>
                <p>📦 Inventory</p>
                <p>💰 Reports</p>

                <button onClick={logout} style={{ marginTop: 20 }}>
                    Logout
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: 20 }}>
                {children}
            </div>
        </div>
    );
}