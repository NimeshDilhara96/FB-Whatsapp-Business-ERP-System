import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    // The auto-generated unique identifier used to partition all future queries
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "Rs.",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
