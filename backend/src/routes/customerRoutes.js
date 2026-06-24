import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createCustomerSchema } from "../validators/customerValidator.js";
import {
  createCustomer,
  getCustomers,
} from "../controllers/customerController.js";

const router = express.Router();

router.post("/", authMiddleware, validate(createCustomerSchema), createCustomer);
router.get("/", authMiddleware, getCustomers);

export default router;
