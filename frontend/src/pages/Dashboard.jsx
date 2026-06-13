import DashboardLayout from "../layouts/DashboardLayout";

export default function Dashboard() {
    return (
        <DashboardLayout>
            <h1>ERP Dashboard</h1>

            <div style={{ display: "flex", gap: 20 }}>
                <div>📦 Orders Today: 10</div>
                <div>💰 Revenue: Rs. 25,000</div>
                <div>⚠️ Low Stock: 3</div>
            </div>
        </DashboardLayout>
    );
}