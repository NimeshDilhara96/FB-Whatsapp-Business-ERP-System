import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
    },

    name: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "General",
    },

    price: {
      type: Number,
      required: true,
    },

    costPrice: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);