import express from "express";
import { updateCurrency } from "../controllers/tenantController.js";

import { validate } from "../middleware/validate.js";
import { updateCurrencySchema } from "../validators/tenantValidator.js";

const router = express.Router();

// Auth middleware is handled globally in server.js

router.put("/currency", validate(updateCurrencySchema), updateCurrency);

export default router;
