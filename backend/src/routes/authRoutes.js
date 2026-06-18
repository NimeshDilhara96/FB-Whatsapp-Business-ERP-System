import express from "express";
import { registerTenant, login, refreshTokenController, logout } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many authentication attempts, please try again later." }
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = z.object({
  companyName: z.string().min(2, "Company name is too short"),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

router.post("/register", authLimiter, validate(registerSchema), registerTenant);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refreshTokenController);
router.post("/logout", logout);

export default router;