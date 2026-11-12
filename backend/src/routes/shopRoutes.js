import express from "express";
import { getShopDetails } from "../controllers/shopController.js";
import { validateParams } from "../middleware/validate.js";
import { shopSlugParamSchema } from "../validators/commonValidator.js";

const router = express.Router();

// GET /api/shop/:shopSlug
router.get("/:shopSlug", validateParams(shopSlugParamSchema), getShopDetails);

export default router;
