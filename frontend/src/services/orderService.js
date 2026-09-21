import API from "../api/api";

export const getOrders = async (page = 1, limit = 50) => {
  const response = await API.get(`/orders?page=${page}&limit=${limit}`);
  return response.data;
};

// This sends BOTH Customer details and Order items to the backend
export const createOrder = async (orderData) => {
  const response = await API.post("/orders", orderData);
  return response.data;
};

// update order details (status or payment)
export const updateOrderDetails = async (orderId, updates) => {
    const response = await API.patch(`/orders/${orderId}/status`, updates);
    return response.data;
};

export const getCustomerOrders = async (customerId) => {
    const response = await API.get(`/orders/customer/${customerId}`);
    return response.data;
};
