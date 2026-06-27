import React, { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { useAuthStore } from "../store/authStore";

const Products = () => {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();

      // 🛑 DEBUGGING: මේකෙන් බලන්න පුළුවන් Backend එකෙන් හරියටම එන්නේ මොකක්ද කියලා
      console.log("Backend Response:", response);

      // 🛡️ SAFE STATE UPDATE: එන Data එක Array එකක් නම් විතරක් State එකට දානවා
      if (Array.isArray(response)) {
        setProducts(response);
      } else if (response && Array.isArray(response.data)) {
        // සමහර වෙලාවට Axios වලින් data කියන object එක ඇතුළේ අරන් එන්නේ
        setProducts(response.data);
      } else if (response && Array.isArray(response.products)) {
        // සමහර වෙලාවට Backend එකෙන් { products: [...] } විදිහට එව්වොත්
        setProducts(response.products);
      } else {
        console.error("අවුලක්! Array එකක් නෙවෙයි ආවේ:", response);
        setProducts([]); // කෝඩ් එක Crash වෙන එක නවත්වන්න හිස් Array එකක් දානවා
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]); // Error එකක් ආවත් Crash වෙන්නේ නැති වෙන්න හිස් Array එකක් දෙනවා
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.name || !formData.price || !formData.stockQuantity) {
      return setError("Name, Price, and Stock Quantity are required.");
    }

    if (isNaN(formData.price) || Number(formData.price) < 0) {
      return setError("Price must be a valid positive number.");
    }

    if (isNaN(formData.stockQuantity) || Number(formData.stockQuantity) < 0) {
      return setError("Stock Quantity must be a valid positive number.");
    }

    try {
      const dataToSubmit = {
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stockQuantity: Number(formData.stockQuantity),
      };

      if (editingId) {
        await updateProduct(editingId, dataToSubmit);
        setSuccess("Product updated successfully!");
      } else {
        await createProduct(dataToSubmit);
        setSuccess("Product added successfully!");
      }
      setFormData({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        stockQuantity: "",
      });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      setError(error.response?.data?.message || "Error saving product");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      costPrice: product.costPrice || "",
      stockQuantity:
        product.stockQuantity !== undefined ? product.stockQuantity : "",
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      costPrice: "",
      stockQuantity: "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">
          Product Management
        </h1>
        <p className="text-tx-subtle text-sm mt-1">
          Manage your products and inventory
        </p>
      </div>

      <Card className="mb-8">
        <h3 className="text-lg font-bold text-tx-main mb-4">
          {editingId ? "Edit Product" : "Add New Product"}
        </h3>

        <Alert type="error" message={error} className="mb-4" />
        <Alert type="success" message={success} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              type="text"
              name="name"
              label="Product Name"
              placeholder="E.g. Wireless Mouse"
              value={formData.name}
              onChange={handleInputChange}
            />
            <Input
              type="number"
              name="price"
              label="Selling Price"
              placeholder="0.00"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
            <Input
              type="number"
              name="costPrice"
              label="Cost Price (Optional)"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
            <Input
              type="number"
              name="stockQuantity"
              label="Stock Quantity"
              placeholder="0"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              min="0"
            />
            <div className="lg:col-span-2">
              <Input
                type="text"
                name="description"
                label="Description"
                placeholder="Product details"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="submit" variant="primary">
              {editingId ? "Update Product" : "Save Product"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-tx-main mb-4">Product List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-base-border-subtle text-sm text-tx-subtle">
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Name
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Description
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Price
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Stock Quantity
                </th>
                <th className="py-3 px-4 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* 🛡️ SAFE RENDERING: Array එකක්ද කියලා බලලා විතරක් Map කරනවා */}
              {!Array.isArray(products) || products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-tx-subtle">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-base-border-subtle hover:bg-base-bg transition-colors"
                  >
                    <td className="py-3 px-4 text-tx-main font-medium">
                      {product.name}
                    </td>
                    <td className="py-3 px-4 text-tx-muted">
                      {product.description || "-"}
                    </td>
                    <td className="py-3 px-4 text-tx-muted">
                      {user?.currency || 'Rs.'} {Number(product.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-tx-muted">
                      {product.stockQuantity}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-danger-600 hover:text-danger-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default Products;
