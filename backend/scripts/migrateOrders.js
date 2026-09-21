import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Order from "../src/models/Order.js";
import Product from "../src/models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  const orders = await Order.find({ "items.costPriceSnapshot": { $exists: false } });
  console.log(`Found ${orders.length} orders to migrate...`);

  let count = 0;
  for (const order of orders) {
    let orderProfit = 0;
    
    for (const item of order.items) {
      if (item.costPriceSnapshot === undefined) {
        const product = await Product.findOne({ name: item.productName, tenantId: order.tenantId });
        item.costPriceSnapshot = product ? product.costPrice : 0;
      }
      
      const profit = item.quantity * ((item.price || 0) - item.costPriceSnapshot);
      orderProfit += profit;
    }
    
    order.totalProfit = orderProfit; // Backfill root field if we want it
    await order.save();
    count++;
    if (count % 500 === 0) console.log(`Migrated ${count}`);
  }

  console.log(`Migration Complete: ${count} updated.`);
  process.exit(0);
}

migrate().catch(console.error);
