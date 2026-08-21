"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/services/admin.services";
import { useAstrologersStore } from "@/store/useAstrologersStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
import {
  IndianRupee, Search, RefreshCw, HelpCircle, Eye,
} from "lucide-react";

// This page has no dedicated "all astrologer earnings" endpoint to call —
// the only confirmed real payout endpoint is GET /payouts/astrologer/:id
// (already used successfully on the per-astrologer Activity page). So this
// fetches every approved astrologer's payout summary in parallel and
// aggregates client-side. Fine at this app's scale (dozens of astrologers,
// not thousands); if that stops being true, the right fix is a real
// GET /payouts/summary-style bulk endpoint on the backend.
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
  }[];
}

export default function AstrologerEarningsPage() {
  const router = useRouter();
  const { astrologers, fetchAstrologers } = useAstrologersStore();

  const [payouts, setPayouts] = useState<Record<string, PayoutDetail>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chargeFilter, setChargeFilter] = useState<string>("all");

  useEffect(() => {
    fetchAstrologers("approved");
  }, [fetchAstrologers]);

  const fetchAllPayouts = useCallback(async (astrologerIds: string[]) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        astrologerIds.map((id) => axiosInstance.get(`/payouts/astrologer/${id}`))
      );
      const next: Record<string, PayoutDetail> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.data?.data) {
          next[astrologerIds[i]] = r.value.data.data;
        }
      });
      setPayouts(next);
    } catch (error) {
      console.error("Error fetching astrologer payouts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (astrologers.length > 0) {
      fetchAllPayouts(astrologers.map((a) => a._id));
    } else {
      setLoading(false);
    }
  }, [astrologers, fetchAllPayouts]);

  // Every distinct per-task charge actually billed, across every astrologer
  // — this is the dropdown's option list. Built from real payoutRate values
  // on real answered questions, not from the astrologers' self-declared
  // rates (which may differ from what was actually charged at the time).
  const chargeOptions = useMemo(() => {
    const rates = new Set<number>();
    Object.values(payouts).forEach((p) => {
      p.unpaid.questions.forEach((q) => rates.add(q.payoutRate));
    });
    return Array.from(rates).sort((a, b) => a - b);
  }, [payouts]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return astrologers
      .filter((a) => !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
      .map((a) => ({ astrologer: a, payout: payouts[a._id] }))
      .filter(({ payout }) => !!payout);
  }, [astrologers, payouts, search]);

  // When a specific charge amount is selected, show every task (across
  // every astrologer) billed at that exact rate instead of the summary table.
  const tasksAtSelectedCharge = useMemo(() => {
    if (chargeFilter === "all") return [];
    const rate = Number(chargeFilter);
    const tasks: { astrologerName: string; astrologerId: string; questionText: string; answeredAt: string; payoutRate: number }[] = [];
    Object.entries(payouts).forEach(([astrologerId, p]) => {
      p.unpaid.questions
        .filter((qz) => qz.payoutRate === rate)
        .forEach((qz) => tasks.push({ astrologerName: p.astrologer.name, astrologerId, ...qz }));
    });
    return tasks.sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
  }, [payouts, chargeFilter]);

  const totals = useMemo(() => {
    const list = Object.values(payouts);
    return {
      totalEarned: list.reduce((s, p) => s + p.paid.amount + p.unpaid.amount, 0),
      totalPaid: list.reduce((s, p) => s + p.paid.amount, 0),
      totalPending: list.reduce((s, p) => s + p.unpaid.amount, 0),
    };
  }, [payouts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading earnings…
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee size={18} className="text-gray-600" />
          <span className="text-gray-500 text-sm">{rows.length} astrologers with earnings</span>
        </div>
        <button
          onClick={() => fetchAllPayouts(astrologers.map((a) => a._id))}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Earned (all astrologers)</p>
          <p className="text-lg font-display font-bold text-gray-900">{formatCurrency(totals.totalEarned)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500">Paid Out</p>
          <p className="text-lg font-display font-bold text-green-700">{formatCurrency(totals.totalPaid)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500">Pending Settlement</p>
          <p className="text-lg font-display font-bold text-yellow-600">{formatCurrency(totals.totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Search astrologer name, email…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={[
              { value: "all", label: "All charges — show astrologer summary" },
              ...chargeOptions.map((r) => ({ value: String(r), label: `${formatCurrency(r)} per task` })),
            ]}
            value={chargeFilter}
            onChange={(e) => setChargeFilter(e.target.value)}
          />
        </div>
      </div>

      {chargeFilter !== "all" ? (
        // ── Drill-down: every unpaid task billed at the selected rate ──
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-900">
            <HelpCircle size={15} /> Tasks charged at {formatCurrency(Number(chargeFilter))} ({tasksAtSelectedCharge.length})
          </div>
          {tasksAtSelectedCharge.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No unpaid tasks at this rate</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasksAtSelectedCharge.map((t, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate max-w-[420px]">{t.questionText}</p>
                    <p className="text-xs text-gray-500">
                      {t.astrologerName} · Answered {formatDateTime(t.answeredAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(t.payoutRate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── Summary: one row per astrologer ──
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Astrologer", "Rate / Task", "Total Earned", "Paid", "Pending", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No earnings data yet
                    </td>
                  </tr>
                ) : (
                  rows.map(({ astrologer, payout }) => (
                    <tr key={astrologer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{getInitials(astrologer.name)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 whitespace-nowrap">{astrologer.name}</p>
                            <p className="text-xs text-gray-500">{astrologer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {formatCurrency(payout.astrologer.perAnswerRate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(payout.paid.amount + payout.unpaid.amount)}
                      </td>
                      <td className="px-4 py-3 text-green-700">
                        {formatCurrency(payout.paid.amount)}
                        <span className="text-gray-400 text-xs ml-1">({payout.paid.count})</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={payout.unpaid.amount > 0 ? "text-gold-400 bg-gold-400/10 border-gold-400/30" : "text-ink-200 bg-white/5 border-white/10"}>
                          {formatCurrency(payout.unpaid.amount)} ({payout.unpaid.count})
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push(`/dashboard/astrologers/${astrologer._id}/activity`)}
                        >
                          <Eye size={13} /> View & Settle
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Scope note: this covers question-answering payouts (the only payout system with a confirmed backend
        endpoint). If reports are paid out separately, that'll need its own endpoint wired in here too.
      </p>
    </div>
  );
}
