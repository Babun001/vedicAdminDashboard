import { create } from "zustand";
// const res = await axiosInstanceClient.get("/admin/get-all-users");
import axiosInstanceClient from "@/services/client.services";

// ─── Type ───────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  isGoogleAccount: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  refreshToken?: string;
  currentCountry?: string;
  dob?: string;
  gender?: string;
  pobCity?: string;
  pobCountry?: string;
  tob?: string;
  phone?: string;
}

// ─── Store ──────────────────────────────────────────────────────────────────
interface UsersStore {
  users: User[];
  loading: boolean;
  fetched: boolean;
  fetchUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;  // force re-fetch
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  loading: false,
  fetched: false,

  fetchUsers: async () => {
    if (get().fetched || get().loading) return; // skip if already fetched
    set({ loading: true });
    try {
      const res = await axiosInstanceClient.get("/admin/get-all-users");
      if (res.data.success) {
        set({ users: res.data.data.users, fetched: true });
      } else {
        console.error("Failed to fetch users:", res.data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Call this after adding/editing/deleting a user
  refreshUsers: async () => {
    set({ fetched: false, loading: true });
    try {
      const res = await axiosInstanceClient.get("/admin/get-all-users");
      if (res.data.success) {
        set({ users: res.data.data.users, fetched: true });
      } else {
        console.error("Failed to refresh users:", res.data.message);
      }
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Handy selectors — no extra API call
  getUserById: (id) => get().users.find((u) => u._id === id),
  getUserByEmail: (email) => get().users.find((u) => u.email === email),
}));