export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by authMiddleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
