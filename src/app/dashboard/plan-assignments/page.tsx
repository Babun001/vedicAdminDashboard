"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import axiosInstance from "@/services/admin.services";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  secondsBetween,
  getInitials,
  getAssignmentStatusColor,
} from "@/lib/utils";
import {
  Search,
  Eye,
  Clock,
  Timer,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Ban,
  RefreshCw,
  History,
  ChevronDown,
  Users,
  Wifi,
  ShieldAlert,
} from "lucide-react";
import { mapApiAssignment, type ApiAssignmentRow } from "./data";
import type { PlanAssignment, AssignmentStatus } from "./types";

// Re-render every 30s so "time taken so far" on live (pending/working) rows keeps ticking.
const LIVE_TICK_MS = 30_000;

const statusMeta: Record<AssignmentStatus, { label: string; icon: React.ElementType }> = {
  pending: { label: "Pending", icon: Clock },
  working: { label: "Working", icon: Loader2 },
  delivered: { label: "Delivered", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", icon: XCircle },
};

function isOverdue(a: PlanAssignment) {
  if (!a.assignedAt) return false;
  if (a.status !== "pending" && a.status !== "working") return false;
  const elapsedH = secondsBetween(a.assignedAt) / 3600;
  return elapsedH > a.slaHours;
}

/** Time taken to complete the task, measured from auto-assignment to delivery.
 *  For live tasks (pending/working) this is time elapsed so far. */
function timeTakenLabel(a: PlanAssignment): string {
  if (!a.assignedAt) return "—";
  if (a.status === "delivered" && a.deliveredAt) {
    return formatDuration(secondsBetween(a.assignedAt, a.deliveredAt));
  }
  if (a.status === "cancelled" && a.cancelledAt) {
    return `${formatDuration(secondsBetween(a.assignedAt, a.cancelledAt))} (cancelled)`;
  }
  if (a.status === "pending" || a.status === "working") {
    return `${formatDuration(secondsBetween(a.assignedAt))} so far`;
  }
  return "—";
}

export default function PlanAssignmentsPage() {
  const [assignments, setAssignments] = useState<PlanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PlanAssignment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchAssignments = useCallback(async () => {
    try {
      // 100 is generous for this app's volume; bump if the plan-assignments
      // table starts truncating in practice (backend already paginates —
      // see GET /api/admin/assignments — this just isn't wired to a
      // "load more" control yet).
      const res = await axiosInstance.get("/assignments", { params: { limit: 100 } });
      if (res.data.success) {
        const rows: ApiAssignmentRow[] = res.data.data.assignments ?? [];
        setAssignments(rows.map(mapApiAssignment));
      }
    } catch (error) {
      console.error("Error fetching plan assignments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Live refresh: the backend broadcasts "assignment-updated" whenever a
  // purchase gets auto-assigned, drained out of the queue, reassigned, or
  // cancelled — refetch instead of polling.
  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.addEventListener("assignment-updated", () => fetchAssignments());
    return () => es.close();
  }, [fetchAssignments]);

  // Re-render every 30s so "time taken so far" on live (pending/working) rows keeps ticking.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), LIVE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<PlanAssignment | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Feature: total / online astrologer counts for this tab's header.
  const [onlineStatus, setOnlineStatus] = useState<{ total: number; approved: number; online: number } | null>(null);
  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        const res = await axiosInstance.get("/astrologers/online-status");
        if (res.data.success) setOnlineStatus(res.data.data);
      } catch (error) {
        console.error("Error fetching online status:", error);
      }
    };
    fetchOnlineStatus();
    const id = setInterval(fetchOnlineStatus, 30_000);
    return () => clearInterval(id);
  }, []);

  // Feature: live banner when an (re)assignment attempt finds nobody
  // eligible — backend debounces the underlying email, this just reflects
  // "there is currently at least one stuck item" so admin doesn't have to
  // go looking for it.
  const [noAstrologerAlert, setNoAstrologerAlert] = useState<{ context: string; at: string } | null>(null);
  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.addEventListener("no-astrologer-available", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setNoAstrologerAlert({ context: payload.context, at: payload.at });
      } catch {
        setNoAstrologerAlert({ context: "assignment", at: new Date().toISOString() });
      }
    });
    return () => es.close();
  }, []);

  const apiTypeFor = (a: PlanAssignment): "report" | "question" =>
    a.planType === "question" ? "question" : "report";

  const handleReassign = async (a: PlanAssignment) => {
    setActingId(a._id);
    try {
      await axiosInstance.patch(`/assignments/${apiTypeFor(a)}/${a._id}/reassign`, {
        reason: "ADMIN_MANUAL",
      });
      await fetchAssignments();
      setSelected(null);
    } catch (error) {
      console.error("Error reassigning:", error);
    } finally {
      setActingId(null);
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    setActingId(cancelTarget._id);
    try {
      await axiosInstance.patch(`/assignments/${apiTypeFor(cancelTarget)}/${cancelTarget._id}/cancel`, {
        reason: cancelReason || undefined,
      });
      await fetchAssignments();
      setSelected(null);
      setCancelTarget(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error cancelling:", error);
    } finally {
      setActingId(null);
    }
  };

  const planOptions = useMemo(() => {
    const names = Array.from(new Set(assignments.map((a) => a.planName)));
    return [{ value: "all", label: "All Plans" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [assignments]);

  const summary = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === "pending").length;
    const working = assignments.filter((a) => a.status === "working").length;
    const delivered = assignments.filter((a) => a.status === "delivered").length;
    const cancelled = assignments.filter((a) => a.status === "cancelled").length;

    const completed = assignments.filter((a) => a.status === "delivered" && a.assignedAt && a.deliveredAt);
    const avgCompletionSeconds =
      completed.length === 0
        ? null
        : Math.round(
            completed.reduce((s, a) => s + secondsBetween(a.assignedAt!, a.deliveredAt), 0) / completed.length
          );

    const overdue = assignments.filter(isOverdue).length;

    return { total, pending, working, delivered, cancelled, avgCompletionSeconds, overdue };
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchSearch =
        !q ||
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        (a.astrologerName ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchPlan = planFilter === "all" || a.planName === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [assignments, search, statusFilter, planFilter]);

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">
      {/* Info strip */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-[#F5A703]" />
          Every purchased plan is auto-assigned to an available online astrologer. Track progress here.
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchAssignments();
          }}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: summary.total, icon: <Zap size={15} />, color: "text-purple-600" },
          { label: "Pending", value: summary.pending, icon: <Clock size={15} />, color: "text-yellow-600" },
          { label: "Working", value: summary.working, icon: <Loader2 size={15} />, color: "text-blue-600" },
          { label: "Delivered", value: summary.delivered, icon: <CheckCircle2 size={15} />, color: "text-green-600" },
          { label: "Cancelled", value: summary.cancelled, icon: <XCircle size={15} />, color: "text-red-500" },
          {
            label: "Avg. Completion",
            value: summary.avgCompletionSeconds !== null ? formatDuration(summary.avgCompletionSeconds) : "—",
            icon: <Timer size={15} />,
            color: "text-gray-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-sm"
          >
            <div className={card.color}>{card.icon}</div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 truncate">{card.label}</p>
              <p className="text-base font-display font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Astrologer roster snapshot — just total & online, per admin ask */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm text-xs w-fit">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users size={14} className="text-gray-400" />
          Total Astrologers: <span className="font-semibold text-gray-900">{onlineStatus?.total ?? "—"}</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5 text-gray-600">
          <Wifi size={14} className="text-green-500" />
          Online: <span className="font-semibold text-gray-900">{onlineStatus?.online ?? "—"}</span>
        </div>
      </div>

      {summary.overdue > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">
          <AlertTriangle size={14} />
          {summary.overdue} assignment{summary.overdue === 1 ? "" : "s"} past its SLA window — may need reassignment.
        </div>
      )}

      {noAstrologerAlert && (
        <div className="flex items-center justify-between gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} />
            No eligible astrologer was available for a recent {noAstrologerAlert.context === "reassignment" ? "reassignment" : "auto-assignment"} attempt — that item is sitting in the queue.
          </div>
          <button
            onClick={() => setNoAstrologerAlert(null)}
            className="text-orange-500 hover:text-orange-800 transition-colors shrink-0"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search user, astrologer…"
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
                {["User", "Plan", "Assigned Astrologer", "Assigned At", "Status", "Time Taken", "Actions"].map((h) => (
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 size={16} className="inline animate-spin mr-2" /> Loading assignments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No plan assignments found
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const meta = statusMeta[a.status];
                  const Icon = meta.icon;
                  const overdue = isOverdue(a);
                  return (
                    <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-purple-500 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{getInitials(a.userName)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{a.userName}</p>
                            <p className="text-xs text-gray-500">{a.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-xs font-medium">{a.planName}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(a.amount)}</p>
                      </td>

                      {/* Astrologer */}
                      <td className="px-4 py-3 align-top">
                        {a.astrologerName ? (
                          <>
                            <p className="text-xs text-gray-800">{a.astrologerName}</p>
                            <p className="text-[11px] text-gray-500">{a.astrologerEmail}</p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Awaiting assignment</span>
                        )}

                        {!!a.reassignmentHistory?.length && (
                          <>
                            <button
                              onClick={() =>
                                setExpandedHistoryId((prev) => (prev === a._id ? null : a._id))
                              }
                              className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 transition-colors"
                            >
                              <History size={11} />
                              Reassigned {a.reassignmentCount ?? a.reassignmentHistory.length}x
                              <ChevronDown
                                size={11}
                                className={`transition-transform ${expandedHistoryId === a._id ? "rotate-180" : ""}`}
                              />
                            </button>

                            {expandedHistoryId === a._id && (
                              <div className="mt-1.5 space-y-1.5 border-l-2 border-amber-200 pl-2 max-w-[220px]">
                                {a.reassignmentHistory.map((h, i) => (
                                  <div key={i} className="text-[10px] text-gray-500 leading-tight">
                                    <span className="text-gray-700 font-medium">
                                      {h.fromAstrologerName ?? "Unassigned"}
                                    </span>
                                    {" → "}
                                    <span className="text-gray-700 font-medium">
                                      {h.toAstrologerName ?? "Unassigned"}
                                    </span>
                                    <br />
                                    {h.reason} · {formatDateTime(h.reassignedAt)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Assigned At */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700 whitespace-nowrap">
                          {a.assignedAt ? formatDateTime(a.assignedAt) : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge className={getAssignmentStatusColor(a.status)}>
                          <Icon size={10} className={`mr-1 inline ${a.status === "working" ? "animate-spin" : ""}`} />
                          {meta.label}
                        </Badge>
                        {overdue && (
                          <span className="ml-1.5 text-[10px] text-red-600 font-medium">SLA breached</span>
                        )}
                      </td>

                      {/* Time taken */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700 whitespace-nowrap">{timeTakenLabel(a)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelected(a)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F5A703] text-black hover:bg-[#d48f02] transition-colors"
                          >
                            <Eye size={13} /> View
                          </button>
                          {(a.status === "pending" || a.status === "working") && (
                            <>
                              <button
                                onClick={() => handleReassign(a)}
                                disabled={actingId === a._id}
                                title="Reassign to another astrologer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                {actingId === a._id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={13} />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setCancelTarget(a);
                                  setCancelReason("");
                                }}
                                disabled={actingId === a._id}
                                title="Cancel this task"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <Ban size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Assignment Detail</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">User</p>
                <p className="text-gray-900 font-medium">{selected.userName}</p>
                <p className="text-gray-500 text-xs">{selected.userEmail}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Plan</p>
                <p className="text-gray-900 font-medium">{selected.planName}</p>
                <p className="text-gray-500 text-xs">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Astrologer</p>
                <p className="text-gray-900 font-medium">{selected.astrologerName ?? "Unassigned"}</p>
                <p className="text-gray-500 text-xs">{selected.astrologerEmail ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <Badge className={getAssignmentStatusColor(selected.status)}>
                  {statusMeta[selected.status].label}
                </Badge>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-5 pt-4 space-y-2.5 text-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Purchased</span>
                <span className="text-gray-900">{formatDateTime(selected.purchasedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Auto-assigned to astrologer</span>
                <span className="text-gray-900">{selected.assignedAt ? formatDateTime(selected.assignedAt) : "—"}</span>
              </div>
              {selected.startedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Astrologer started</span>
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

            <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">Time taken to complete</span>
              <span className="text-sm font-semibold text-gray-900">{timeTakenLabel(selected)}</span>
            </div>

            {(selected.status === "pending" || selected.status === "working") && (
              <div className="border-t border-gray-200 mt-4 pt-4 flex items-center gap-2">
                <button
                  onClick={() => handleReassign(selected)}
                  disabled={actingId === selected._id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {actingId === selected._id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  Reassign
                </button>
                <button
                  onClick={() => {
                    setCancelTarget(selected);
                    setCancelReason("");
                  }}
                  disabled={actingId === selected._id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Ban size={13} /> Cancel Task
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} size="sm">
        {cancelTarget && (
          <div className="bg-white p-6 rounded-2xl">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-2">Cancel this task?</h2>
            <p className="text-xs text-gray-500 mb-4">
              This pulls the {cancelTarget.planType === "question" ? "question" : "report"} out of the
              pipeline for <span className="font-medium text-gray-700">{cancelTarget.userName}</span> and
              frees up the astrologer&apos;s slot. This can&apos;t be undone.
            </p>
            <Input
              placeholder="Reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Never mind
              </button>
              <button
                onClick={submitCancel}
                disabled={actingId === cancelTarget._id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actingId === cancelTarget._id ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                Confirm Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
