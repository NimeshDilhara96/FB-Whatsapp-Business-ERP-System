import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Customer from "../src/models/Customer.js";
import Order from "../src/models/Order.js";

dotenv.config();

const LOAD_TEST_EMAIL = process.env.TEST_USER_EMAIL || "loadtest@erp.com";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
}

async function getLoadTestTenantId() {
  const user = await User.findOne({ email: LOAD_TEST_EMAIL });
  if (!user) {
    throw new Error(`User ${LOAD_TEST_EMAIL} not found. Please run 'node loadtest.js' once first to register the account.`);
  }
  return user.tenantId;
}

async function cleanData(tenantId) {
  console.log(`Cleaning data for tenant: ${tenantId}...`);
  
  const pRes = await Product.deleteMany({ tenantId });
  console.log(`Deleted ${pRes.deletedCount} products.`);
  
  const cRes = await Customer.deleteMany({ tenantId });
  console.log(`Deleted ${cRes.deletedCount} customers.`);
  
  const oRes = await Order.deleteMany({ tenantId });
  console.log(`Deleted ${oRes.deletedCount} orders.`);
  
  console.log("Cleanup complete!");
}

async function generateData(tenantId) {
  console.log(`Generating data for tenant: ${tenantId}... This might take a minute.`);

  // 1. Generate 1000 Products
  const productsToInsert = [];
  for (let i = 1; i <= 1000; i++) {
    productsToInsert.push({
      name: `Test Product ${i}`,
      sku: `SKU-${i}`,
      price: Math.floor(Math.random() * 5000) + 100,
      stockQuantity: 10000, // High stock so orders don't fail
      tenantId: tenantId
    });
  }
  const savedProducts = await Product.insertMany(productsToInsert);
  console.log(`✅ Created 1000 Products.`);

  // 2. Generate 1000 Customers
  const customersToInsert = [];
  for (let i = 1; i <= 1000; i++) {
    customersToInsert.push({
      name: `Test Customer ${i}`,
      whatsappNumber: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `Test Address ${i}`,
      city: "Colombo",
      tenantId: tenantId
    });
  }
  const savedCustomers = await Customer.insertMany(customersToInsert);
  console.log(`✅ Created 1000 Customers.`);

  // 3. Generate 5000 Orders
  const ordersToInsert = [];
  for (let i = 1; i <= 5000; i++) {
    // Pick a random customer and product
    const randomCustomer = savedCustomers[Math.floor(Math.random() * savedCustomers.length)];
    const randomProduct = savedProducts[Math.floor(Math.random() * savedProducts.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;

    ordersToInsert.push({
      tenantId: tenantId,
      customerId: randomCustomer._id,
      items: [{
        productName: randomProduct.name,
        quantity: quantity,
        price: randomProduct.price
      }],
      totalAmount: randomProduct.price * quantity,
      source: "WhatsApp",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      orderStatus: "Pending"
    });
  }
  
  // Insert in batches of 1000 to prevent memory issues
  for (let i = 0; i < ordersToInsert.length; i += 1000) {
    const batch = ordersToInsert.slice(i, i + 1000);
    await Order.insertMany(batch);
  }
  console.log(`✅ Created 5000 Orders.`);
  
  console.log("Generation complete! You can now run the loadtest.");
}

async function main() {
  const action = process.argv[2]; // 'generate' or 'clean'

  if (!["generate", "clean"].includes(action)) {
    console.error("Usage: node seed.js [generate | clean]");
    process.exit(1);
  }

  await connectDB();

  try {
    const tenantId = await getLoadTestTenantId();

    if (action === "clean") {
      await cleanData(tenantId);
    } else if (action === "generate") {
      // It's safe to clean before generating so we don't pile up duplicates
      await cleanData(tenantId);
      await generateData(tenantId);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

main();
