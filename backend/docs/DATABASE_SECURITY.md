# OrderFlow Database Security & Integrity Guide

This document outlines the database security, concurrency protection, and performance configurations applied to the OrderFlow ERP.

## 1. Concurrency & Integrity

### MongoDB Transactions
OrderFlow uses **Mongoose Sessions and MongoDB Transactions** for the order creation flow. This guarantees that:
- Orders and their corresponding inventory decrements either succeed entirely or fail entirely.
- No partial orders are ever created if a product runs out of stock mid-checkout.

**Requirement:** The MongoDB instance MUST be running as a Replica Set to support transactions. MongoDB Atlas inherently supports this. Local development requires either a local replica set or connecting directly to a development cluster on Atlas.

### Race Condition Protection (Atomic Updates)
When an order is placed, stock is decremented atomically using Optimistic Concurrency Control.
The update query ensures stock cannot fall below zero:
`{ stockQuantity: { $gte: requestedQuantity } }`
If multiple customers attempt to buy the last item simultaneously, only one transaction will secure the lock and succeed; the others will be explicitly aborted.

## 2. Tenant Isolation & IDOR Protection
- **Enforced at the query level:** Every data access (read, update, delete) in the application includes the `tenantId` (Workspace ID). 
- A user from Tenant A cannot modify Tenant B's data even if they guess the MongoDB `_id` (IDOR protection).
- Example: `Product.findOneAndUpdate({ _id: productId, tenantId: req.tenantId })`

## 3. Performance & Resource Limits

### Connection Pooling
Mongoose is configured to use Connection Pooling with strict limits to prevent database connection exhaustion under heavy load:
- `maxPoolSize: 50`
- `minPoolSize: 5`
- `serverSelectionTimeoutMS: 5000`
- `socketTimeoutMS: 45000`

These limits ensure the application gracefully handles spikes in traffic without crashing the MongoDB cluster.

### Indexes
To support the Analytics Dashboard and heavy filtering, compound and standard indexes have been deployed:
- **Order Collection:** `{ tenantId: 1, createdAt: -1 }` (for date-filtered reports) and `{ customerId: 1 }` (for fetching customer history).
- **Customer Collection:** `{ tenantId: 1, createdAt: -1 }`.

## 4. Security & Infrastructure (Atlas Configuration)

The following must be configured manually via the **MongoDB Atlas Console**:

### Least Privilege Database User
The credentials supplied in the `MONGO_URI` environment variable belong to an application-specific user.
- **Rule:** This user should only have `readWrite` access to the specific database.
- **Rule:** This user MUST NOT have `dbAdmin`, `userAdmin`, or `dropDatabase` privileges.

### Encryption at Rest
- MongoDB Atlas inherently encrypts all data at rest using transparent disk-level encryption. 
- Application-level field encryption is not currently implemented as ordinary PII (addresses/phone numbers) does not warrant the performance overhead. If credit cards or API keys are stored in the future, `mongoose-field-encryption` will be required.

### Backups & Retention
- Atlas continuous backups must be enabled.
- **Policy:** 7-day continuous point-in-time recovery, with daily snapshots retained for 30 days.
- **Testing:** A backup restore drill must be performed quarterly to a staging environment to verify integrity.

### Monitoring & Profiling
- Slow Query Logging is enabled in Atlas. Any query taking longer than 100ms should be investigated.
- Use `EXPLAIN ANALYZE` in the MongoDB Compass or Atlas Data Explorer when diagnosing slow endpoints.
