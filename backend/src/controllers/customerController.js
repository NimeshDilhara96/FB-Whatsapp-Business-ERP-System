import Customer from "../models/Customer.js";

// create customer
export const createCustomer = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    const tenantId = req.user.tenantId; // Middleware id

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
// 3. Customer details (Update)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // check user in my business (tenantId)
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: id, tenantId: tenantId },
      { $set: req.body }, // add new details
      { new: true }, // return updated details
    );

    if (!updatedCustomer) {
      return res
        .status(404)
        .json({ message: "Customer not found or unauthorized to update" });
    }

    res.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 4. delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // check user in my business
    const deletedCustomer = await Customer.findOneAndDelete({
      _id: id,
      tenantId: tenantId,
    });

    if (!deletedCustomer) {
      return res
        .status(404)
        .json({ message: "Customer not found or unauthorized to delete" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
