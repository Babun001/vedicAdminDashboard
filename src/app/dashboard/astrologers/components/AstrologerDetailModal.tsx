"use client";

import { X, Mail, Phone, Briefcase, Sparkles, Languages, FileText, Star, IndianRupee, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Astrologer } from "@/types";

interface AstrologerDetailModalProps {
  astrologer: Astrologer | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const approvalBadge = (status: string) => {
  if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

export default function AstrologerDetailModal({ astrologer, onClose, onApprove, onReject }: AstrologerDetailModalProps) {
  if (!astrologer) return null;

  const a = astrologer;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" style={{ marginTop: 0 }}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {(a.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{a.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={approvalBadge(a.approvalStatus)}>{a.approvalStatus}</Badge>
                {a.isOnline && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1" />
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition shrink-0">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Contact */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{a.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{a.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Background</p>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <Briefcase size={14} className="text-gray-400 shrink-0" />
              {a.experience ?? 0} year{a.experience === 1 ? "" : "s"} of experience
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700 mb-2">
              <Sparkles size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>{a.expertise?.length ? a.expertise.join(", ") : "No expertise listed"}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Languages size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>{a.languages?.length ? a.languages.join(", ") : "No languages listed"}</span>
            </div>
          </div>

          {/* Description */}
          {a.bio && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{a.bio}</p>
            </div>
          )}

          {/* Rates */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <IndianRupee size={12} /> Declared Rates
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Row label="Per Report" value={a.reportRate != null ? `₹${a.reportRate}` : "—"} />
              <Row label="1 Question" value={a.questionRate1 != null ? `₹${a.questionRate1}` : "—"} />
              <Row label="2 Questions" value={a.questionRate2 != null ? `₹${a.questionRate2}` : "—"} />
              <Row label="3 Questions" value={a.questionRate3 != null ? `₹${a.questionRate3}` : "—"} />
            </div>
          </div>

          {/* Performance — only meaningful once approved and working */}
          {a.approvalStatus === "approved" && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Activity size={12} /> Performance
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Row
                  label="Rating"
                  value={
                    a.totalRatings ? (
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="text-[#F5A703] fill-[#F5A703]" />
                        {a.avgRating?.toFixed(1)} ({a.totalRatings})
                      </span>
                    ) : (
                      "No ratings yet"
                    )
                  }
                />
                <Row label="Efficacy Score" value={a.efficacyScore ?? "—"} />
                <Row label="Reports Delivered" value={`${a.totalReportsDelivered ?? 0} / ${a.totalReportsAssigned ?? 0}`} />
                <Row label="Questions Answered" value={`${a.totalQuestionsAnswered ?? 0} / ${a.totalQuestionsAssigned ?? 0}`} />
              </div>
            </div>
          )}

          {/* Activity */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Clock size={12} /> Activity
            </p>
            <Row label="Applied" value={a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"} />
            <Row label="Last Login" value={a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"} />
            {a.rejectionReason && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Rejection reason: {a.rejectionReason}
              </div>
            )}
          </div>
        </div>

        {/* Footer — quick decision for pending applicants */}
        {a.approvalStatus === "pending" && (onApprove || onReject) && (
          <div className="border-t border-gray-100 p-5 flex justify-end gap-3 shrink-0">
            {onReject && (
              <button
                onClick={onReject}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Reject
              </button>
            )}
            {onApprove && (
              <button
                onClick={onApprove}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F5A703] text-black hover:bg-[#d48f02] transition-colors"
              >
                Allow
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
