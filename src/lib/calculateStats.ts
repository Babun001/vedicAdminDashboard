// lib/calculateStats.ts
import type { Customer, User, Report, DashboardStats } from "@/types/dashboard";

/** Returns items created in the given calendar month */
function inMonth<T extends { createdAt: string }>(items: T[], year: number, month: number): T[] {
  return items.filter((item) => {
    const d = new Date(item.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Safe percentage growth: ((current - prev) / prev) * 100 */
function growthPercent(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - prev) / prev) * 100).toFixed(1));
}

export function calculateStats(
  users: User[],
  customers: Customer[],
  reports: Report[]
): DashboardStats {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // Last month (handles January → December wrap)
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth();

  // ── Users ──────────────────────────────────────────────
  const totalUsers = users.length;
  const usersThisMonth = inMonth(users, thisYear, thisMonth).length;
  const usersLastMonth = inMonth(users, lastYear, lastMonth).length;
  const usersGrowth = growthPercent(usersThisMonth, usersLastMonth);

  // ── Customers ──────────────────────────────────────────
  const totalCustomers = customers.length;

  // ── Revenue ────────────────────────────────────────────
  const totalRevenue = customers.reduce((sum, c) => sum + (c.planPrice ?? 0), 0);

  const revenueThisMonth = inMonth(customers, thisYear, thisMonth).reduce(
    (sum, c) => sum + (c.planPrice ?? 0),
    0
  );
  const revenueLastMonth = inMonth(customers, lastYear, lastMonth).reduce(
    (sum, c) => sum + (c.planPrice ?? 0),
    0
  );
  const revenueGrowth = growthPercent(revenueThisMonth, revenueLastMonth);

  // ── Reports ────────────────────────────────────────────
  const totalReports = reports.length;
  const reportsThisMonth = inMonth(reports, thisYear, thisMonth).length;

  // ── Active subscriptions = paid customers ──────────────
  const activeSubscriptions = customers.filter((c) => c.paymentStatus === "paid").length;

  return {
    totalUsers,
    totalCustomers,
    totalRevenue,
    totalReports,
    usersGrowth,
    revenueGrowth,
    reportsThisMonth,
    activeSubscriptions,
  };
}