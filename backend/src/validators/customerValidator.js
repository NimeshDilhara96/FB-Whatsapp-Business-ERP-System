// validators/customerValidator.js
import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  whatsappNumber: z.string().regex(/^[0-9]{10}$/, "Valid 10-digit WhatsApp number is required (e.g. 0771234567)"),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  whatsappNumber: z.string().regex(/^[0-9]{10}$/, "Valid 10-digit WhatsApp number is required (e.g. 0771234567)").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional()
});
