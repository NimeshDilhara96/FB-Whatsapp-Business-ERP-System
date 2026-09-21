import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = "http://localhost:5000/api";

const TENANT_A = {
  companyName: "TxTest Tenant A",
  name: "Alice",
  email: "alice@txtest.com",
  password: "Password123!",
};

const TENANT_B = {
  companyName: "TxTest Tenant B",
  name: "Bob",
  email: "bob@txtest.com",
  password: "Password123!",
};

async function getAuthCookies(user) {
  let res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (!res.ok) {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
  }
  
  const cookies = res.headers.getSetCookie();
  const validCookies = cookies.map(c => c.split(';')[0]);
  return validCookies.join('; ');
}

async function createProduct(cookie, name, stock) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({ name, price: 100, costPrice: 50, stockQuantity: stock }),
  });
  const data = await res.json();
  if (!res.ok) console.error("CREATE PRODUCT FAILED:", data);
  return data.product;
}

async function getProduct(cookie, id) {
  const res = await fetch(`${API_BASE}/products`, {
    headers: { "Cookie": cookie },
  });
  const json = await res.json();
  return json.data.find(p => p._id === id);
}

async function createOrder(cookie, productId, productName, quantity) {
  return await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({
      customerName: "Test Customer",
      whatsappNumber: "0771112222",
      totalAmount: 100 * quantity,
      items: [{ productId, productName, quantity, price: 100 }]
    }),
  });
}

async function runTests() {
  console.log("Setting up test tenants...");
  const cookieA = await getAuthCookies(TENANT_A);
  const cookieB = await getAuthCookies(TENANT_B);

  console.log("\n--- TEST 1: Insufficient Stock ---");
  const p1 = await createProduct(cookieA, "Test Product 1", 1);
  const res1 = await createOrder(cookieA, p1._id, p1.name, 20);
  console.log("Order Creation Status (Expect 400):", res1.status);
  const p1_after = await getProduct(cookieA, p1._id);
  console.log("Stock After (Expect 1):", p1_after.stockQuantity);

  console.log("\n--- TEST 2: Exact Stock ---");
  const res2 = await createOrder(cookieA, p1._id, p1.name, 1);
  console.log("Order Creation Status (Expect 201):", res2.status);
  const p1_exact = await getProduct(cookieA, p1._id);
  console.log("Stock After (Expect 0):", p1_exact.stockQuantity);

  console.log("\n--- TEST 3: Concurrent Requests ---");
  const p3 = await createProduct(cookieA, "Race Product", 1);
  const reqs = [
    createOrder(cookieA, p3._id, p3.name, 1),
    createOrder(cookieA, p3._id, p3.name, 1),
    createOrder(cookieA, p3._id, p3.name, 1)
  ];
  const results = await Promise.all(reqs);
  const statuses = results.map(r => r.status);
  console.log("Statuses (Expect one 201, two 400s):", statuses);
  const p3_after = await getProduct(cookieA, p3._id);
  console.log("Final Stock (Expect 0):", p3_after.stockQuantity);

  console.log("\n--- TEST 5: Tenant Isolation ---");
  const p5 = await createProduct(cookieB, "Tenant B Secret Product", 10);
  const res5 = await createOrder(cookieA, p5._id, p5.name, 1);
  console.log("Cross-tenant Order Status (Expect 400):", res5.status);
  
  console.log("\n✅ ALL TESTS COMPLETED.");
}

runTests().catch(console.error);
