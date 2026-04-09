import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "@/services/admin.services";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (admin: Admin) => void;
  fetchAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: true,

      login: (admin) => set({ admin, isAuthenticated: true, isLoading: false }),

      fetchAdmin: async () => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get("/profile");
          set({ admin: res.data.data.admin, isAuthenticated: true, isLoading: false });
        } catch {
          set({ admin: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post("/logout");
        } catch {
          console.warn("Logout API failed");
        }
        set({ admin: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: "admin-auth",                          // localStorage key
      partialize: (state) => ({ admin: state.admin, isAuthenticated: state.isAuthenticated }),
      // ↑ only persist these two fields, not isLoading
    }
  )
);