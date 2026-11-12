import { z } from "zod";

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const idParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  })
  .strict();

export const customerIdParamSchema = z
  .object({
    customerId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid customer ID format"),
  })
  .strict();

export const shopSlugParamSchema = z
  .object({
    shopSlug: z
      .string()
      .min(1, "Shop slug is required")
      .max(100, "Shop slug is too long")
      .regex(/^[a-z0-9-]+$/, "Invalid shop slug format"),
  })
  .strict();
