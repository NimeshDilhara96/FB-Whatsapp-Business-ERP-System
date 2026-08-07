import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logoutUser } from "../services/authService";

export const useAuthStore = create((set) => ({
  user: null,

  login: (user) => {
    set({ user });
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
      set({ user: null });
    }
  },
}));