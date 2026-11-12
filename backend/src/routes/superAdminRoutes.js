import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.js";
import { validateParams } from "../middleware/validate.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  getPlatformStats,
  getAllTenants,
  updateTenantStatus,
  getAllUsers,
} from "../controllers/superAdminController.js";

const router = express.Router();

// All routes here are protected by authMiddleware AND superAdminMiddleware
router.use(authMiddleware, superAdminMiddleware);

router.get("/stats", getPlatformStats);
router.get("/tenants", getAllTenants);
router.put(
  "/tenants/:id/status",
  validateParams(idParamSchema),
  updateTenantStatus,
);
router.get("/users", getAllUsers);

export default router;
