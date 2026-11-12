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

    if (subscription.status === "Suspended") {
      return res.status(403).json({
        message:
          "Your subscription is suspended. Please contact support.",
      });
    }

    const isExpired =
      subscription.status === "Expired" ||
      (subscription.expiresAt &&
        new Date(subscription.expiresAt) < new Date());

    if (isExpired) {
      // Allow Read-Only access (GET/HEAD/OPTIONS) for expired tenants
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        req.subscription = subscription;
        return next();
      }
      return res.status(403).json({
        message:
          "Your subscription has expired. Account is in Read-Only mode. Please renew to continue making changes.",
      });
    }

    if (subscription.status !== "Active") {
      return res.status(403).json({
        message: `Your subscription is not active (Status: ${subscription.status}). Please contact support.`,
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Subscription Middleware Error");
    res.status(500).json({ message: "Server error verifying subscription" });
  }
};
