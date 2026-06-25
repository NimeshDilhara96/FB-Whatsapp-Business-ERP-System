// src/models/Order.js
import mongoose from "mongoose";

// First, we create a small schema for the items inside the order
const orderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Now, we create the main Order schema
const orderSchema = new mongoose.Schema(
  {
    // 1. Security: Links order to the specific business (Tenant)
    tenantId: {
      type: String, // 👈 මෙතන ObjectId වෙනුවට String කළා. ref: "User" අයින් කළා.
      required: true,
    },

    // 2. The Magic Link: Connects this order to a specific Customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId, // 👈 මේක වෙනස් කළේ නැහැ! Relationship එක ආරක්ෂිතයි.
      required: true,
      ref: "Customer",
    },

    // 3. Order Details
    items: [orderItemSchema], // Array of items they bought

    totalAmount: {
      type: Number,
      required: true,
    },

    // 4. Order Tracking
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Completed", "Cancelled", "Returned"],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    trackingNumber: {
      type: String,
      default: "", // You can add the courier tracking number here later
    },

    source: {
      type: String,
      enum: ["WhatsApp", "Facebook", "Website", "Other"],
      default: "WhatsApp",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Direct Bank Transfer", "Online Payment", "Other"],
      default: "Cash on Delivery",
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt
);

export default mongoose.model("Order", orderSchema);
