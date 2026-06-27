import Tenant from "../models/Tenant.js";

export const updateCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency) {
      return res.status(400).json({ message: "Currency is required" });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId: req.tenantId },
      { currency },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json({ message: "Currency updated successfully", currency: tenant.currency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
