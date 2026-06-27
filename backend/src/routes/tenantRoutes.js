import express from "express";
import { updateCurrency } from "../controllers/tenantController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

router.put("/currency", updateCurrency);

export default router;
