import express from "express";

import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// 1. Create a product
router.post("/", validate(createProductSchema), createProduct);

// 2. Get all products
router.get("/", getProducts);

// 3. Update a product
router.put(
  "/:id",
  validate(updateProductSchema),
  updateProduct,
);

// 4. Delete a product
router.delete("/:id", deleteProduct);

export default router;
