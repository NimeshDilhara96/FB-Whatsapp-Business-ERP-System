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
    req.log.error({ err: error }, "Create Customer Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. get own business customers only
export const getCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [totalItems, customers] = await Promise.all([
      Customer.countDocuments({ tenantId: tenantId }),
      Customer.find({ tenantId: tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);
      
    res.json({
      data: customers,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    req.log.error({ err: error }, "Get Customers Error");
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
      { returnDocument: 'after' }, // return updated details
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
    req.log.error({ err: error }, "Update Customer Error");
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
    req.log.error({ err: error }, "Delete Customer Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};
