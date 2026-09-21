import express from "express";
import { getDashboardStats, getReportStats } from "../controllers/analyticsController.js";
import { authMiddleware as verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Both routes protected to ensure only authenticated users can access analytics
router.get("/dashboard", verifyToken, getDashboardStats);
router.get("/reports", verifyToken, getReportStats);

export default router;
