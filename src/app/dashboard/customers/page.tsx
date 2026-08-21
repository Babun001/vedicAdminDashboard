"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { formatCurrency, formatDateTime, getAssignmentStatusColor, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import axiosInstance from "@/services/admin.services";
import { mapApiAssignment, type ApiAssignmentRow } from "../plan-assignments/data";
import type { PlanAssignment, AssignmentStatus } from "../plan-assignments/types";
import { Search, Eye, ShoppingBag, IndianRupee, Clock, RefreshCw, XCircle } from "lucide-react";

// Orders tab = full history of every purchased plan (report OR question),
// regardless of where it is in its lifecycle. This intentionally uses the
// same /api/admin/assignments endpoint as the Plan Assignments tab — it's
// the only endpoint that actually merges both order types — rather than
// the old leads-only SSE stream, which only ever covered pre-assignment
// report leads and caused the whole page to go blank on any SSE hiccup
// (a transient "error" event set a page-level error that hid the table
// entirely, even though the underlying data was fine).
export default function OrdersPage() {
  const [assignments, setAssignments] = useState<PlanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<PlanAssignment | null>(null);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all");

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/assignments", { params: { limit: 500 } });
      if (res.data.success) {
        const rows: ApiAssignmentRow[] = res.data.data.assignments ?? [];
        setAssignments(rows.map(mapApiAssignment));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Live updates, same event the Plan Assignments tab listens for. Unlike
  // the old useSSE() hook, a connection hiccup here only flips the little
  // status dot below — it never hides the table or the data already on
  // screen.
  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("assignment-updated", () => fetchAssignments());
    return () => es.close();
  }, [fetchAssignments]);

  const totalRevenue = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.amount ?? 0), 0),
    [assignments]
  );
  const pendingCount = useMemo(
    () => assignments.filter((a) => a.status === "pending" || a.status === "working").length,
    [assignments]
  );

  const planOptions = useMemo(() => {
    const names = Array.from(new Set(assignments.map((a) => a.planName)));
    return [{ value: "all", label: "All Plans" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchSearch =
        !q ||
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q);
      const matchPlan = planFilter === "all" || a.planName === planFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [assignments, search, planFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading orders…
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      {/* Live indicator — never hides the page anymore, just reflects status */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
          {connected ? "Live — updates in real time" : "Reconnecting…"}
        </div>
        <button
          onClick={() => { setLoading(true); fetchAssignments(); }}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: assignments.length, icon: <ShoppingBag size={16} />, color: "text-purple-600" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: <IndianRupee size={16} />, color: "text-yellow-600" },
          { label: "In Progress", value: pendingCount, icon: <Clock size={16} />, color: "text-green-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className={card.color}>{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-display font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search name, email…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={planOptions}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Customer", "Plan", "Type", "Amount", "Astrologer", "Purchased", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-purple-500 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">
                            {getInitials(a.userName)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.userName}</p>
                          <p className="text-xs text-gray-500">{a.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-xs">{a.planName}</span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <Badge className={a.planType === "question" ? "text-cosmos-300 bg-cosmos-500/10 border-cosmos-400/30" : "text-gold-400 bg-gold-400/10 border-gold-400/30"}>
                        {a.planType === "question" ? "Question" : "Report"}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <span className="text-yellow-600 font-medium">
                        {formatCurrency(a.amount)}
                      </span>
                    </td>

                    {/* Astrologer */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700">{a.astrologerName ?? "Unassigned"}</span>
                    </td>

                    {/* Purchased */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{formatDateTime(a.purchasedAt)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge className={getAssignmentStatusColor(a.status)}>
                        {a.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-[#F5A703] text-black hover:bg-[#d48f02] transition-colors"
                        onClick={() => setSelected(a)}
                      >
                        <Eye size={13} /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} size="md">
        {selected && (
          <div className="relative bg-white p-6 rounded-2xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <XCircle size={18} />
            </button>

            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Order Detail</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-gray-900 font-medium">{selected.userName}</p>
                <p className="text-gray-500 text-xs">{selected.userEmail}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Plan</p>
                <p className="text-gray-900 font-medium">{selected.planName}</p>
                <p className="text-gray-500 text-xs">{formatCurrency(selected.amount)} · {selected.planType === "question" ? "Question" : "Report"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Astrologer</p>
                <p className="text-gray-900 font-medium">{selected.astrologerName ?? "Unassigned"}</p>
                <p className="text-gray-500 text-xs">{selected.astrologerEmail ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <Badge className={getAssignmentStatusColor(selected.status)}>{selected.status}</Badge>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-5 pt-4 space-y-2.5 text-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Purchased</span>
                <span className="text-gray-900">{formatDateTime(selected.purchasedAt)}</span>
              </div>
              {selected.assignedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Assigned</span>
                  <span className="text-gray-900">{formatDateTime(selected.assignedAt)}</span>
                </div>
              )}
              {selected.startedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Started</span>
                  <span className="text-gray-900">{formatDateTime(selected.startedAt)}</span>
                </div>
              )}
              {selected.deliveredAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Delivered</span>
                  <span className="text-gray-900">{formatDateTime(selected.deliveredAt)}</span>
                </div>
              )}
              {selected.cancelledAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Cancelled</span>
                  <span className="text-gray-900">{formatDateTime(selected.cancelledAt)}</span>
                </div>
              )}
              {selected.cancelReason && (
                <p className="text-xs text-red-500 pt-1">Reason: {selected.cancelReason}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
