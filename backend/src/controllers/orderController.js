import mongoose from "mongoose";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import { hasTransactionSupport } from "../config/db.js";

// 1. Create a new order (Smart "Find or Create" Customer Logic)
export const createOrder = async (req, res) => {
  let session = null;
  if (hasTransactionSupport) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  // Helper to pass session only if it exists
  const sessionOpt = session ? { session } : {};

  try {
    const tenantId = req.user.tenantId;

    const {
      customerName,
      whatsappNumber,
      address,
      city,
      items,
      totalAmount,
      source,
      paymentMethod,
      externalEventId, // Future-proofing for Meta/WhatsApp idempotency
    } = req.body;

    // STEP 1: Smart "Find or Create" Customer Logic
    let customer = await Customer.findOne({
      whatsappNumber: whatsappNumber,
      tenantId: tenantId,
    }, null, sessionOpt);

    if (!customer) {
      customer = new Customer({
        name: customerName,
        whatsappNumber: whatsappNumber,
        address: address || "",
        city: city || "",
        tenantId: tenantId,
      });
      await customer.save(sessionOpt);
    }

    // STEP 2: Pre-validate stock and enrich items with historical cost
    const enrichedItems = [];
    for (const item of items) {
      if (item.productName && item.quantity) {
        // Prefer productId over productName if provided by the trusted backend environment
        const query = { tenantId: tenantId };
        if (item.productId) {
          query._id = item.productId;
        } else {
          query.name = item.productName;
        }

        const product = await Product.findOne(query, null, sessionOpt);
        if (!product) {
          throw new Error(`Product not found: ${item.productName}`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Only ${product.stockQuantity} available.`);
        }

        enrichedItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          costPriceSnapshot: product.costPrice || 0,
        });
      }
    }

    // STEP 3: Decrement Stock Atomically (Race Condition Protection)
    for (const item of enrichedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: item.productId, 
          tenantId: tenantId,
          stockQuantity: { $gte: item.quantity } // CRITICAL: Atomic stock check
        },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true, ...sessionOpt }
      );

      if (!updatedProduct) {
        throw new Error(`Concurrency conflict or insufficient stock for ${item.productName} during checkout.`);
      }
    }

    // STEP 4: Create Order
    const method = paymentMethod || "Cash on Delivery";
    const isPaidMethod = method === "Online Payment";

    const newOrder = new Order({
      tenantId: tenantId,
      customerId: customer._id,
      items: enrichedItems,
      totalAmount: totalAmount,
      source: source || "WhatsApp",
      paymentMethod: method,
      paymentStatus: isPaidMethod ? "Paid" : "Pending",
    });

    const savedOrder = await newOrder.save(sessionOpt);

    // Commit Transaction
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
      customer: customer,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    
    // Convert expected user errors to 400 Bad Request, keep others as 500
    const isUserError = error.message.includes("not found") || error.message.includes("Insufficient") || error.message.includes("Concurrency");
    const statusCode = isUserError ? 400 : 500;
    
    req.log.error({ err: error }, "Create Order Error");
    res.status(statusCode).json({ message: error.message || "Internal Server Error" });
  }
};

// ... (Keep the getOrders function exactly as it was) ...
export const getOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { page = 1, limit = 50 } = req.validatedQuery || {};
    const skip = (page - 1) * limit;

    const [totalItems, orders] = await Promise.all([
      Order.countDocuments({ tenantId: tenantId }),
      Order.find({ tenantId: tenantId })
        .populate("customerId", "name whatsappNumber address city notes")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    req.log.error({ err: error }, "Get Orders Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.validatedParams || req.params;
    const tenantId = req.user.tenantId;

    const orders = await Order.find({ customerId, tenantId })
      .populate("customerId", "name whatsappNumber address city notes")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    req.log.error({ err: error }, "Get Customer Orders Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Order Details Update Function
export const updateOrderDetails = async (req, res) => {
  let session = null;
  if (hasTransactionSupport) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  const sessionOpt = session ? { session } : {};

  const cleanupSession = async () => {
    if (session) {
      await session.abortTransaction();
      session.endSession();
      session = null;
    }
  };

  try {
    const { id } = req.validatedParams || req.params;
    const { orderStatus, paymentStatus } = req.body;

    // 1. Fetch the existing order first
    const tenantId = req.user?.tenantId || req.tenantId;
    const existingOrder = await Order.findOne(
      { _id: id, tenantId },
      null,
      sessionOpt,
    );

    if (!existingOrder) {
      await cleanupSession();
      return res.status(404).json({ message: "Order not found" });
    }

    const prevStatus = existingOrder.orderStatus;
    const updateFields = {};

    // 2. State Machine Logic (Only if orderStatus is provided)
    if (orderStatus && prevStatus !== orderStatus) {
      const validTransitions = {
        Pending: ["Processing", "Shipped", "Cancelled"],
        Processing: ["Shipped", "Cancelled"],
        Shipped: ["Delivered", "Returned"],
        Delivered: ["Completed", "Returned"],
        Completed: [],
        Cancelled: [],
        Returned: [],
      };

      if (!validTransitions[prevStatus]?.includes(orderStatus)) {
        await cleanupSession();
        return res.status(400).json({
          message: `Invalid status transition from ${prevStatus} to ${orderStatus}.`,
        });
      }

      // Ensure order is Paid before it can be Completed
      if (orderStatus === "Completed") {
        const currentPaymentStatus =
          paymentStatus || existingOrder.paymentStatus;
        if (currentPaymentStatus !== "Paid") {
          await cleanupSession();
          return res.status(400).json({
            message: "Cannot mark order as Completed until it is Paid.",
          });
        }
      }

      updateFields.orderStatus = orderStatus;
    }

    // Handle paymentStatus update
    if (paymentStatus && existingOrder.paymentStatus !== paymentStatus) {
      if (!["Pending", "Paid"].includes(paymentStatus)) {
        await cleanupSession();
        return res.status(400).json({ message: "Invalid payment status" });
      }
      updateFields.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateFields).length === 0) {
      await cleanupSession();
      return res.status(200).json(existingOrder);
    }

    // 3. Apply the order update with an atomic precondition on orderStatus: prevStatus
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, tenantId, orderStatus: prevStatus },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true, ...sessionOpt },
    );

    if (!updatedOrder) {
      await cleanupSession();
      return res.status(409).json({
        message:
          "Order status was modified by another request. Please refresh and try again.",
      });
    }

    // 4. Inventory Restoration: If moving to Cancelled or Returned
    if (
      orderStatus &&
      prevStatus !== orderStatus &&
      (orderStatus === "Cancelled" || orderStatus === "Returned")
    ) {
      for (const item of existingOrder.items) {
        if (item.quantity && (item.productId || item.productName)) {
          const productFilter = item.productId
            ? { _id: item.productId, tenantId }
            : { name: item.productName, tenantId };

          await Product.findOneAndUpdate(
            productFilter,
            { $inc: { stockQuantity: item.quantity } },
            sessionOpt,
          );
        }
      }
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
      session = null;
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    await cleanupSession();
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};
