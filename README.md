# 📦 Order Flow ERP System

![Order Flow ERP](https://img.shields.io/badge/Status-Active-success) ![Version](https://img.shields.io/badge/Version-v1.2.0-blue) ![License](https://img.shields.io/badge/License-MIT-purple)

**Order Flow ERP** is a modern, mobile-first, multi-tenant Enterprise Resource Planning (ERP) system designed specifically for independent businesses (like Facebook and WhatsApp vendors) to seamlessly manage their products, customers, and order workflows.

---

## ✨ Key Features

### 🏢 True Multi-Tenancy
* **Data Isolation:** Every registered business gets a 100% secure and isolated workspace (`tenantId`). A user from one workspace can never access data from another.
* **Workspace Settings:** Dynamic, globally applied tenant settings like custom Currency (Rs., $, €, £) applied automatically across all dashboards and reports.

### 💳 Subscription Management & Billing Tiers
* **Automated Tiers:** Built-in support for Free, Basic, and Pro tiers.
* **Read-Only Mode:** Robust backend enforcement (`subscriptionMiddleware`). If a workspace subscription expires, the backend automatically drops into a secure Read-Only mode—allowing users to view their data but blocking any `POST`, `PUT`, `PATCH`, or `DELETE` requests until they renew.

### 🔄 Smart Order Engine
* **State Machine Logic:** Strict, linear order progression (`Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`).
* **Real-time Updates:** Instant dashboard reflection of order statuses and revenue analytics.

### 🔒 Enterprise-Grade Security
* **Authentication:** Highly secure JWT flow using **HttpOnly Cookies** for long-lived Refresh Tokens (immune to XSS) and in-memory/localStorage short-lived Access Tokens.
* **Validation:** Strict runtime data validation on all core endpoints using **Zod**.
* **Protection:** Express Helmet for HTTP headers, CORS policies configured strictly for production (Vercel/Render), and NoSQL Injection sanitization.

### 📱 Premium Aesthetics
* **Mobile-First Dashboard:** A fully responsive, modern glassmorphic and high-contrast design optimized for mobile devices and desktops alike.
* **Zustand State Management:** Lightning-fast UI updates with persistent client-side caching.

---

## 🛠️ Technology Stack

**Frontend:**
* React 18 + Vite
* TailwindCSS (Styling)
* Zustand (State Management with `persist` middleware)
* Axios (API Interceptors for automated token refresh)
* React Router v6

**Backend:**
* Node.js + Express.js
* MongoDB + Mongoose
* JWT (JSON Web Tokens) & Bcrypt.js
* Zod (Schema Validation)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* MongoDB (Local or Atlas URI)

### 1. Clone & Install
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Create `.env` files in both the `backend` and `frontend` directories using the provided templates:
* **Backend:** Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB URI and Secret Keys.
* **Frontend:** Copy `frontend/.env.example` to `frontend/.env`.

### 3. Run the System
Open two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Starts server on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Starts Vite on http://localhost:5173
```

---

## 🌐 Production Deployment

This system is pre-configured for modern cloud hosting:
* **Frontend:** Designed for **Vercel** (`vercel.json` included for SPA routing).
* **Backend:** Designed for **Render** or **Heroku**. 
* *Note:* When deploying, ensure you configure Cross-Domain CORS properly by setting your `VITE_API_URL` on Vercel and your `FRONTEND_URL` on Render.

---

## 📖 Changelog (v1.2.0)
* Added Workspace Subscription Plan visibility.
* Implemented dynamic Tenant Currency support globally.
* Enhanced system security with strict CORS and cross-domain Cookie policies.
* Added Zod validation to all core endpoints.

---
*Built with modern web standards by MommentX.*
