import { create } from "zustand";
import { logoutUser } from "../services/authService";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken") || null,

  login: (user, accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    set({ user, accessToken });
  },

  updateUserCurrency: (currency) => {
    set((state) => ({
      user: state.user ? { ...state.user, currency } : null,
    }));
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      set({ user: null, accessToken: null });
    }
  },
}));