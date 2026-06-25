import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { createOrder } from "../services/orderService";
import { getProducts } from "../services/productService";
import { getCustomers } from "../services/customerService";

const cities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Matara",
  "Negombo",
  "Kurunegala",
  "Jaffna",
  "Gampaha",
  "Anuradhapura",
  "Kegalle",
];

const Orders = () => {
  // ── Data fetching States ──
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]); // customers state

  const fetchProductsData = async () => {
    try {
      const data = await getProducts();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to fetch products for dropdown", err);
    }
  };

  // customers fetch from backend
  const fetchCustomersData = async () => {
    try {
      const data = await getCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (data && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else if (data && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers for auto-fill", err);
    }
  };

  useEffect(() => {
    fetchProductsData();
    fetchCustomersData(); // page load and customers fetched
  }, []);

  // ── Form state ──
  const emptyForm = {
    customerName: "",
    whatsappNumber: "",
    address: "",
    city: "",
    source: "WhatsApp",
    paymentMethod: "Cash on Delivery",
    items: [{ productName: "", quantity: 1, price: 0 }],
    totalAmount: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ── Input handlers (With Auto-Fill Magic!) ──
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 👈 type whatsapp number automatically fill the customer details
    if (name === "whatsappNumber") {
      const existingCustomer = customers.find(
        (c) => c.whatsappNumber === value,
      );

      if (existingCustomer) {
        setForm((prev) => ({
          ...prev,
          whatsappNumber: value,
          customerName: existingCustomer.name,
          address: existingCustomer.address || "",
          city: existingCustomer.city || "",
        }));
        return; // auto fill so stop
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = form.items.map((it, i) =>
      i === index ? { ...it, [field]: value } : it,
    );
    setForm({ ...form, items: newItems });
    recalculateTotal(newItems);
  };

  const handleProductSelect = (index, selectedProductName) => {
    const selectedProduct = products.find(
      (p) => p.name === selectedProductName,
    );

    if (selectedProduct) {
      const newItems = form.items.map((it, i) =>
        i === index
          ? {
              ...it,
              productName: selectedProduct.name,
              price: selectedProduct.price,
            }
          : it,
      );
      setForm({ ...form, items: newItems });
      recalculateTotal(newItems);
    } else {
      handleItemChange(index, "productName", selectedProductName);
      handleItemChange(index, "price", 0);
    }
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productName: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
    recalculateTotal(newItems);
  };

  const recalculateTotal = (items) => {
    const total = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
      0,
    );
    setForm((prev) => ({ ...prev, totalAmount: total }));
  };

  // ── Form submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.whatsappNumber.trim())) {
      return setError(
        "Please enter a valid 10‑digit WhatsApp number (e.g. 0771234567)",
      );
    }
    if (!form.customerName) {
      return setError("Customer name is required");
    }

    try {
      await createOrder(form);
      setSuccess("Order created successfully!");
      setForm(emptyForm);
      fetchCustomersData(); // new user added to the list
    } catch (err) {
      console.error("Backend Error Data:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create order",
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">
          Order Management
        </h1>
        <p className="text-tx-subtle text-sm mt-1">
          Create new orders and view existing ones
        </p>
      </div>

      <Card className="mb-8">
        <h3 className="text-lg font-bold text-tx-main mb-4">
          Create New Order
        </h3>
        <Alert type="error" message={error} className="mb-4" />
        <Alert type="success" message={success} className="mb-4" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              name="whatsappNumber"
              label="WhatsApp Number (Type here first!)"
              placeholder="0771234567"
              value={form.whatsappNumber}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="customerName"
              label="Customer Name"
              placeholder="John Doe"
              value={form.customerName}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="address"
              label="Address"
              placeholder="123 Main St"
              value={form.address}
              onChange={handleChange}
            />
            <Select
              name="city"
              label="City"
              value={form.city}
              onChange={handleChange}
              options={cities}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              name="source"
              label="Order Source"
              value={form.source}
              onChange={handleChange}
              options={["WhatsApp", "Facebook", "Website", "Other"]}
            />
            <Select
              name="paymentMethod"
              label="Payment Method"
              value={form.paymentMethod}
              onChange={handleChange}
              options={["Cash on Delivery", "Direct Bank Transfer", "Online Payment", "Other"]}
            />
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-tx-main mb-2">Order Items</h4>
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 items-end border-b pb-3 border-base-border-subtle"
              >
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-tx-main mb-1">
                    Select Product
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-base-border-subtle rounded-md bg-base-bg text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={item.productName}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.name} (Rs. {p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  type="number"
                  name="quantity"
                  label="Qty"
                  min={1}
                  max={products.find(p => p.name === item.productName)?.stockQuantity || 9999}
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", Number(e.target.value))
                  }
                />

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      name="price"
                      label="Price"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(idx, "price", Number(e.target.value))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-danger-600 hover:text-danger-700 font-medium mb-1 px-2"
                    title="Remove Item"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addItem}
              className="mt-2"
            >
              + Add Another Item
            </Button>
          </div>

          <div className="pt-4 pb-2 text-lg">
            <strong>Total Amount: </strong>
            <span className="text-primary-600 font-bold">
              Rs. {form.totalAmount.toFixed(2)}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full md:w-auto"
          >
            Save Order
          </Button>
        </form>
      </Card>

    </DashboardLayout>
  );
};

export default Orders;
