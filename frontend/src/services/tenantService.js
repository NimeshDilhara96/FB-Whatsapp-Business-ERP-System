import API from "../api/api";

export const updateTenantCurrency = async (currency) => {
  const response = await API.put("/tenant/currency", { currency });
  return response.data;
};
