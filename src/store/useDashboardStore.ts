// store/useDashboardStore.ts
import { create } from "zustand";
import { calculateStats } from "@/lib/calculateStats";
import type { Customer, User, Report, DashboardStats } from "@/types/dashboard";

interface DashboardStore {
  // ── Raw data ──────────────────────────────────────────
  users: User[];
  customers: Customer[];
  reports: Report[];

  // ── Setters (call these when SSE / fetch data arrives) ─
  setUsers: (users: User[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setReports: (reports: Report[]) => void;

  // ── Computed stats (derived on every set) ─────────────
  stats: DashboardStats;
}

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalCustomers: 0,
  totalRevenue: 0,
  totalReports: 0,
  usersGrowth: 0,
  revenueGrowth: 0,
  reportsThisMonth: 0,
  activeSubscriptions: 0,
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  users: [],
  customers: [],
  reports: [],
  stats: EMPTY_STATS,

  setUsers: (users) => {
    const { customers, reports } = get();
    set({ users, stats: calculateStats(users, customers, reports) });
  },

  setCustomers: (customers) => {
    const { users, reports } = get();
    set({ customers, stats: calculateStats(users, customers, reports) });
  },

  setReports: (reports) => {
    const { users, customers } = get();
    set({ reports, stats: calculateStats(users, customers, reports) });
  },
}));

// ── Selector hooks (use these to avoid re-renders) ───────────────────────────

/** Full stats object */
export const useDashboardStats = () => useDashboardStore((s) => s.stats);

/** Individual stat values */
export const useTotalRevenue       = () => useDashboardStore((s) => s.stats.totalRevenue);
export const useTotalCustomers     = () => useDashboardStore((s) => s.stats.totalCustomers);
export const useTotalUsers         = () => useDashboardStore((s) => s.stats.totalUsers);
export const useTotalReports       = () => useDashboardStore((s) => s.stats.totalReports);
export const useRevenueGrowth      = () => useDashboardStore((s) => s.stats.revenueGrowth);
export const useUsersGrowth        = () => useDashboardStore((s) => s.stats.usersGrowth);
export const useReportsThisMonth   = () => useDashboardStore((s) => s.stats.reportsThisMonth);
export const useActiveSubscriptions = () => useDashboardStore((s) => s.stats.activeSubscriptions);