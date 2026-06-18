import api from "../api/api";

export const getProducts = () => {
  return api.get("/products");
};

export const createProduct = (data) => {
  return api.post("/products", data);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};