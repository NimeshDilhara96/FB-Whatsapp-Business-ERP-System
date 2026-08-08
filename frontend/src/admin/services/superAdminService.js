import api from "../../api/api";

const SUPER_ADMIN_URL = "/superadmin";

export const getPlatformStats = () => {
  return api.get(`${SUPER_ADMIN_URL}/stats`);
};

export const getAllTenants = () => {
  return api.get(`${SUPER_ADMIN_URL}/tenants`);
};

export const updateTenantStatus = (id, status) => {
  return api.put(`${SUPER_ADMIN_URL}/tenants/${id}/status`, { status });
};

export const getAllUsers = () => {
  return api.get(`${SUPER_ADMIN_URL}/users`);
};
