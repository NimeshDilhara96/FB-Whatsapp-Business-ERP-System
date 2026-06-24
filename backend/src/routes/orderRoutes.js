import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema } from "../validators/orderValidator.js";
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus, 
  getCustomerOrders 
} from "../controllers/orderController.js";

const router = express.Router();

// Secure the routes with authMiddleware
router.post("/", authMiddleware, validate(createOrderSchema), createOrder);
router.get("/", authMiddleware, getOrders);
router.get("/customer/:customerId", authMiddleware, getCustomerOrders);
router.patch("/:id/status", authMiddleware, updateOrderStatus);

export default router;
