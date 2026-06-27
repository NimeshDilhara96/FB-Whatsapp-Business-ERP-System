import express from "express";
import { updateCurrency } from "../controllers/tenantController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateCurrencySchema } from "../validators/tenantValidator.js";

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

router.put("/currency", validate(updateCurrencySchema), updateCurrency);

export default router;
