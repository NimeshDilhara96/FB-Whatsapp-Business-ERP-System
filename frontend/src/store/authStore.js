import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logoutUser } from "../services/authService";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: (user, accessToken) => {
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
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);