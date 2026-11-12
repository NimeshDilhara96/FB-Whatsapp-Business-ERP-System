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
      select: false,
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
      type: String, // Store hashed refresh token here for revocation
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);