import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { refreshToken } from "../services/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // IMPORTANT: Allows sending/receiving cookies
});

// Axios Interceptor to automatically attach headers to EVERY request
api.interceptors.request.use((config) => {
  // We no longer need to attach the token manually! 
  // withCredentials: true ensures the HttpOnly cookies are sent automatically.
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor to handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error, and it's NOT a retry, and it's NOT the login or refresh endpoints itself
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh") &&
      !originalRequest.url.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to hit the refresh endpoint (this will set a new HttpOnly accessToken cookie)
        await refreshToken();

        // Update Zustand store (just to re-trigger reactivity if needed, though usually automatic)
        useAuthStore.getState().login(useAuthStore.getState().user);

        // Retry original request (cookies will be automatically attached)
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