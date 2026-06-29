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
import { subscriptionMiddleware } from "./src/middleware/subscriptionMiddleware.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import tenantRoutes from "./src/routes/tenantRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://orderflow.mommentx.space",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" })); // Limit body payload to prevent DoS
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 1. Data Sanitization against NoSQL query injection
import mongoSanitize from "express-mongo-sanitize";

app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: "_" });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: "_" });
  next();
});

// 2. Global Rate Limiting
import rateLimit from "express-rate-limit";

// Trust the reverse proxy (Render Load Balancer) so the rate limiter uses the actual client IP
app.set("trust proxy", 1);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", globalLimiter);

app.get("/", (req, res) => {
  res.send("ERP API Running...");
});

// 1. Open Routes (Anyone can login/register)
app.use("/api/auth", authRoutes);

// 2. SECURITY WALL: Verifies JWT and injects `req.tenantId` for all downstream routes
app.use(authMiddleware);

// 3. SUBSCRIPTION WALL: Verifies Tenant subscription is active and not expired
app.use("/api/products", subscriptionMiddleware, productRoutes);

// Note: Uncomment these routes once you create the route files
app.use("/api/orders", subscriptionMiddleware, orderRoutes);
app.use("/api/customers", subscriptionMiddleware, customerRoutes);
app.use("/api/tenant", tenantRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
