import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const EMAIL = process.env.TEST_USER_EMAIL || 'loadtest@erp.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'LoadTest123!';

async function runTests() {
  try {
    console.log('1. Logging in as LoadTest tenant...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const cookieHeader = loginRes.headers.get('set-cookie');
    const tokenMatch = cookieHeader?.match(/accessToken=([^;]+)/);
    if (!tokenMatch) throw new Error("No access token found in cookies");
    const token = tokenMatch[1];
    
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('2. Fetching Analytics Dashboard (DateFilter: 7)...');
    const startDash = performance.now();
    const dashRes = await fetch(`${API_URL}/analytics/dashboard?dateFilter=7`, { headers });
    const dashData = await dashRes.json();
    const endDash = performance.now();
    console.log(`=> Dashboard Request Time: ${(endDash - startDash).toFixed(2)} ms`);
    console.log(`=> Dashboard Internal Timings: DB: ${dashData._timings?.dbTime.toFixed(2)}ms, JS: ${dashData._timings?.jsTime.toFixed(2)}ms, Overall: ${dashData._timings?.overallTime.toFixed(2)}ms`);
    if (dashData.message) console.error("Dashboard API Error:", dashData);

    console.log('3. Fetching Analytics Reports (Timeframe: all)...');
    const startReport = performance.now();
    const reportRes = await fetch(`${API_URL}/analytics/reports?timeframe=all`, { headers });
    const reportData = await reportRes.json();
    const endReport = performance.now();
    console.log(`=> Reports Request Time: ${(endReport - startReport).toFixed(2)} ms`);
    console.log(`=> Reports Internal Timings: DB: ${reportData._timings?.dbTime.toFixed(2)}ms, JS: ${reportData._timings?.jsTime.toFixed(2)}ms, Overall: ${reportData._timings?.overallTime.toFixed(2)}ms`);

    console.log('4. Fetching raw data to verify manual calculations...');
    const ordersRes = await fetch(`${API_URL}/orders?limit=10000`, { headers });
    const ordersData = await ordersRes.json();
    const orders = ordersData.data;
    
    const productsRes = await fetch(`${API_URL}/products?limit=1000`, { headers });
    const productsData = await productsRes.json();
    const products = productsData.data;

    let manualTotalRevenue = 0;
    let manualTotalProfit = 0;

    orders.forEach(o => {
      if (o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Returned') {
        manualTotalRevenue += o.totalAmount;
        
        let orderCost = 0;
        o.items.forEach(item => {
          if (item.costPriceSnapshot !== undefined && item.costPriceSnapshot !== null) {
            orderCost += item.costPriceSnapshot * item.quantity;
          } else {
            const p = products.find(p => p.name === item.productName);
            orderCost += (p ? p.costPrice : 0) * item.quantity;
          }
        });
        manualTotalProfit += (o.totalAmount - orderCost);
      }
    });

    console.log(`\n--- Verification Results ---`);
    console.log(`API Revenue: ${reportData.totalRevenue} | Manual Revenue: ${manualTotalRevenue}`);
    console.log(`API Profit: ${reportData.totalFilteredProfit} | Manual Profit: ${manualTotalProfit}`);
    console.log(`API Total Orders: ${reportData.totalOrders} | Manual Total Orders: ${orders.length}`);
    
    if (Math.abs(reportData.totalRevenue - manualTotalRevenue) < 0.1 && 
        Math.abs(reportData.totalFilteredProfit - manualTotalProfit) < 0.1 &&
        reportData.totalOrders === orders.length) {
      console.log('✅ ALL CALCULATIONS MATCH EXPECTED VALUES!');
    } else {
      console.error('❌ MISMATCH DETECTED! (Pagination is no longer affecting results, but calculations differ)');
    }

  } catch (err) {
    console.error('Error during testing:', err.message);
  }
}

runTests();
