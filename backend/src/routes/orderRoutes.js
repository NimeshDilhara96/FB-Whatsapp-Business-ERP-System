import express from "express";

import { validate } from "../middleware/validate.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/orderValidator.js";
import { 
  createOrder, 
  getOrders, 
  updateOrderDetails, 
  getCustomerOrders 
} from "../controllers/orderController.js";

const router = express.Router();

// Secure the routes with authMiddleware (handled globally in server.js)
router.post("/", validate(createOrderSchema), createOrder);
router.get("/", getOrders);
router.get("/customer/:customerId", getCustomerOrders);
router.patch("/:id/status", validate(updateOrderStatusSchema), updateOrderDetails);

export default router;
