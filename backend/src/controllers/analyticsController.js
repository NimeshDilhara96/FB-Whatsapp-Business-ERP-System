import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

export const getDashboardStats = async (req, res) => {
  try {
    const startOverall = performance.now();
    const tenantId = req.user.tenantId;
    const { dateFilter = '7' } = req.query;

    const now = new Date();
    const filterDate = new Date();
    if (dateFilter === '7') filterDate.setDate(now.getDate() - 7);
    else if (dateFilter === '30') filterDate.setDate(now.getDate() - 30);
    else filterDate.setFullYear(2000); // All time

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const startDB = performance.now();
    // Order Stats and Inventory (The Heavy Lifting)
    const [orderAgg, productAgg, totalCustomersCount, newCustomersCount] = await Promise.all([
      Order.aggregate([
        { $match: { tenantId } },
        
        // We unwind items to calculate item-level profit/cost
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        
        // Calculate item profit
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
        
        // Regroup back to orders
        { $group: {
            _id: "$_id",
            doc: { $first: "$$ROOT" },
            totalOrderProfit: { $sum: "$itemProfit" },
            totalOrderCost: { $sum: "$itemCost" },
            items: { $push: "$items" }
        }},
        { $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { totalProfit: "$totalOrderProfit", totalCost: "$totalOrderCost", items: "$items" }] } } },
        
        // Now perform facets
        { $facet: {
            // 3a. Global stats (not affected by dateFilter except for ordersToday)
            globalStats: [
              { $group: {
                  _id: null,
                  ordersToday: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0] } },
                  totalRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalAmount", 0] } },
                  pendingRevenue: { $sum: { $cond: [{ $and: [{ $ne: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalAmount", 0] } },
                  totalProfit: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalProfit", 0] } },
                  returnedOrdersCount: { $sum: { $cond: [{ $eq: ["$orderStatus", "Returned"] }, 1, 0] } },
                  Pending: { $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] } },
                  Processing: { $sum: { $cond: [{ $eq: ["$orderStatus", "Processing"] }, 1, 0] } },
                  Shipped: { $sum: { $cond: [{ $eq: ["$orderStatus", "Shipped"] }, 1, 0] } },
                  Delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] } },
              }}
            ],
            
            // 3b. Filtered Data (Chart, Top Products, Top Customers, Source)
            chart: [
              { $match: { createdAt: { $gte: filterDate }, paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
              { $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  sales: { $sum: "$totalAmount" }
              }},
              { $sort: { _id: 1 } }
            ],
            products: [
              { $match: { createdAt: { $gte: filterDate }, orderStatus: { $nin: ["Cancelled", "Returned"] } } },
              { $unwind: "$items" },
              { $group: { _id: "$items.productName", sales: { $sum: "$items.quantity" } } },
              { $sort: { sales: -1 } },
              { $limit: 5 }
            ],
            customers: [
              { $match: { createdAt: { $gte: filterDate }, orderStatus: { $nin: ["Cancelled", "Returned"] } } },
              { $group: { _id: "$customerId", total: { $sum: "$totalAmount" } } },
              { $sort: { total: -1 } },
              { $limit: 5 },
              { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerDoc" } },
              { $unwind: "$customerDoc" },
              { $project: { _id: 1, total: 1, name: "$customerDoc.name" } }
            ],
            source: [
              { $match: { createdAt: { $gte: filterDate }, paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
              { $group: { _id: { $ifNull: ["$source", "WhatsApp"] }, value: { $sum: "$totalAmount" } } },
              { $sort: { value: -1 } }
            ],
            recentPending: [
              { $match: { orderStatus: "Pending" } },
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
              { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
              { $project: { _id: 1, totalAmount: 1, createdAt: 1, items: 1, "customerId.name": "$customerDoc.name", "customerId._id": "$customerDoc._id" } }
            ]
        }}
      ]),
      Product.aggregate([
        { $match: { tenantId } },
        { $group: {
            _id: null,
            lowStockCount: { $sum: { $cond: [{ $lt: ["$stockQuantity", 5] }, 1, 0] } },
            inventoryValue: { $sum: { $multiply: [{ $ifNull: ["$price", 0] }, { $ifNull: ["$stockQuantity", 0] }] } }
        }}
      ]),
      Customer.countDocuments({ tenantId }),
      Customer.countDocuments({ tenantId, createdAt: { $gte: todayStart } })
    ]);

    const endDB = performance.now();
    console.log(`[DASHBOARD DB TIME]: ${(endDB - startDB).toFixed(2)} ms`);

    const startJS = performance.now();

    const inventoryValue = productAgg[0]?.inventoryValue || 0;
    const lowStockCount = productAgg[0]?.lowStockCount || 0;

    const stats = orderAgg[0].globalStats[0] || {};

    // Format chart data
    const chartDataMap = new Map();
    orderAgg[0].chart.forEach(c => {
      const d = new Date(c._id);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap.set(formatted, (chartDataMap.get(formatted) || 0) + c.sales);
    });
    
    // Fill in missing days
    let chartData = [];
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        chartData.push({ date: dateStr, sales: chartDataMap.get(dateStr) || 0 });
      }
    } else {
      chartData = Array.from(chartDataMap, ([date, sales]) => ({ date, sales }));
    }

    const SOURCE_COLORS = { 'WhatsApp': '#25D366', 'Facebook': '#1877F2', 'Website': '#8B5CF6', 'Other': '#6B7280' };
    
    const endJS = performance.now();
    
    res.json({
      _timings: {
        dbTime: endDB - startDB,
        jsTime: endJS - startJS,
        overallTime: endJS - startOverall
      },
      ordersToday: stats.ordersToday || 0,
      totalRevenue: stats.totalRevenue || 0,
      pendingRevenue: stats.pendingRevenue || 0,
      totalProfit: stats.totalProfit || 0,
      inventoryValue,
      lowStockCount,
      returnedOrdersCount: stats.returnedOrdersCount || 0,
      totalCustomersCount,
      newCustomersCount,
      activeFunnel: {
        Pending: stats.Pending || 0,
        Processing: stats.Processing || 0,
        Shipped: stats.Shipped || 0,
        Delivered: stats.Delivered || 0,
      },
      chartData,
      topProducts: orderAgg[0].products.map(p => ({ name: p._id, sales: p.sales })),
      topCustomers: orderAgg[0].customers.map(c => ({ name: c.name, total: c.total })),
      sourceData: orderAgg[0].source.map(s => ({ name: s._id, value: s.value, color: SOURCE_COLORS[s._id] || '#6B7280' })),
      recentPendingOrders: orderAgg[0].recentPending || []
    });

    console.log(`[DASHBOARD JS TIME]: ${(endJS - startJS).toFixed(2)} ms`);
    console.log(`[DASHBOARD OVERALL CONTROLLER TIME]: ${(endJS - startOverall).toFixed(2)} ms`);

  } catch (error) {
    req.log.error({ err: error }, "Dashboard Analytics Error");
    res.status(500).json({ message: error.message });
  }
};

export const getReportStats = async (req, res) => {
  try {
    const startOverall = performance.now();
    const tenantId = req.user.tenantId;
    const { timeframe = 'all' } = req.query;

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterDate = new Date();
    if (timeframe === 'today') filterDate.setHours(0, 0, 0, 0);
    else if (timeframe === '7days') filterDate.setDate(now.getDate() - 7);
    else if (timeframe === '28days') filterDate.setDate(now.getDate() - 28);
    else if (timeframe === 'month') {
        filterDate.setFullYear(now.getFullYear(), now.getMonth(), 1);
        filterDate.setHours(0,0,0,0);
    } else filterDate.setFullYear(2000);

    const startDB = performance.now();
    const orderAgg = await Order.aggregate([
      { $match: { tenantId } },
      
      // We unwind items to calculate item-level profit/cost
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
          }
      }},
      
      { $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          totalOrderProfit: { $sum: "$itemProfit" },
          items: { $push: "$items" }
      }},
      { $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { totalProfit: "$totalOrderProfit", items: "$items" }] } } },
      
      { $facet: {
          // Quick Stats (Global)
          quickStats: [
            { $match: { paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
            { $group: {
                _id: null,
                salesToday: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$totalAmount", 0] } },
                profitToday: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$totalProfit", 0] } },
                salesThisWeek: { $sum: { $cond: [{ $gte: ["$createdAt", weekStart] }, "$totalAmount", 0] } },
                profitThisWeek: { $sum: { $cond: [{ $gte: ["$createdAt", weekStart] }, "$totalProfit", 0] } },
                salesThisMonth: { $sum: { $cond: [{ $gte: ["$createdAt", monthStart] }, "$totalAmount", 0] } },
                profitThisMonth: { $sum: { $cond: [{ $gte: ["$createdAt", monthStart] }, "$totalProfit", 0] } }
            }}
          ],
          
          // Timeframe Filtered Stats
          metrics: [
            { $match: { createdAt: { $gte: filterDate } } },
            { $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalAmount", 0] } },
                pendingRevenue: { $sum: { $cond: [{ $and: [{ $ne: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalAmount", 0] } },
                totalFilteredProfit: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "Paid"] }, { $ne: ["$orderStatus", "Cancelled"] }, { $ne: ["$orderStatus", "Returned"] }] }, "$totalProfit", 0] } },
                returnedOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "Returned"] }, 1, 0] } },
                cancelledOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] } },
            }}
          ],
          orderStatusData: [
            { $match: { createdAt: { $gte: filterDate } } },
            { $group: { _id: "$orderStatus", value: { $sum: 1 } } }
          ],
          chart: [
            { $match: { createdAt: { $gte: filterDate }, paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                sales: { $sum: "$totalAmount" }
            }},
            { $sort: { _id: 1 } }
          ],
          products: [
            { $match: { createdAt: { $gte: filterDate }, paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.productName", 
                sales: { $sum: "$items.quantity" },
                profit: { $sum: "$items.itemProfit" }
            }},
            { $sort: { profit: -1 } },
            { $limit: 5 }
          ],
          customers: [
            { $match: { createdAt: { $gte: filterDate }, orderStatus: { $nin: ["Cancelled", "Returned"] } } },
            { $group: { _id: "$customerId", total: { $sum: "$totalAmount" } } },
            { $sort: { total: -1 } },
            { $limit: 5 },
            { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerDoc" } },
            { $unwind: "$customerDoc" },
            { $project: { _id: 1, total: 1, name: "$customerDoc.name" } }
          ],
          source: [
            { $match: { createdAt: { $gte: filterDate }, paymentStatus: "Paid", orderStatus: { $nin: ["Cancelled", "Returned"] } } },
            { $group: { _id: { $ifNull: ["$source", "WhatsApp"] }, value: { $sum: "$totalAmount" } } },
            { $sort: { value: -1 } }
          ]
      }}
    ]);

    const endDB = performance.now();
    console.log(`[REPORTS DB TIME]: ${(endDB - startDB).toFixed(2)} ms`);

    const startJS = performance.now();

    const qStats = orderAgg[0].quickStats[0] || {};
    const fMetrics = orderAgg[0].metrics[0] || {};

    const totalOrders = fMetrics.totalOrders || 0;
    const returnRate = totalOrders > 0 ? ((fMetrics.returnedOrders || 0) / totalOrders * 100).toFixed(1) : 0;
    const aov = totalOrders > 0 ? ((fMetrics.totalRevenue || 0) / totalOrders) : 0;

    const COLORS = { 'Pending': '#F59E0B', 'Processing': '#3B82F6', 'Shipped': '#8B5CF6', 'Delivered': '#10B981', 'Completed': '#059669', 'Cancelled': '#EF4444', 'Returned': '#F97316' };
    const SOURCE_COLORS = { 'WhatsApp': '#25D366', 'Facebook': '#1877F2', 'Website': '#8B5CF6', 'Other': '#6B7280' };

    // Format chart data
    const chartDataMap = new Map();
    orderAgg[0].chart.forEach(c => {
      const d = new Date(c._id);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap.set(formatted, (chartDataMap.get(formatted) || 0) + c.sales);
    });
    
    let chartData = [];
    if (timeframe === '7days' || timeframe === '28days' || timeframe === 'month') {
      const daysToIterate = timeframe === '7days' ? 7 : (timeframe === '28days' ? 28 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
      const startDate = new Date(filterDate);
      for (let i = 0; i < daysToIterate; i++) {
        if (startDate > now) break;
        const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        chartData.push({ date: dateStr, sales: chartDataMap.get(dateStr) || 0 });
        startDate.setDate(startDate.getDate() + 1);
      }
    } else {
      chartData = Array.from(chartDataMap, ([date, sales]) => ({ date, sales }));
    }

    const endJS = performance.now();
    
    res.json({
      _timings: {
        dbTime: endDB - startDB,
        jsTime: endJS - startJS,
        overallTime: endJS - startOverall
      },
      quickStats: {
        salesToday: qStats.salesToday || 0,
        profitToday: qStats.profitToday || 0,
        salesThisWeek: qStats.salesThisWeek || 0,
        profitThisWeek: qStats.profitThisWeek || 0,
        salesThisMonth: qStats.salesThisMonth || 0,
        profitThisMonth: qStats.profitThisMonth || 0,
      },
      totalOrders,
      totalRevenue: fMetrics.totalRevenue || 0,
      pendingRevenue: fMetrics.pendingRevenue || 0,
      returnedOrders: fMetrics.returnedOrders || 0,
      cancelledOrders: fMetrics.cancelledOrders || 0,
      returnRate,
      totalFilteredProfit: fMetrics.totalFilteredProfit || 0,
      aov,
      topProducts: orderAgg[0].products.map(p => ({ name: p._id, sales: p.sales, profit: p.profit })),
      topCustomers: orderAgg[0].customers.map(c => ({ name: c.name, total: c.total })),
      orderStatusData: orderAgg[0].orderStatusData.map(s => ({ name: s._id, value: s.value, color: COLORS[s._id] || '#6B7280' })),
      chartData,
      sourceData: orderAgg[0].source.map(s => ({ name: s._id, value: s.value, color: SOURCE_COLORS[s._id] || '#6B7280' }))
    });

    console.log(`[REPORTS JS TIME]: ${(endJS - startJS).toFixed(2)} ms`);
    console.log(`[REPORTS OVERALL CONTROLLER TIME]: ${(endJS - startOverall).toFixed(2)} ms`);

  } catch (error) {
    req.log.error({ err: error }, "Reports Analytics Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};
