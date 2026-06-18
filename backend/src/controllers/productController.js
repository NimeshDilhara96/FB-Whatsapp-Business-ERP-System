import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    // 1. Inject the tenantId from the request context into the payload
    const productPayload = {
      ...req.body,
      tenantId: req.tenantId, 
    };
    const product = await Product.create(productPayload);

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    // 2. Filter products strictly by the requesting tenant's ID
    const products = await Product.find({ tenantId: req.tenantId });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    // 3. Ensure a user can only delete products belonging to their tenant
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.tenantId 
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    res.json({
      message: "Product Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};