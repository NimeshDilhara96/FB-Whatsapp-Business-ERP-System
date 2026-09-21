import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "", // Customer -description like(fake,trust)
    },
  },
  { timestamps: true },
);

// 🔥 validation one business same whatsapp not allow
customerSchema.index({ tenantId: 1, whatsappNumber: 1 }, { unique: true });

// Index for efficiently fetching/filtering a tenant's customers by date (Analytics)
customerSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model("Customer", customerSchema);
