# 📦 Order Flow ERP System

![Order Flow ERP](https://img.shields.io/badge/Status-Active-success) ![Version](https://img.shields.io/badge/Version-v1.3.0-blue)

**Order Flow ERP** is a modern, mobile-first, multi-tenant Enterprise Resource Planning (ERP) system designed specifically for independent businesses (like Facebook and WhatsApp vendors) to seamlessly manage their products, customers, and order workflows.

---

## ✨ Key Features

### 🏢 True Multi-Tenancy

- **Data Isolation:** Every registered business gets a 100% secure and isolated workspace (`tenantId`). A user from one workspace can never access data from another.
- **Workspace Settings:** Dynamic, globally applied tenant settings like custom Currency (Rs., $, €, £) applied automatically across all dashboards and reports.

### 💳 Subscription Management & Billing Tiers

- **Automated Tiers:** Built-in support for Free, Basic, and Pro tiers.
- **Read-Only Mode:** Robust backend enforcement (`subscriptionMiddleware`). If a workspace subscription expires, the backend automatically drops into a secure Read-Only mode—allowing users to view their data but blocking any `POST`, `PUT`, `PATCH`, or `DELETE` requests until they renew.

### 🔄 Smart Order Engine

- **State Machine Logic:** Strict, linear order progression (`Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`).
- **Real-time Updates:** Instant dashboard reflection of order statuses and revenue analytics.

### 🔒 Enterprise-Grade Security

- **Authentication:** Highly secure JWT flow using strict **HttpOnly, Secure Cookies** for *both* short-lived Access Tokens and long-lived Refresh Tokens. Zero tokens are stored in `localStorage`, making the application completely immune to XSS attacks.
- **Single Source of Truth:** Utilizes a `/api/auth/me` endpoint to fetch real-time user roles and subscription state dynamically on page load, completely preventing UI spoofing or manual client-side data tampering.
- **Validation:** Strict runtime data validation on all core endpoints using **Zod**.
- **Protection & Monitoring:** Express Helmet for HTTP headers, strict CORS policies configured for production (Vercel/Render), NoSQL Injection sanitization (`express-mongo-sanitize`), centralized global error handling, and `morgan` for robust production request logging.

### 📱 Premium Aesthetics

- **Mobile-First Dashboard:** A fully responsive, modern glassmorphic and high-contrast design optimized for mobile devices and desktops alike.
- **Zustand State Management:** Lightning-fast UI updates with persistent client-side caching seamlessly integrated with secure cookie-based auth.

---

## 🛠️ Technology Stack

**Frontend:**

- React 18 + Vite
- TailwindCSS (Styling)
- Zustand (State Management)
- Axios (Configured with `withCredentials: true` for secure cookie transmission)
- React Router v6

**Backend:**

- Node.js + Express.js
- MongoDB + Mongoose
- JWT (JSON Web Tokens) & Bcrypt.js
- Zod (Schema Validation)
- Morgan (HTTP Request Logging)

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
