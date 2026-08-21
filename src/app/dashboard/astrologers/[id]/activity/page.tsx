"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/services/admin.services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Star, Clock, FileText, RotateCcw, TrendingUp, CheckCircle2,
    IndianRupee, HelpCircle, Receipt,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
// import SettlePayoutModal from "../../components/SettlePayoutModal";
import SettlePayoutModal from "../../components/SettlePayoutModal";

interface SessionsData {
    sessions: any[];
    totalSecondsToday: number;
    totalSecondsThisWeek: number;
}

interface EfficiencyData {
    efficacyScore: number;
    totalReportsAssigned: number;
    totalReportsDelivered: number;
    totalReportsReassignedAway: number;
    avgRating: number;
    totalRatings: number;
    recentReassignments: any[];
}

interface ReportsData {
    reports: any[];
    total: number;
    stats: { deliveredCount: number; onTimeRate: number | null; rejectionRate: number };
}

interface PayoutDetail {
    astrologer: { _id: string; name: string; perAnswerRate: number; totalQuestionsAnswered: number };
    currency: string;
    unpaid: {
        count: number;
        amount: number;
        questions: { _id: string; questionText: string; answeredAt: string; payoutRate: number }[];
    };
    paid: { count: number; amount: number };
    batches: {
        _id: string;
        totalAmount: number;
        questionCount: number;
        paidAt: string;
        paymentReference?: string;
        note?: string;
        paidBy?: { name?: string; email?: string };
    }[];
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0 && m === 0) return "< 1m";
    return `${h > 0 ? `${h}h ` : ""}${m}m`;
};

export default function AstrologerActivityPage() {
    const { id } = useParams();
    const router = useRouter();

    const [sessions, setSessions] = useState<SessionsData | null>(null);
    const [efficiency, setEfficiency] = useState<EfficiencyData | null>(null);
    const [reportsData, setReportsData] = useState<ReportsData | null>(null);
    const [payout, setPayout] = useState<PayoutDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [payoutError, setPayoutError] = useState<string | null>(null);

    const [settleModalOpen, setSettleModalOpen] = useState(false);
    const [settling, setSettling] = useState(false);

    const fetchPayout = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/payouts/astrologer/${id}`);
            setPayout(res.data.data);
            setPayoutError(null);
        } catch (error) {
            console.error("Error fetching astrologer payout:", error);
            setPayoutError("Couldn't load payout data.");
        }
    }, [id]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [sessionsRes, efficiencyRes, reportsRes] = await Promise.all([
                    axiosInstance.get(`/astrologers/${id}/sessions`),
                    axiosInstance.get(`/astrologers/${id}/efficiency`),
                    axiosInstance.get(`/astrologers/${id}/reports`),
                    fetchPayout(),
                ]);
                setSessions(sessionsRes.data.data);
                setEfficiency(efficiencyRes.data.data);
                setReportsData(reportsRes.data.data);
            } catch (error) {
                console.error("Error fetching astrologer activity:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id, fetchPayout]);

    const handleSettle = async (paymentReference: string, note: string) => {
        setSettling(true);
        try {
            await axiosInstance.post("/payouts/settle", {
                astrologerId: id,
                ...(paymentReference && { paymentReference }),
                ...(note && { note }),
            });
            await fetchPayout();
            setSettleModalOpen(false);
        } catch (error: any) {
            console.error("Error settling payout:", error);
            setPayoutError(error?.response?.data?.message || "Failed to settle payout.");
        } finally {
            setSettling(false);
        }
    };

    const reviewBadge = (report: any) => {
        if (report.adminReview?.status === "approved")
            return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
        if (report.adminReview?.status === "rejected")
            return <Badge className="bg-red-100 text-red-700 border-red-200">Revision requested</Badge>;
        if (report.adminReview?.status === "pending_review")
            return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Awaiting review</Badge>;
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{report.status}</Badge>;
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading activity…</div>;
    if (!efficiency || !sessions || !reportsData)
        return <div className="p-10 text-center text-gray-400">Could not load activity data</div>;

    return (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease]">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
                <ArrowLeft size={14} /> Back
            </button>

            {/* Ratings + efficiency + reassignment */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                        <Star size={16} className="text-yellow-500" />
                        {efficiency.totalRatings > 0 ? efficiency.avgRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{efficiency.totalRatings} ratings</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">{efficiency.efficacyScore}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Efficacy score</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <p className={`text-2xl font-bold ${reportsData.stats.rejectionRate > 20 ? "text-red-600" : "text-gray-900"}`}>
                        {reportsData.stats.rejectionRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Revision rate</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <p className={`text-2xl font-bold ${efficiency.totalReportsReassignedAway > 0 ? "text-yellow-600" : "text-gray-900"}`}>
                        {efficiency.totalReportsReassignedAway}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Reassigned away</p>
                </div>
            </div>

            {/* Timing / sessions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-medium text-sm">
                    <Clock size={15} /> Working Time
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{formatDuration(sessions.totalSecondsToday)}</p>
                        <p className="text-xs text-gray-500">Logged in today</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{formatDuration(sessions.totalSecondsThisWeek)}</p>
                        <p className="text-xs text-gray-500">Logged in this week</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">
                            {reportsData.stats.onTimeRate !== null ? `${reportsData.stats.onTimeRate}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-500">On-time delivery</p>
                    </div>
                </div>
            </div>

            {/* Payout / Earnings */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                        <IndianRupee size={15} /> Payout
                    </div>
                    {payout && payout.unpaid.amount > 0 && (
                        <Button size="sm" variant="gold" onClick={() => setSettleModalOpen(true)}>
                            <IndianRupee size={13} /> Mark as Paid
                        </Button>
                    )}
                </div>

                {payoutError && (
                    <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                        {payoutError}
                    </div>
                )}

                {!payout ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Loading payout data…</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(payout.paid.amount + payout.unpaid.amount)}
                                </p>
                                <p className="text-xs text-gray-500">Total earned</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-green-700">{formatCurrency(payout.paid.amount)}</p>
                                <p className="text-xs text-gray-500">Paid ({payout.paid.count})</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl font-bold ${payout.unpaid.amount > 0 ? "text-yellow-600" : "text-gray-900"}`}>
                                    {formatCurrency(payout.unpaid.amount)}
                                </p>
                                <p className="text-xs text-gray-500">Pending ({payout.unpaid.count})</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(payout.astrologer.perAnswerRate)}</p>
                                <p className="text-xs text-gray-500">Current rate / answer</p>
                            </div>
                        </div>

                        {/* Unpaid questions awaiting settlement */}
                        {payout.unpaid.questions.length > 0 && (
                            <div className="border-t border-gray-100">
                                <div className="px-4 pt-3 pb-1 text-[10px] text-gray-500 font-body tracking-widest uppercase flex items-center gap-1">
                                    <HelpCircle size={11} /> Unpaid Answers
                                </div>
                                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {payout.unpaid.questions.map((q) => (
                                        <div key={q._id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-800 truncate max-w-[360px]">{q.questionText}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    Answered {formatDateTime(q.answeredAt)}
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-gray-900 shrink-0">
                                                {formatCurrency(q.payoutRate)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settlement history */}
                        {payout.batches.length > 0 && (
                            <div className="border-t border-gray-100">
                                <div className="px-4 pt-3 pb-1 text-[10px] text-gray-500 font-body tracking-widest uppercase flex items-center gap-1">
                                    <Receipt size={11} /> Settlement History
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {payout.batches.map((b) => (
                                        <div key={b._id} className="px-4 py-2.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs text-gray-800">
                                                    {formatDateTime(b.paidAt)} · {b.questionCount} answer{b.questionCount === 1 ? "" : "s"}
                                                </span>
                                                <span className="text-xs font-semibold text-green-700">
                                                    {formatCurrency(b.totalAmount)}
                                                </span>
                                            </div>
                                            {(b.paymentReference || b.note || b.paidBy?.name) && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {b.paidBy?.name && <>Paid by {b.paidBy.name}</>}
                                                    {b.paymentReference && <> · Ref: {b.paymentReference}</>}
                                                    {b.note && <> · {b.note}</>}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {payout.unpaid.count === 0 && payout.batches.length === 0 && (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                No answered questions yet — nothing earned so far.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Report history */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={15} /> Report History ({reportsData.total})
                </div>
                <div className="divide-y divide-gray-100">
                    {reportsData.reports.length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-sm">No reports yet</div>
                    )}
                    {reportsData.reports.map((report: any) => (
                        <div key={report._id} className="p-4">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                    {report.leadId?.fullName || "Unknown client"} — {report.planName || report.leadId?.concern}
                                </span>
                                {reviewBadge(report)}
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                                {report.submittedAt && <span>Submitted {new Date(report.submittedAt).toLocaleString()}</span>}
                                {report.deliveredAt && <span>Delivered {new Date(report.deliveredAt).toLocaleString()}</span>}
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 size={11} /> {formatDuration(report.workDurationSeconds)} active work time
                                </span>
                            </div>
                            {report.adminReview?.status === "rejected" && report.adminReview?.reviewNote && (
                                <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    <RotateCcw size={13} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-700">{report.adminReview.reviewNote}</p>
                                </div>
                            )}
                            {report.reassignmentHistory?.length > 0 && (
                                <div className="mt-1 text-xs text-yellow-700 flex items-center gap-1">
                                    <TrendingUp size={12} /> Reassigned away {report.reassignmentHistory.length} time
                                    {report.reassignmentHistory.length > 1 ? "s" : ""}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {payout && (
                <SettlePayoutModal
                    open={settleModalOpen}
                    astrologerName={payout.astrologer.name}
                    unpaidAmount={payout.unpaid.amount}
                    unpaidCount={payout.unpaid.count}
                    loading={settling}
                    onClose={() => setSettleModalOpen(false)}
                    onConfirm={handleSettle}
                />
            )}
        </div>
    );
}