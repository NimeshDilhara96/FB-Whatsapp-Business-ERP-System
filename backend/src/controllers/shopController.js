import Tenant from "../models/Tenant.js";
import Product from "../models/Product.js";

export const getShopDetails = async (req, res) => {
  try {
    const { shopSlug } = req.params;

    // Find the tenant by shopSlug
    const tenant = await Tenant.findOne({ shopSlug });

    if (!tenant) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check if the tenant's subscription plan is Pro
    if (tenant.subscription && tenant.subscription.plan !== "Pro") {
      return res.status(403).json({ message: "Storefront feature is only available on the Pro plan." });
    }

    // Check if the tenant's subscription is active
    if (tenant.subscription && tenant.subscription.status !== "Active") {
      return res.status(403).json({ message: "Shop is currently unavailable" });
    }

    // Fetch products belonging to this tenant, excluding sensitive information like costPrice
    const products = await Product.find({ tenantId: tenant.tenantId })
      .select("-costPrice -tenantId");

    res.status(200).json({
      shop: {
        companyName: tenant.companyName,
        currency: tenant.currency,
      },
      products,
    });
  } catch (error) {
    console.error("Error fetching shop details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
