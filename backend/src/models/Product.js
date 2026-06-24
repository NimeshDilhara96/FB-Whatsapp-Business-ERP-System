import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Security: Links the product to the specific business owner
    tenantId: {
      type: String, // 👈 මෙන්න මේක තමයි අපි වෙනස් කළේ (ObjectId වෙනුවට String දුන්නා)
      required: true,
      // 'ref: "User"' කියන එක මෙතනින් අයින් කළා
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price cannot be negative
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0, // Default stock is zero
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
