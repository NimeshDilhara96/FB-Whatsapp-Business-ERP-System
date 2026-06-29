import Order from "../models/Order.js";
import Customer from "../models/Customer.js"; // 👈 We need this to search/create customers
import Product from "../models/Product.js";

// 1. Create a new order (Smart "Find or Create" Customer Logic)
export const createOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Destructure everything coming from the frontend form
    const {
      customerName,
      whatsappNumber,
      address,
      city,
      items,
      totalAmount,
      source,
      paymentMethod,
    } = req.body;

    // STEP 1: Check if this customer already exists in this business
    let customer = await Customer.findOne({
      whatsappNumber: whatsappNumber,
      tenantId: tenantId,
    });

    // STEP 2: If customer DOES NOT exist, create them automatically!
    if (!customer) {
      customer = new Customer({
        name: customerName,
        whatsappNumber: whatsappNumber,
        address: address || "",
        city: city || "",
        tenantId: tenantId,
      });
      await customer.save(); // Saved to customer database!
    }

    // STEP 2.5: Check product stock availability
    for (const item of items) {
      if (item.productName && item.quantity) {
        const product = await Product.findOne({
          name: item.productName,
          tenantId: tenantId,
        });
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product not found: ${item.productName}` });
        }
        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.productName}. Only ${product.stockQuantity} available.`,
          });
        }
      }
    }

    // STEP 3: Now create the order using the customer's ID (whether old or new)
    const method = paymentMethod || "Cash on Delivery";
    const isPaidMethod = method === "Online Payment";

    const newOrder = new Order({
      tenantId: tenantId,
      customerId: customer._id, // This links the order to the customer
      items: items,
      totalAmount: totalAmount,
      source: source || "WhatsApp",
      paymentMethod: method,
      paymentStatus: isPaidMethod ? "Paid" : "Pending",
    });

    const savedOrder = await newOrder.save();

    // STEP 4: Reduce product stock quantities
    for (const item of items) {
      if (item.productName && item.quantity) {
        await Product.findOneAndUpdate(
          { name: item.productName, tenantId: tenantId },
          { $inc: { stockQuantity: -item.quantity } },
        );
      }
    }

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
      customer: customer, // We can send back the customer info too
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ... (Keep the getOrders function exactly as it was) ...
export const getOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const orders = await Order.find({ tenantId: tenantId })
      .populate("customerId", "name whatsappNumber address city notes")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user.tenantId;

    const orders = await Order.find({ customerId, tenantId })
      .populate("customerId", "name whatsappNumber address city notes")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Customer Orders Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Order Details Update Function
export const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    // 1. Fetch the existing order first
    const tenantId = req.user?.tenantId || req.tenantId;
    const existingOrder = await Order.findOne({ _id: id, tenantId });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. State Machine Logic (Only if orderStatus is provided)
    if (orderStatus && existingOrder.orderStatus !== orderStatus) {
      const validTransitions = {
        Pending: ["Processing", "Shipped", "Cancelled"],
        Processing: ["Shipped", "Cancelled"],
        Shipped: ["Delivered", "Returned"],
        Delivered: ["Completed", "Returned"],
        Completed: [],
        Cancelled: [],
        Returned: [],
      };

      if (!validTransitions[existingOrder.orderStatus]?.includes(orderStatus)) {
        return res.status(400).json({
          message: `Invalid status transition from ${existingOrder.orderStatus} to ${orderStatus}.`,
        });
      }

      // Ensure order is Paid before it can be Completed
      if (orderStatus === "Completed") {
        const currentPaymentStatus = paymentStatus || existingOrder.paymentStatus;
        if (currentPaymentStatus !== "Paid") {
          return res.status(400).json({
            message: "Cannot mark order as Completed until it is Paid.",
          });
        }
      }

      // 3. Inventory Restoration: If moving to Cancelled or Returned
      if (orderStatus === "Cancelled" || orderStatus === "Returned") {
        for (const item of existingOrder.items) {
          if (item.productName && item.quantity) {
            await Product.findOneAndUpdate(
              { name: item.productName, tenantId },
              { $inc: { stockQuantity: item.quantity } },
            );
          }
        }
      }

      existingOrder.orderStatus = orderStatus;
    }

    // Handle paymentStatus update
    if (paymentStatus && existingOrder.paymentStatus !== paymentStatus) {
      if (!["Pending", "Paid"].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      existingOrder.paymentStatus = paymentStatus;
    }

    // 4. Apply the update
    const updatedOrder = await existingOrder.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};
