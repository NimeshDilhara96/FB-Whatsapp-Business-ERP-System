import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import connectDB from "./src/config/db.js";
import productRoutes from "./src/routes/productRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import { tenantMiddleware } from "./src/middleware/tenantMiddleware.js";
import { authMiddleware } from "./src/middleware/authMiddleware.js"; // <--- Import security middleware
import customerRoutes from "./src/routes/customerRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" })); // Limit body payload to prevent DoS
app.use(cookieParser());

// 1. Data Sanitization against NoSQL query injection
import mongoSanitize from "express-mongo-sanitize";
app.use(mongoSanitize());

// 2. Global Rate Limiting
import rateLimit from "express-rate-limit";
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use("/api", globalLimiter);

app.get("/", (req, res) => {
  res.send("ERP API Running...");
});

// 1. Open Routes (Anyone can login/register)
app.use("/api/auth", authRoutes);

// 2. SECURITY WALL: Verifies JWT and injects `req.tenantId` for all downstream routes
app.use(authMiddleware);

// 4. Protected Routes
app.use("/api/products", productRoutes);

// Note: Uncomment these routes once you create the route files
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
