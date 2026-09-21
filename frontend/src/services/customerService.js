// src/services/customerService.js
import API from "../api/api";

export const getCustomers = async (page = 1, limit = 50) => {
  const response = await API.get(`/customers?page=${page}&limit=${limit}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await API.post("/customers", customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await API.put(`/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await API.delete(`/customers/${id}`);
  return response.data;
};
