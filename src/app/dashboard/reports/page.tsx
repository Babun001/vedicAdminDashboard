"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import axiosInstance from "@/services/admin.services";
import { formatDateTime, getInitials } from "@/lib/utils";
import { FileText, Eye, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";

interface PendingReviewReport {
  _id: string;
  status: string;
  planName?: string;
  concern?: string;
  cdnUrl?: string;
  submittedAt?: string;
  dueAt?: string;
  astrologerId?: { _id: string; name: string; email: string } | null;
  leadId?: { _id: string; fullName: string; concern: string } | null;
  adminReview: { status: string; reviewNote?: string | null };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PendingReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingReviewReport | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/reports/pending-review");
      if (res.data.success) {
        setReports(res.data.data.reports ?? []);
      }
    } catch (error) {
      console.error("Error fetching pending-review reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const streamUrl = `${axiosInstance.defaults.baseURL}/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });

    es.addEventListener("report-pending-review", () => {
      fetchReports();
    });

    return () => es.close();
  }, []);

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      await axiosInstance.patch(`/reports/${id}/review`, { action: "approve" });
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Error approving report:", error);
    } finally {
      setActingId(null);
    }
  };

  const openReject = (report: PendingReviewReport) => {
    setRejectTarget(report);
    setRejectNote("");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    setActingId(rejectTarget._id);
    try {
      await axiosInstance.patch(`/reports/${rejectTarget._id}/review`, {
        action: "reject",
        note: rejectNote.trim() || undefined,
      });
      setReports((prev) => prev.filter((r) => r._id !== rejectTarget._id));
      setRejectTarget(null);
    } catch (error) {
      console.error("Error rejecting report:", error);
    } finally {
      setActingId(null);
    }
  };

  return (

    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-600" />
          <span className="text-gray-500 text-sm">
            {reports.length} report{reports.length === 1 ? "" : "s"} awaiting review
          </span>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-16 text-gray-400">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400">
            No reports currently awaiting review
          </div>
        ) : (
          reports.map((report) => {
            const isBusy = actingId === report._id;
            return (
              <div
                key={report._id}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                    <Clock size={11} className="mr-1 inline" /> Pending Review
                  </Badge>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {report.submittedAt ? formatDateTime(report.submittedAt) : "—"}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-gray-900 text-base mb-2">
                  {report.leadId?.fullName || "Unknown Client"} — {report.planName || report.leadId?.concern || "Report"}
                </h3>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">
                      {getInitials(report.astrologerId?.name || "?")}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-700">
                      {report.astrologerId?.name || "Unassigned"}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {report.astrologerId?.email || ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  {report.cdnUrl && (
                    <a
                      href={report.cdnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cr-btn"
                    >
                      <Button size="sm" variant="secondary">
                        <Eye size={13} /> View PDF
                      </Button>
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="gold"
                    disabled={isBusy}
                    onClick={() => handleApprove(report._id)}
                  >
                    <CheckCircle2 size={13} /> Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    disabled={isBusy}
                    onClick={() => openReject(report)}
                  >
                    <XCircle size={13} /> Reject
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Send back for revision"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            This report will go back to {rejectTarget?.astrologerId?.name || "the astrologer"} as
            "Processing," with a fresh SLA window. Let them know what to fix.
          </p>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px]"
            placeholder="What needs to change?"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitReject} disabled={actingId === rejectTarget?._id}>
              <RotateCcw size={14} /> Send Back
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
}