import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
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
router.post("/", authMiddleware, validate(createProductSchema), createProduct);

// 2. Get all products
router.get("/", authMiddleware, getProducts);

// 3. Update a product
router.put(
  "/:id",
  authMiddleware,
  validate(updateProductSchema),
  updateProduct,
);

// 4. Delete a product
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
