import express from "express";

import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/orderValidator.js";
import {
  paginationQuerySchema,
  idParamSchema,
  customerIdParamSchema,
} from "../validators/commonValidator.js";
import { 
  createOrder, 
  getOrders, 
  updateOrderDetails, 
  getCustomerOrders 
} from "../controllers/orderController.js";

const router = express.Router();

// Secure the routes with authMiddleware (handled globally in server.js)
router.post("/", validate(createOrderSchema), createOrder);
router.get("/", validateQuery(paginationQuerySchema), getOrders);
router.get(
  "/customer/:customerId",
  validateParams(customerIdParamSchema),
  getCustomerOrders,
);
router.patch(
  "/:id/status",
  validateParams(idParamSchema),
  validate(updateOrderStatusSchema),
  updateOrderDetails,
);

export default router;
