import api from "../api/api";

export const getProducts = (page = 1, limit = 50) => {
  return api.get(`/products?page=${page}&limit=${limit}`);
};

export const createProduct = (data) => {
  return api.post("/products", data);
};

export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};
