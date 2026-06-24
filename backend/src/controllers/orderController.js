import Order from "../models/Order.js";
import Customer from "../models/Customer.js"; // 👈 We need this to search/create customers

// 1. Create a new order (Smart "Find or Create" Customer Logic)
export const createOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Destructure everything coming from the frontend form
    const { customerName, whatsappNumber, address, city, items, totalAmount } =
      req.body;

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

    // STEP 3: Now create the order using the customer's ID (whether old or new)
    const newOrder = new Order({
      tenantId: tenantId,
      customerId: customer._id, // This links the order to the customer
      items: items,
      totalAmount: totalAmount,
    });

    const savedOrder = await newOrder.save();

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
      .populate("customerId", "name whatsappNumber address")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Order Status Update Function
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId }, // get only own orders
      { orderStatus },
      { returnDocument: 'after' },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};
