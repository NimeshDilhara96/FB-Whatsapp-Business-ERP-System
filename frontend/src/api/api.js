import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { refreshToken } from "../services/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // IMPORTANT: Allows sending/receiving cookies
});

// Axios Interceptor to automatically attach headers to EVERY request
api.interceptors.request.use((config) => {
  // 1. Get the auth token from Zustand store
  const token = useAuthStore.getState().accessToken;

  // 2. Attach Authorization header if logged in
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor to handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to get a new access token
        const res = await refreshToken();
        const newAccessToken = res.data.accessToken;

        // Update Zustand store and localStorage
        useAuthStore.getState().login(useAuthStore.getState().user, newAccessToken);

        // Update the authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token expired), log out the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;