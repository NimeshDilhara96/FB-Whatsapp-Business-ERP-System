import Customer from "../models/Customer.js";

// create customer
export const createCustomer = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    const tenantId = req.user.tenantId; // Middleware එකෙන් එන ID එක

    // check same number already exists in same business
    const existingCustomer = await Customer.findOne({
      tenantId,
      whatsappNumber,
    });
    if (existingCustomer) {
      return res.status(400).json({
        message: "This WhatsApp number is already registered in your business.",
      });
    }

    //create customer
    const newCustomer = await Customer.create({
      ...req.body,
      tenantId: tenantId,
    });

    res
      .status(201)
      .json({ message: "Customer added successfully", customer: newCustomer });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. get own business customers only
export const getCustomers = async (req, res) => {
  try {
    //  own business customers only tenantId only
    const customers = await Customer.find({ tenantId: req.user.tenantId }).sort(
      { createdAt: -1 },
    );
    res.json(customers);
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
