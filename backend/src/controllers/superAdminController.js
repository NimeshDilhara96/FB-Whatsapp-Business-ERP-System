import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

// @desc    Get platform statistics
// @route   GET /api/superadmin/stats
// @access  Private (Super Admin)
export const getPlatformStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ "subscription.status": "Active" });
    const totalUsers = await User.countDocuments();
    const superAdmins = await User.countDocuments({ role: "superadmin" });

    res.json({
      totalTenants,
      activeTenants,
      totalUsers,
      superAdmins,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching platform stats", error: error.message });
  }
};

// @desc    Get all tenants
// @route   GET /api/superadmin/tenants
// @access  Private (Super Admin)
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenants", error: error.message });
  }
};

// @desc    Update tenant status
// @route   PUT /api/superadmin/tenants/:id/status
// @access  Private (Super Admin)
export const updateTenantStatus = async (req, res) => {
  try {
    const { status } = req.body; // e.g., "Active", "Suspended"
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (!["Active", "Expired", "Suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    tenant.subscription.status = status;
    await tenant.save();

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: "Error updating tenant status", error: error.message });
  }
};

// @desc    Get all users across the platform
// @route   GET /api/superadmin/users
// @access  Private (Super Admin)
export const getAllUsers = async (req, res) => {
  try {
    // Select essential fields, populate tenant details if needed
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};
