import API from "../api/api";

export const getOrders = async () => {
  const response = await API.get("/orders");
  return response.data;
};

// This sends BOTH Customer details and Order items to the backend
export const createOrder = async (orderData) => {
  const response = await API.post("/orders", orderData);
  return response.data;
};

//new updateOrderStatus function
export const updateOrderStatus = async (orderId, newStatus) => {
    const response = await API.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
    return response.data;
};

export const getCustomerOrders = async (customerId) => {
    const response = await API.get(`/orders/customer/${customerId}`);
    return response.data;
};
