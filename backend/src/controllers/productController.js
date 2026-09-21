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
    req.log.error({ err: error }, "Create Product Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. Get all products for the logged-in user
export const getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Run count and find concurrently for performance
    const [totalItems, products] = await Promise.all([
      Product.countDocuments({ tenantId: tenantId }),
      Product.find({ tenantId: tenantId })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      data: products,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    req.log.error({ err: error }, "Get Products Error");
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
    req.log.error({ err: error }, "Update Product Error");
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
    req.log.error({ err: error }, "Delete Product Error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};
