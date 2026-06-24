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
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

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
