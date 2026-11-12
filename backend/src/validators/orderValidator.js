import { z } from "zod";

// Schema for a single item
const orderItemSchema = z
  .object({
    productId: z.string().optional(),
    productName: z.string().min(1, "Product name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price cannot be negative"),
  })
  .strict();

// UPATED: Schema for creating a new order (Now accepts Customer Details)
export const createOrderSchema = z
  .object({
    customerName: z.string().min(2, "Customer name is required"),
    whatsappNumber: z.string().regex(/^[0-9]{10}$/, "Valid 10-digit WhatsApp number is required (e.g. 0771234567)"),
    address: z.string().optional(),
    city: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    totalAmount: z.number().min(0, "Total amount cannot be negative"),
    source: z.enum(["WhatsApp", "Facebook", "Website", "Other"]).optional(),
    paymentMethod: z.enum(["Cash on Delivery", "Direct Bank Transfer", "Online Payment", "Other"]).optional(),
    externalEventId: z.string().optional(),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    orderStatus: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Completed", "Cancelled", "Returned"]).optional(),
    paymentStatus: z.enum(["Pending", "Paid"]).optional(),
  })
  .strict()
  .refine(data => data.orderStatus !== undefined || data.paymentStatus !== undefined, {
    message: "At least one of orderStatus or paymentStatus must be provided to update"
  });
