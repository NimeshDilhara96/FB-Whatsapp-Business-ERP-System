import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
// new updateCustomerSchema Import
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customerValidator.js";
// new controller function
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  validate(createCustomerSchema),
  createCustomer,
);
router.get("/", authMiddleware, getCustomers);

// අලුත් Routes දෙක: (/:id කියන්නේ URL එකෙන් ID එක ගන්නවා කියන එකයි)
router.put(
  "/:id",
  authMiddleware,
  validate(updateCustomerSchema),
  updateCustomer,
);
router.delete("/:id", authMiddleware, deleteCustomer);

export default router;
