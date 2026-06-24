import Product from "../models/Product.js";

// 1. Create a new product
export const createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const newProduct = new Product({
      ...req.body,
      tenantId: tenantId,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. Get all products for the logged-in user
export const getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Only fetch products that belong to this tenant
    const products = await Product.find({ tenantId: tenantId });

    res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Find and update the product only if it belongs to the logged-in user
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, tenantId: tenantId },
      { $set: req.body },
      { returnDocument: 'after' }, // Return the updated product
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 4. Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Find and delete the product only if it belongs to the logged-in user
    const deletedProduct = await Product.findOneAndDelete({
      _id: id,
      tenantId: tenantId,
    });

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
