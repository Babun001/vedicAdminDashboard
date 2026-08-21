"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { formatCurrency, formatDateTime, getAssignmentStatusColor, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import axiosInstance from "@/services/admin.services";
import { mapApiAssignment, type ApiAssignmentRow } from "../plan-assignments/data";
import type { PlanAssignment, AssignmentStatus } from "../plan-assignments/types";
import { Search, CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

// This app doesn't have a separate "transactions" collection — every
// purchase IS an assignment record (see plan-assignments/data.ts), so
// /api/admin/assignments is the real source of transaction history. The
// old version of this page read exclusively from mockTransactions, which
// is an empty hardcoded array — hence "totally empty" regardless of how
// many real purchases existed.
export default function TransactionsPage() {
  const [assignments, setAssignments] = useState<PlanAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "report" | "question">("all");

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/assignments", { params: { limit: 500 } });
      if (res.data.success) {
        const rows: ApiAssignmentRow[] = res.data.data.assignments ?? [];
        setAssignments(rows.map(mapApiAssignment));
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.addEventListener("assignment-updated", () => fetchAssignments());
    return () => es.close();
  }, [fetchAssignments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchSearch =
        !q ||
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        a._id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchType = typeFilter === "all" || (typeFilter === "question" ? a.planType === "question" : a.planType !== "question");
      return matchSearch && matchStatus && matchType;
    });
  }, [assignments, search, statusFilter, typeFilter]);

  const totalRevenue = useMemo(
    () => filtered.reduce((s, a) => s + (a.amount ?? 0), 0),
    [filtered]
  );

  const summaryCards = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: <CreditCard size={16} />, color: "text-yellow-600" },
    { label: "Delivered", value: filtered.filter((a) => a.status === "delivered").length, icon: <CheckCircle size={16} />, color: "text-green-600" },
    { label: "In Progress", value: filtered.filter((a) => a.status === "pending" || a.status === "working").length, icon: <Clock size={16} />, color: "text-yellow-600" },
    { label: "Cancelled", value: filtered.filter((a) => a.status === "cancelled").length, icon: <XCircle size={16} />, color: "text-red-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading transactions…
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      <div className="flex items-center justify-end">
        <button
          onClick={() => { setLoading(true); fetchAssignments(); }}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <span className={c.color}>{c.icon}</span>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {c.label}
              </p>
              <p className="text-lg font-display font-bold text-gray-900">
                {c.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search name, email, order id…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "working", label: "Working" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | AssignmentStatus)}
          />

          <Select
            options={[
              { value: "all", label: "All Types" },
              { value: "report", label: "Report" },
              { value: "question", label: "Question" },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "report" | "question")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Transaction", "User", "Plan", "Amount", "Type", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Transaction */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-purple-600">
                        {a._id}
                      </p>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-purple-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{getInitials(a.userName)}</span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{a.userName}</p>
                          <p className="text-xs text-gray-500">{a.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700">{a.planName}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          a.amount > 0
                            ? "text-yellow-600 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {a.amount > 0 ? formatCurrency(a.amount) : "Free"}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <Badge className={a.planType === "question" ? "text-cosmos-300 bg-cosmos-500/10 border-cosmos-400/30" : "text-gold-400 bg-gold-400/10 border-gold-400/30"}>
                        {a.planType === "question" ? "Question" : "Report"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge className={getAssignmentStatusColor(a.status)}>
                        {a.status}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-gray-500">
                        {formatDateTime(a.purchasedAt)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
