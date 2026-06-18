import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin", // The creator of the workspace defaults to admin
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    refreshToken: {
      type: String, // Store refresh token here for revocation
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);