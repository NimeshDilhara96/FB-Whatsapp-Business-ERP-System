import { appConfig } from "../config/appConfig.js";

export const tenantMiddleware = (req, res, next) => {
  if (appConfig.isMultiTenant) {
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) {
      return res.status(400).json({
        message: "Tenant ID required",
      });
    }

    req.tenantId = tenantId;
  } else {
    req.tenantId =
      appConfig.defaultTenantId;
  }

  next();
};