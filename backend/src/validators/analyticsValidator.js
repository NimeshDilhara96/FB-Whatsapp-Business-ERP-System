import { z } from "zod";

export const dashboardQuerySchema = z
  .object({
    dateFilter: z.enum(["7", "30", "all"]).default("7"),
  })
  .strict();

export const reportQuerySchema = z
  .object({
    timeframe: z
      .enum(["today", "7days", "28days", "month", "all"])
      .default("all"),
  })
  .strict();
