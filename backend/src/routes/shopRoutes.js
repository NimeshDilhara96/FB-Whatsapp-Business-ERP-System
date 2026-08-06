import express from "express";
import { getShopDetails } from "../controllers/shopController.js";

const router = express.Router();

// GET /api/shop/:shopSlug
router.get("/:shopSlug", getShopDetails);

export default router;
