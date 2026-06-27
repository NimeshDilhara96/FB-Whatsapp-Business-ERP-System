import Tenant from "../models/Tenant.js";

export const subscriptionMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: "Not authenticated - Missing Tenant ID" });
    }

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const subscription = tenant.subscription;

    if (!subscription) {
      return next();
    }

    if (subscription.status !== "Active") {
      return res.status(403).json({ 
        message: `Your subscription is not active (Status: ${subscription.status}). Please contact support.` 
      });
    }

    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      return res.status(403).json({ 
        message: "Your subscription has expired. Please renew to continue using the system." 
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription Middleware Error:", error);
    res.status(500).json({ message: "Server error verifying subscription" });
  }
};
