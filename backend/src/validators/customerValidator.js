// validators/customerValidator.js
import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  whatsappNumber: z.string().min(9, "Valid WhatsApp number is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});
