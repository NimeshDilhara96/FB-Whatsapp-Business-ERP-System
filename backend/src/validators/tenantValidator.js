import { z } from "zod";

export const updateCurrencySchema = z.object({
  currency: z.string().min(1, "Currency is required").max(10, "Currency symbol too long"),
});
