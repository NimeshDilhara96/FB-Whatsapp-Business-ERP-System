import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import connectDB from "./src/config/db.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import logger from "./src/utils/logger.js";
import productRoutes from "./src/routes/productRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import { tenantMiddleware } from "./src/middleware/tenantMiddleware.js";
import { authMiddleware } from "./src/middleware/authMiddleware.js"; // <--- Import security middleware
import { subscriptionMiddleware } from "./src/middleware/subscriptionMiddleware.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import tenantRoutes from "./src/routes/tenantRoutes.js";
import shopRoutes from "./src/routes/shopRoutes.js";
import superAdminRoutes from "./src/routes/superAdminRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

connectDB();

const app = express();

app.use(helmet());
app.use(requestLogger);
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

// FUTURE SCALABILITY NOTE (OrderFlow v1.0): 
// We are using the default in-memory store for rate limiting because the app runs on a single Render instance. 
// If OrderFlow scales to multiple instances (horizontal scaling) in the future, 
// this MUST be migrated to a shared store (like Redis or MongoDB) to prevent rate-limit bypassing.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", globalLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: Date.now(),
    memoryUsage: process.memoryUsage(),
  });
});

app.get("/", (req, res) => {
  res.send("ERP API Running...");
});

// 1. Open Routes (Anyone can login/register/view public shop)
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);

// 2. SECURITY WALL: Verifies JWT and injects `req.tenantId` for all downstream routes
app.use(authMiddleware);

// 3. SUBSCRIPTION WALL: Verifies Tenant subscription is active and not expired
app.use("/api/products", subscriptionMiddleware, productRoutes);

// Note: Uncomment these routes once you create the route files
app.use("/api/orders", subscriptionMiddleware, orderRoutes);
app.use("/api/customers", subscriptionMiddleware, customerRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/analytics", subscriptionMiddleware, analyticsRoutes);

// Sentry Error Handler (should be before custom error handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  if (req.log) {
    req.log.error({ err, requestId: req.id }, "Unhandled Exception");
  } else {
    logger.error({ err }, "Unhandled Exception outside request context");
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    requestId: req.id, // Include request ID in response
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});
