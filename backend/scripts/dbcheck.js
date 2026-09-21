import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
// redact password
const redactedUri = uri.replace(/:([^:@]+)@/, ':****@');

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const tenants = await db.collection('tenants').countDocuments();
  const orders = await db.collection('orders').countDocuments();
  
  const missingOrders = await db.collection('orders').countDocuments({
      $or: [
        { "items.costPriceSnapshot": { $exists: false } },
        { "items.costPriceSnapshot": { $type: 10 } }
      ]
  });

  const missingItems = await db.collection('orders').aggregate([
    { $match: { 
        $or: [
          { "items.costPriceSnapshot": { $exists: false } },
          { "items.costPriceSnapshot": { $type: 10 } }
        ] 
    } },
    { $unwind: "$items" },
    { $match: { 
        $or: [
          { "items.costPriceSnapshot": { $exists: false } },
          { "items.costPriceSnapshot": { $type: 10 } }
        ] 
    } },
    { $count: "count" }
  ]).toArray();
  
  console.log("Environment: .env");
  console.log("Database name:", db.databaseName);
  console.log("MongoDB host:", redactedUri);
  console.log("Tenant count:", tenants);
  console.log("Total order count:", orders);
  console.log("Orders missing/null costPriceSnapshot:", missingOrders);
  console.log("Items missing/null costPriceSnapshot:", missingItems[0] ? missingItems[0].count : 0);
  
  process.exit(0);
}

check();
