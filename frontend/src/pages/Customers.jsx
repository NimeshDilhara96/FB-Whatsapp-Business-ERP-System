import React, { useState, useEffect } from "react";
import {
  getCustomers,
  deleteCustomer,
  updateCustomer,
} from "../services/customerService";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import CustomerSidePanel from "../components/customers/CustomerSidePanel";

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

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    whatsappNumber: "",
    address: "",
    city: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
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
    if (!formData.name || !formData.whatsappNumber) {
      return setError("Name and WhatsApp Number are required.");
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.whatsappNumber.trim())) {
      return setError(
        "Please enter a valid 10-digit WhatsApp number (e.g. 0771234567).",
      );
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        setSuccess("Customer updated successfully!");
        setFormData({
          name: "",
          whatsappNumber: "",
          address: "",
          city: "",
          notes: "",
        });
        setEditingId(null);
        fetchCustomers();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error saving customer");
    }
  };

  const handleEditClick = (customer) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name || "",
      whatsappNumber: customer.whatsappNumber || "",
      address: customer.address || "",
      city: customer.city || "",
      notes: customer.notes || "",
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      whatsappNumber: "",
      address: "",
      city: "",
      notes: "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        alert("Failed to delete customer");
      }
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
  };

  const closePopup = () => {
    setSelectedCustomer(null);
  };

  return (
    <DashboardLayout>
      <CustomerSidePanel 
        customer={selectedCustomer} 
        onClose={closePopup} 
      />

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-tx-main tracking-tight">
          Customer Management
        </h1>
        <p className="text-tx-subtle text-sm mt-1">
          Manage your business customers
        </p>
      </div>

      {editingId && (
        <Card className="mb-8">
          <h3 className="text-lg font-bold text-tx-main mb-4">
            Edit Customer
          </h3>

        <Alert type="error" message={error} className="mb-4" />
        <Alert type="success" message={success} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              name="name"
              label="Name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <Input
              type="text"
              name="whatsappNumber"
              label="WhatsApp Number"
              placeholder="0771234567"
              value={formData.whatsappNumber}
              onChange={handleInputChange}
            />
            <Input
              type="text"
              name="address"
              label="Address"
              placeholder="Full Address"
              value={formData.address}
              onChange={handleInputChange}
            />
            <Select
              name="city"
              label="City"
              value={formData.city}
              onChange={handleInputChange}
              options={cities}
            />
            <Input
              type="text"
              name="notes"
              label="Notes"
              placeholder="Notes (e.g. VIP, Regular)"
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="submit" variant="primary">
              Update Customer
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
      )}

      <Card>
        <h3 className="text-lg font-bold text-tx-main mb-4">Customer List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-base-border-subtle text-sm text-tx-subtle">
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Name
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  WhatsApp Number
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Address
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  City
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  Notes
                </th>
                <th className="py-3 px-4 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-tx-subtle">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-base-border-subtle hover:bg-base-bg transition-colors"
                  >
                    <td 
                      className="py-3 px-4 text-primary-600 font-medium cursor-pointer hover:text-primary-700 hover:underline"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.name}
                    </td>
                    <td className="py-3 px-4 text-tx-muted">
                      {customer.whatsappNumber}
                    </td>
                    <td className="py-3 px-4 text-tx-muted">{customer.address}</td>
                    <td className="py-3 px-4 text-tx-muted">{customer.city}</td>
                    <td className="py-3 px-4 text-tx-muted">
                      {customer.notes}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(customer)}
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
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

export default Customers;
