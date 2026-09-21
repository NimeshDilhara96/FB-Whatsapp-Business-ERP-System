# 📦 Order Flow ERP System

![Order Flow ERP](https://img.shields.io/badge/Status-Production--Ready-success?style=flat-square)
![Version](https://img.shields.io/badge/Version-v1.4.0-blue?style=flat-square)
![Security](https://img.shields.io/badge/Security-Enterprise--Grade-green?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-orange?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-v18%2B-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/React-v19-61dafb?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square)

**Order Flow ERP** is a modern, mobile-first, multi-tenant Enterprise Resource Planning (ERP) platform engineered specifically for e-commerce, Facebook, and WhatsApp retail businesses. It provides high-speed inventory tracking, transactional order fulfillment, customer relationship management, and real-time financial profitability analytics.

---

## ✨ Key Features & Architecture

### 🏢 True Multi-Tenancy & Data Isolation
- **Strict Tenant Scoping:** Every business workspace (`tenantId`) is cryptographically and logically isolated. Cross-tenant data access is blocked at both controller and database query layers.
- **Compound Index Optimization:** Collections leverage optimized compound indexes (`tenantId + createdAt`, `tenantId + status`, `tenantId + sku`, `tenantId + phone`) for sub-millisecond query execution at scale.
- **Custom Workspace Configurations:** Per-tenant preferences (e.g., currency symbols Rs., $, €, £, business branding) dynamically format all UI dashboards and reporting tables.

### 📊 High-Performance Profit & Analytics Engine
- **Historical Cost Snapshots:** Every order item stores an immutable `costPriceSnapshot` at checkout. Future product price updates never alter historical accounting data.
- **Single-Pass Aggregation:** Aggregation pipelines calculate Total Revenue, Net Profit, Profit Margins, Total Costs, Average Order Value (AOV), and Revenue by Date without runtime `$lookup` bottlenecks.
- **Custom Date Range Reports:** Real-time financial reports filterable by Today, Last 7 Days, Last 30 Days, or custom date ranges.

### 🔄 ACID Transactional Order Engine
- **Atomic Stock Deductions:** Orders placed via multi-document MongoDB transactions prevent race conditions and overselling during peak traffic.
- **Strict State Progression:** Enforces a linear state machine flow: `Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` (or `Cancelled`).
- **Server-Side Security Invariant:** Historical cost snapshots are strictly resolved server-side from authoritative product models; client payload overrides are systematically discarded.

### 👤 Customer Relationship & Auto-Discovery
- **Instant Phone Lookup:** Real-time customer identification auto-fills delivery details, shipping addresses, and purchase history.
- **Customer Lifetime Analytics:** Automatic tracking of total orders placed and lifetime value (LTV) per customer profile.

### 💳 Tier-Based Subscription Enforcement
- **Automated Billing Tiers:** Built-in tier management (Free, Basic, Pro) with quota limits.
- **Safe Read-Only Mode:** Backend `subscriptionMiddleware` automatically restricts expired accounts to Read-Only mode—allowing business owners to view data while blocking write actions (`POST`, `PUT`, `PATCH`, `DELETE`) until renewed.

### 🔒 Enterprise-Grade Security
- **Strict Cookie-Based Auth:** 100% token storage in `HttpOnly`, `SameSite`, and `Secure` cookies (Zero tokens in `localStorage`, eliminating XSS vulnerabilities).
- **Silent Refresh Flow:** Dual-token JWT architecture (short-lived access token + rotating refresh token) paired with a `/api/auth/me` source of truth.
- **Defense in Depth:** Helmet HTTP security headers, CORS origin allowlisting, NoSQL injection sanitization (`express-mongo-sanitize`), IP rate-limiting, and runtime schema validation with **Zod**.

### 📈 Observability & Uptime Probes
- **Structured JSON Logging:** Pino and Morgan logging with request duration tracking.
- **Health Check Probe:** Lightweight `/api/health` endpoint for cloud orchestrators (Render, AWS, DigitalOcean, Kubernetes) without leaking system internals.
- **Centralized Error Monitoring:** Sentry integration for real-time tracking of uncaught runtime exceptions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Zustand, Axios, Recharts, React Router v7, React Icons, React Toastify |
| **Backend** | Node.js, Express.js 5, Mongoose 9, MongoDB Atlas, Zod, Bcrypt.js, JsonWebToken |
| **Security & Utilities** | Helmet, Express Rate Limit, Express Mongo Sanitize, Cookie-Parser, Multer, Cloudinary, Pino, Morgan |

---

## 📁 Project Structure

```text
FB-Whatsapp-Business-ERP-System/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection, CORS, Cloudinary, logger configs
│   │   ├── controllers/        # Business logic (Auth, Orders, Products, Customers, Analytics)
│   │   ├── middlewares/        # Auth, Tenant isolation, Subscription, Error handler, Rate limit
│   │   ├── models/             # Mongoose schemas with compound indexes
│   │   ├── routes/             # Express API route declarations
│   │   └── validators/         # Zod schemas for input validation
│   ├── package.json
│   └── server.js               # Express application entrypoint
│
└── frontend/
    ├── src/
    │   ├── api/                # Axios instance with credentials & interceptors
    │   ├── components/         # Reusable UI components (Modals, Navbars, Tables, Cards)
    │   ├── context/ / store/   # Zustand global stores (Auth, Cart, UI State)
    │   ├── pages/              # Dashboard, Orders, Products, Customers, Analytics, Settings
    │   ├── App.jsx             # Route guards & layout hierarchy
    │   └── main.jsx            # Application root
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or later
- **MongoDB**: MongoDB Atlas cluster or self-hosted instance

---

### 1. Installation

Clone the repository and install dependencies for both services:

```bash
# Clone the repository
git clone https://github.com/NimeshDilhara96/FB-Whatsapp-Business-ERP-System.git
cd FB-Whatsapp-Business-ERP-System

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/SERP_db?retryWrites=true&w=majority

# JWT Secrets (Use strong 256-bit random keys)
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

### 3. Running the Application

```bash
# Start Backend
cd backend
npm start

# Build & Run Frontend (Production)
cd frontend
npm run build
npm run preview
```

---

## 🔒 Security Summary

1. **HttpOnly Cookie Tokens:** Eliminates token theft risks via XSS attacks.
2. **Strict Multi-Tenant Scoping:** All database read/write operations require an explicit tenant context.
3. **NoSQL Injection Sanitization:** Proactively filters user input to block operator injection attacks.
4. **Rate Limiting:** Protects authentication endpoints against credential stuffing and brute-force attempts.
5. **ACID Transactions:** Ensures absolute inventory consistency and atomic rollbacks.

---

## 📄 License

This project is licensed under the ISC License. See the [Licence](file:///e:/FB-Whatsapp-Business-ERP-System/Licence) file for details.
