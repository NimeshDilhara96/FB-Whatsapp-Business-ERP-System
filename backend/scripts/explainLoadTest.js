import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function runExplain() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = process.env.TEST_USER_EMAIL || "loadtest@erp.com";
  const user = await User.findOne({ email });
  if (!user) {
    console.log("Loadtest user not found");
    process.exit(1);
  }
  const tid = user.tenantId;

  console.log(`Running EXPLAIN on analytics aggregation for loadtest tenant: ${tid}...`);

  const explainPlan = await Order.collection.aggregate([
    { $match: { tenantId: tid } },
    { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
    { $addFields: {
        itemProfit: {
          $multiply: [
            { $ifNull: ["$items.quantity", 0] },
            { $subtract: [
                { $ifNull: ["$items.price", 0] },
                "$items.costPriceSnapshot"
            ]}
          ]
        },
        itemCost: {
          $multiply: [
            { $ifNull: ["$items.quantity", 0] },
            "$items.costPriceSnapshot"
          ]
        }
    }},
    { $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        totalOrderProfit: { $sum: "$itemProfit" },
        totalOrderCost: { $sum: "$itemCost" },
        items: { $push: "$items" }
    }},
    { $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { totalProfit: "$totalOrderProfit", totalCost: "$totalOrderCost", items: "$items" }] } } }
  ]).explain("executionStats");

  console.log(JSON.stringify(explainPlan, null, 2));
  
  process.exit(0);
}

runExplain().catch(console.error);
