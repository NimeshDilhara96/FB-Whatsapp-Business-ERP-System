import { create } from "zustand";
import { logoutUser } from "../services/authService";

const SESSION_FLAG_KEY = "orderflow_has_session";

export const useAuthStore = create((set) => ({
  user: null,

  login: (user) => {
    if (user) {
      localStorage.setItem(SESSION_FLAG_KEY, "true");
    }
    set({ user });
  },

  updateUserCurrency: (currency) => {
    set((state) => ({
      user: state.user ? { ...state.user, currency } : null,
    }));
  },

  clearSession: () => {
    localStorage.removeItem(SESSION_FLAG_KEY);
    set({ user: null });
  },

  logout: async () => {
    localStorage.removeItem(SESSION_FLAG_KEY);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      set({ user: null });
    }
  },
}));
