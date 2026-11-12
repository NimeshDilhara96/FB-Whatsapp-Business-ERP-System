import express from "express";

import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.js";
// new updateCustomerSchema Import
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customerValidator.js";
import {
  paginationQuerySchema,
  idParamSchema,
} from "../validators/commonValidator.js";
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
  validate(createCustomerSchema),
  createCustomer,
);
router.get("/", validateQuery(paginationQuerySchema), getCustomers);

// අලුත් Routes දෙක: (/:id කියන්නේ URL එකෙන් ID එක ගන්නවා කියන එකයි)
router.put(
  "/:id",
  validateParams(idParamSchema),
  validate(updateCustomerSchema),
  updateCustomer,
);
router.delete("/:id", validateParams(idParamSchema), deleteCustomer);

export default router;
