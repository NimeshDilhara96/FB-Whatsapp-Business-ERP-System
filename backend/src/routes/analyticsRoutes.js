import express from "express";
import { getDashboardStats, getReportStats } from "../controllers/analyticsController.js";
import { authMiddleware as verifyToken } from "../middleware/authMiddleware.js";
import { validateQuery } from "../middleware/validate.js";
import {
  dashboardQuerySchema,
  reportQuerySchema,
} from "../validators/analyticsValidator.js";

const router = express.Router();

// Both routes protected to ensure only authenticated users can access analytics
router.get(
  "/dashboard",
  verifyToken,
  validateQuery(dashboardQuerySchema),
  getDashboardStats,
);
router.get(
  "/reports",
  verifyToken,
  validateQuery(reportQuerySchema),
  getReportStats,
);

export default router;
