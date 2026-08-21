"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDateTime, getAssignmentStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Users, ShoppingBag, IndianRupee, FileText,
  TrendingUp, Sparkles
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUsersStore } from "@/store/useUsersStore";
import axiosInstance from "@/services/admin.services";
import { calculateStats } from "@/lib/calculateStats";
import { mapApiAssignment, type ApiAssignmentRow } from "./plan-assignments/data";
import type { PlanAssignment } from "./plan-assignments/types";

const PIE_COLORS = ["#6d28d9", "#f59e0b", "#10b981", "#0ea5e9", "#ec4899", "#84cc16"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gold-400">
        {formatCurrency(payload[0].value)}
      </p>
      {payload[1] && (
        <p className="text-xs text-cosmos-300">{payload[1].value} orders</p>
      )}
    </div>
  );
};

/** Is this order a "report" (subscription/report plan) vs a "question" plan?
 *  Matches the exact convention used on the Plan Assignments tab. */
function isReportOrder(a: PlanAssignment) {
  return a.planType !== "question";
}

/** Last 7 calendar months (oldest → newest), each with total revenue + order
 *  count from real assignment data. Replaces the old hardcoded Jan–Jul array. */
function buildMonthlyRevenue(assignments: PlanAssignment[]) {
  const now = new Date();
  const buckets: { key: string; month: string; revenue: number; orders: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      revenue: 0,
      orders: 0,
    });
  }

  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const a of assignments) {
    if (!a.purchasedAt) continue;
    const d = new Date(a.purchasedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.revenue += a.amount ?? 0;
      bucket.orders += 1;
    }
  }

  return buckets;
}

/** Order count per plan name, for the pie chart. Replaces the old
 *  hardcoded Free/Modern/Premium array (those plan names don't even
 *  exist in this app's real plans). */
function buildPlanDistribution(assignments: PlanAssignment[]) {
  const counts = new Map<string, number>();
  for (const a of assignments) {
    counts.set(a.planName, (counts.get(a.planName) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
    .sort((a, b) => b.value - a.value);
}

export default function DashboardPage() {
  const { users, fetchUsers } = useUsersStore();
  const { admin: user } = useAuthStore((state) => ({
    admin: state.admin,
    fetchAdmin: state.fetchAdmin,
    logout: state.logout,
  }));

  const [assignments, setAssignments] = useState<PlanAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Same endpoint the Plan Assignments tab uses — it already merges
  // Reports + Questions into one real, unified order feed, which makes it
  // the right single source of truth for "orders" everywhere on Overview
  // (previously this page used the leads-only SSE `customers` stream for
  // revenue/orders, and pure hardcoded arrays for the charts).
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/assignments", { params: { limit: 500 } });
      if (res.data.success) {
        const rows: ApiAssignmentRow[] = res.data.data.assignments ?? [];
        setAssignments(rows.map(mapApiAssignment));
      }
    } catch (error) {
      console.error("Error fetching assignments for overview:", error);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Live refresh on the same backend event the Plan Assignments tab listens
  // for, so Overview numbers update the moment an order comes in, gets
  // reassigned, delivered, or cancelled — no polling, no stale numbers.
  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.addEventListener("assignment-updated", () => fetchAssignments());
    return () => es.close();
  }, [fetchAssignments]);

  // ── Real computed stats (all derived from live data — nothing mocked) ──
  const totalRevenue = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.amount ?? 0), 0),
    [assignments]
  );

  const reportOrders = useMemo(() => assignments.filter(isReportOrder), [assignments]);

  const revenueGrowth = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    const inMonth = (items: PlanAssignment[], y: number, m: number) =>
      items.filter((a) => {
        if (!a.purchasedAt) return false;
        const d = new Date(a.purchasedAt);
        return d.getFullYear() === y && d.getMonth() === m;
      });

    const revThis = inMonth(assignments, thisYear, thisMonth).reduce((s, a) => s + (a.amount ?? 0), 0);
    const revLast = inMonth(assignments, lastYear, lastMonth).reduce((s, a) => s + (a.amount ?? 0), 0);
    return revLast === 0 ? (revThis > 0 ? 100 : 0) : parseFloat((((revThis - revLast) / revLast) * 100).toFixed(1));
  }, [assignments]);

  // usersGrowth reuses the same tested month-over-month logic already used
  // elsewhere in the app — just fed with the real users list this time
  // (the old useDashboardStats() version always read 0 here because
  // nothing ever called that store's setUsers()).
  const usersGrowth = useMemo(() => calculateStats(users, [], []).usersGrowth, [users]);

  const revenueChartData = useMemo(() => buildMonthlyRevenue(assignments), [assignments]);
  const planDistributionData = useMemo(() => buildPlanDistribution(assignments), [assignments]);

  const recentTransactions = useMemo(
    () =>
      [...assignments]
        .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
        .slice(0, 5),
    [assignments]
  );

  const recentReports = useMemo(
    () =>
      [...reportOrders]
        .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
        .slice(0, 4),
    [reportOrders]
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease]">

      {/* Welcome banner */}
      <div className="relative bg-white border border-gray-200 rounded-2xl px-6 py-5 overflow-hidden shadow-sm">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-200 text-8xl font-display select-none pointer-events-none">☉</div>
        <p className="text-xs text-[#DFAF07] font-body tracking-widest uppercase mb-1">
          Namaste, {user?.name || "Admin"}
        </p>
        <h2 className="text-2xl font-display font-bold text-gray-900">
          Welcome to Vedic Remedies Portal
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your astrology practice today.
        </p>
      </div>

      {/* Stats Grid — all real, live values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.length}
          change={usersGrowth}
          icon={<Users size={18} />}
          accent="cosmos"
        />
        <StatCard
          title="Total Orders"
          value={loadingAssignments ? "…" : assignments.length}
          icon={<ShoppingBag size={18} />}
          accent="jade"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={revenueGrowth}
          icon={<IndianRupee size={18} />}
          accent="gold"
        />
        <StatCard
          title="Reports Created"
          value={loadingAssignments ? "…" : reportOrders.length}
          icon={<FileText size={18} />}
          accent="ember"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-500">Last 7 months</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <TrendingUp size={11} />
              {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth}%
            </span>
          </div>

          {assignments.length === 0 && !loadingAssignments ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-1">Plan Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">
            All orders · {assignments.length} total
          </p>

          {planDistributionData.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-sm text-gray-400">
              No orders yet
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <PieChart width={160} height={160}>
                  <Pie
                    data={planDistributionData}
                    cx={75} cy={75}
                    innerRadius={45} outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              <div className="space-y-2 mt-2">
                {planDistributionData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 truncate">{d.name}</span>
                    </div>
                    <span className="text-gray-900 font-medium shrink-0 ml-2">{d.value} orders</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions + Reports */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Recent Transactions — from real assignment/order data */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={15} className="text-yellow-500" />
            Recent Transactions
          </h3>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {loadingAssignments ? "Loading…" : "No transactions yet"}
              </p>
            ) : (
              recentTransactions.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{a.userName}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(a.purchasedAt)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-yellow-600">
                      {formatCurrency(a.amount)}
                    </p>
                    <Badge className={getAssignmentStatusColor(a.status)}>{a.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reports — from real report-type orders */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-purple-500" />
            Recent Reports
          </h3>

          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {loadingAssignments ? "Loading…" : "No reports yet"}
              </p>
            ) : (
              recentReports.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{r.planName}</p>
                    <p className="text-xs text-gray-500 truncate">{r.userName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge className={getAssignmentStatusColor(r.status)}>{r.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
