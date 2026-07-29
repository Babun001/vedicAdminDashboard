import { create } from "zustand";
import axiosInstance from "@/services/admin.services";
import type { Astrologer, ApprovalStatus } from "@/types";

interface AstrologersStore {
  astrologers: Astrologer[];
  loading: boolean;
  actionLoadingId: string | null;
  fetchAstrologers: (approvalStatus?: ApprovalStatus | "all") => Promise<void>;
  approveAstrologer: (id: string) => Promise<void>;
  rejectAstrologer: (id: string) => Promise<void>;
  activateAstrologer: (id: string) => Promise<void>;
  deactivateAstrologer: (id: string) => Promise<void>;
}

export const useAstrologersStore = create<AstrologersStore>((set, get) => ({
  astrologers: [],
  loading: false,
  actionLoadingId: null,

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
      await axiosInstance.patch(`/astrologers/${id}/activate`);
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
      await axiosInstance.patch(`/astrologers/${id}/deactivate`);
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