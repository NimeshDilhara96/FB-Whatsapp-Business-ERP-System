import { z } from "zod";

// Schema for creating a new product
export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  stockQuantity: z.number().min(0, "Stock cannot be negative").default(0),
});

// Schema for updating a product (all fields are optional)
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  stockQuantity: z.number().min(0, "Stock cannot be negative").optional(),
});
