import autocannon from "autocannon";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = "http://localhost:5000/api";
const LOAD_TEST_USER = {
  companyName: "LoadTest ERP",
  name: "Load Tester",
  email: process.env.TEST_USER_EMAIL || "loadtest@erp.com",
  password: process.env.TEST_USER_PASSWORD || "LoadTest123!",
};

async function getAuthCookie() {
  console.log("Attempting to login with dedicated load-test account...");
  
  let res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: LOAD_TEST_USER.email, password: LOAD_TEST_USER.password }),
  });

  // If login fails, try to register the dedicated account
  if (!res.ok) {
    console.log("Account not found. Registering dedicated load-test account...");
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(LOAD_TEST_USER),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to register load-test account: ${JSON.stringify(err)}`);
    }
    console.log("Registration successful.");
  } else {
    console.log("Login successful.");
  }

  // Extract the cookies from the response headers
  const setCookieHeader = res.headers.get("set-cookie");
  if (!setCookieHeader) {
    throw new Error("No set-cookie header found in the response.");
  }

  // Extract the accessToken specifically
  const accessTokenMatch = setCookieHeader.match(/accessToken=([^;]+)/);
  if (!accessTokenMatch) {
    throw new Error("accessToken cookie not found in set-cookie header.");
  }

  return `accessToken=${accessTokenMatch[1]}`;
}

async function runTests() {
  try {
    const cookie = await getAuthCookie();
    console.log("Authentication successful! Got cookies.\n");

    const endpointsToTest = [
      { method: 'GET', path: '/products', title: 'Fetch Products' },
      { method: 'GET', path: '/orders', title: 'Fetch Orders' },
      { method: 'GET', path: '/customers', title: 'Fetch Customers' },
    ];

    for (const endpoint of endpointsToTest) {
      console.log(`=========================================`);
      console.log(`Starting test: ${endpoint.title} (${endpoint.method} ${API_BASE}${endpoint.path})`);
      
      const instance = autocannon({
        url: `${API_BASE}${endpoint.path}`,
        method: endpoint.method,
        connections: 100,
        pipelining: 1,
        duration: 10,
        headers: {
          "Cookie": cookie
        }
      });

      // Show progress bar
      autocannon.track(instance, { renderProgressBar: true });

      // Wait for the current test to finish before starting the next one
      await new Promise((resolve) => {
        instance.on('done', (result) => {
          console.log(`\nTest Finished: ${endpoint.title}`);
          console.log(`- Req/Sec (Avg): ${result.requests.average}`);
          console.log(`- Latency (Avg): ${result.latency.average} ms`);
          console.log(`- 2xx Responses: ${result['2xx']}`);
          console.log(`- Non-2xx Responses: ${result.non2xx}\n`);
          resolve();
        });
      });
    }

    console.log("All load tests completed successfully!");

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

runTests();
