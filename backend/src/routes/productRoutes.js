import express from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authorizeRole } from "../middleware/rbacMiddleware.js";

import {
  createProduct,
  getProducts,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  price: z.number().nonnegative("Price must be a positive number"),
  costPrice: z.number().nonnegative("Cost price must be a positive number").optional(),
  stock: z.number().int().nonnegative("Stock must be a non-negative integer").optional(),
  image: z.string().optional()
});

router.post("/", validate(productSchema), createProduct);
router.get("/", getProducts);
router.delete("/:id", authorizeRole("admin"), deleteProduct);

export default router;