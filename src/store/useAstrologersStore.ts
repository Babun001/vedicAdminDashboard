import { create } from "zustand";
import axiosInstance from "@/services/admin.services";
import type { Astrologer, ApprovalStatus } from "@/types";

interface AstrologersStore {
  astrologers: Astrologer[];
  loading: boolean;
  actionLoadingId: string | null;
  onlineStatus: { total: number; approved: number; online: number; onlineAstrologers: Astrologer[] } | null;
  onlineStatusLoading: boolean;
  fetchAstrologers: (approvalStatus?: ApprovalStatus | "all") => Promise<void>;
  fetchOnlineStatus: () => Promise<void>;
  approveAstrologer: (id: string) => Promise<void>;
  rejectAstrologer: (id: string) => Promise<void>;
  activateAstrologer: (id: string) => Promise<void>;
  deactivateAstrologer: (id: string) => Promise<void>;
}

export const useAstrologersStore = create<AstrologersStore>((set, get) => ({
  astrologers: [],
  loading: false,
  actionLoadingId: null,
  onlineStatus: null,
  onlineStatusLoading: false,

  fetchAstrologers: async (approvalStatus = "all") => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/astrologers", {
        params: {
          ...(approvalStatus !== "all" && { approvalStatus }),
          page: 1,
          limit: 100,
        },
      });
      if (res.data.success) {
        // handles either { data: { astrologers: [...] } } or { data: [...] }
        set({ astrologers: res.data.data.astrologers ?? res.data.data ?? [] });
      }
    } catch (error) {
      console.error("Error fetching astrologers:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchOnlineStatus: async () => {
    set({ onlineStatusLoading: true });
    try {
      const res = await axiosInstance.get("/astrologers/online-status");
      if (res.data.success) {
        set({ onlineStatus: res.data.data });
      }
    } catch (error) {
      console.error("Error fetching online status:", error);
    } finally {
      set({ onlineStatusLoading: false });
    }
  },

  approveAstrologer: async (id) => {
    set({ actionLoadingId: id });
    try {
      await axiosInstance.patch(`/astrologers/${id}/approve`);
      set((state) => ({
        astrologers: state.astrologers.map((a) =>
          a._id === id ? { ...a, approvalStatus: "approved" as const, isActive: true } : a
        ),
      }));
    } catch (error) {
      console.error("Error approving astrologer:", error);
      throw error;
    } finally {
      set({ actionLoadingId: null });
    }
  },

  rejectAstrologer: async (id) => {
    set({ actionLoadingId: id });
    try {
      await axiosInstance.patch(`/astrologers/${id}/reject`);
      set((state) => ({
        astrologers: state.astrologers.map((a) =>
          a._id === id ? { ...a, approvalStatus: "rejected" as const, isActive: false } : a
        ),
      }));
    } catch (error) {
      console.error("Error rejecting astrologer:", error);
      throw error;
    } finally {
      set({ actionLoadingId: null });
    }
  },

  activateAstrologer: async (id) => {
    set({ actionLoadingId: id });
    try {
      // NOTE: backend only exposes PATCH /astrologers/:id/active-state
      // with { isActive } in the body — there's no separate /activate
      // route. Fixed here (was previously calling a route that doesn't
      // exist on the backend).
      await axiosInstance.patch(`/astrologers/${id}/active-state`, { isActive: true });
      set((state) => ({
        astrologers: state.astrologers.map((a) =>
          a._id === id ? { ...a, isActive: true } : a
        ),
      }));
    } catch (error) {
      console.error("Error activating astrologer:", error);
      throw error;
    } finally {
      set({ actionLoadingId: null });
    }
  },

  deactivateAstrologer: async (id) => {
    set({ actionLoadingId: id });
    try {
      await axiosInstance.patch(`/astrologers/${id}/active-state`, { isActive: false });
      set((state) => ({
        astrologers: state.astrologers.map((a) =>
          a._id === id ? { ...a, isActive: false } : a
        ),
      }));
    } catch (error) {
      console.error("Error deactivating astrologer:", error);
      throw error;
    } finally {
      set({ actionLoadingId: null });
    }
  },
}));