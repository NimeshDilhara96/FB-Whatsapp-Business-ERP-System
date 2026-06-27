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
    subscription: {
      plan: { 
        type: String, 
        enum: ["Free", "Basic", "Pro"], 
        default: "Pro" // ටෙස්ට් කරන නිසා හැමෝටම Pro දෙන්න
      },
      status: { 
        type: String, 
        enum: ["Active", "Expired", "Suspended"], 
        default: "Active" 
      },
      expiresAt: { 
        type: Date,
        // 2030 වෙනකම් වලංගු වෙන විදිහට දාන්න (Testing වලට)
        default: () => new Date("2030-12-31") 
      }
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
