export const superAdminMiddleware = (req, res, next) => {
  // Ensure the user exists and has the strict role of 'superadmin'
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: Super Admin privileges required" });
  }
  next();
};
