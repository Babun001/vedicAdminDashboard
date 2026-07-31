"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Star, CheckCircle2, XCircle, Power, PowerOff, Clock } from "lucide-react";
import { useAstrologersStore } from "@/store/useAstrologersStore";
import ConfirmActionModal from "./components/ConfirmActionModal";
import type { Astrologer, ApprovalStatus } from "@/types";

import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";



type Tab = "pending" | "approved" | "rejected" | "all";
type ActionType = "approve" | "reject" | "activate" | "deactivate";

export default function AstrologersPage() {

    const router = useRouter();
    const { astrologers, loading, actionLoadingId, fetchAstrologers, approveAstrologer, rejectAstrologer, activateAstrologer, deactivateAstrologer } =
        useAstrologersStore();

    const [tab, setTab] = useState<Tab>("pending");
    const [search, setSearch] = useState("");

    const [modalAstrologer, setModalAstrologer] = useState<Astrologer | null>(null);
    const [modalAction, setModalAction] = useState<ActionType | null>(null);

    useEffect(() => {
        fetchAstrologers("all");
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return astrologers.filter((a) => {
            const matchTab = tab === "all" || a.approvalStatus === tab;
            const matchSearch =
                !q ||
                a.name?.toLowerCase().includes(q) ||
                a.email?.toLowerCase().includes(q) ||
                a.phone?.toLowerCase().includes(q);
            return matchTab && matchSearch;
        });
    }, [astrologers, tab, search]);

    const counts = useMemo(() => {
        return {
            pending: astrologers.filter((a) => a.approvalStatus === "pending").length,
            approved: astrologers.filter((a) => a.approvalStatus === "approved").length,
            rejected: astrologers.filter((a) => a.approvalStatus === "rejected").length,
            all: astrologers.length,
        };
    }, [astrologers]);

    const tabs: { key: Tab; label: string }[] = [
        { key: "pending", label: `Pending (${counts.pending})` },
        { key: "approved", label: `Approved (${counts.approved})` },
        { key: "rejected", label: `Rejected (${counts.rejected})` },
        { key: "all", label: `All (${counts.all})` },
    ];

    const openConfirm = (astrologer: Astrologer, action: ActionType) => {
        setModalAstrologer(astrologer);
        setModalAction(action);
    };

    const closeConfirm = () => {
        setModalAstrologer(null);
        setModalAction(null);
    };

    const handleConfirm = async () => {
        if (!modalAstrologer || !modalAction) return;
        try {
            if (modalAction === "approve") await approveAstrologer(modalAstrologer._id);
            if (modalAction === "reject") await rejectAstrologer(modalAstrologer._id);
            if (modalAction === "activate") await activateAstrologer(modalAstrologer._id);
            if (modalAction === "deactivate") await deactivateAstrologer(modalAstrologer._id);
            closeConfirm();
        } catch {
            // errors are already logged in the store; keep modal open so admin can retry
        }
    };

    const approvalBadge = (status: ApprovalStatus) => {
        if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
        if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    };

    return (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star size={18} className="text-gray-600" />
                    <span className="text-gray-500 text-sm">{filtered.length} astrologers found</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${tab === t.key
                            ? "bg-[#F8E4D2] border-[#EAD9C8] text-[#3B2F2F]"
                            : "bg-white border-gray-200 text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <Input
                    placeholder="Search name, email, phone…"
                    icon={<Search size={14} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                {["Astrologer", "Contact", "Expertise", "Approval", "Login Status", "Actions"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                        Loading astrologers…
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                        No astrologers found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a) => {
                                    const isBusy = actionLoadingId === a._id;
                                    return (
                                        <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {/* Astrologer */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-bold text-white">
                                                            {(a.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 whitespace-nowrap">{a.name}</p>
                                                        <p className="text-xs text-gray-500">ID: {a._id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700 text-xs">{a.email}</p>
                                                <p className="text-gray-500 text-xs">{a.phone}</p>
                                            </td>

                                            {/* Expertise */}
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <p className="text-gray-700 text-xs truncate">
                                                    {a.expertise?.join(", ") || "—"}
                                                </p>
                                            </td>

                                            {/* Approval status */}
                                            <td className="px-4 py-3">
                                                <Badge className={approvalBadge(a.approvalStatus)}>
                                                    {a.approvalStatus === "pending" && <Clock size={11} className="mr-1 inline" />}
                                                    {a.approvalStatus}
                                                </Badge>
                                            </td>

                                            {/* Login/active status */}
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={
                                                        a.approvalStatus === "approved" && a.isActive
                                                            ? "bg-green-100 text-green-700 border-green-200"
                                                            : "bg-gray-100 text-gray-600 border-gray-200"
                                                    }
                                                >
                                                    {a.approvalStatus === "approved" && a.isActive ? "Can log in" : "Cannot log in"}
                                                </Badge>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {a.approvalStatus === "pending" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="gold"
                                                                disabled={isBusy}
                                                                onClick={() => openConfirm(a, "approve")}
                                                            >
                                                                <CheckCircle2 size={13} /> Allow
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                disabled={isBusy}
                                                                onClick={() => openConfirm(a, "reject")}
                                                            >
                                                                <XCircle size={13} /> Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {a.approvalStatus === "approved" && (
                                                        <Button
                                                            size="sm"
                                                            variant={a.isActive ? "danger" : "gold"}
                                                            disabled={isBusy}
                                                            onClick={() => openConfirm(a, a.isActive ? "deactivate" : "activate")}
                                                        >
                                                            {a.isActive ? <PowerOff size={13} /> : <Power size={13} />}
                                                            {a.isActive ? "Deactivate" : "Activate"}
                                                        </Button>
                                                    )}

                                                    {a.approvalStatus === "rejected" && (
                                                        <Button
                                                            size="sm"
                                                            variant="gold"
                                                            disabled={isBusy}
                                                            onClick={() => openConfirm(a, "approve")}
                                                        >
                                                            <CheckCircle2 size={13} /> Allow
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => router.push(`/dashboard/astrologers/${a._id}/activity`)}
                                                    >
                                                        <Activity size={13} /> View Activity
                                                    </Button>
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

            <ConfirmActionModal
                open={!!modalAstrologer}
                astrologer={modalAstrologer}
                action={modalAction}
                loading={!!actionLoadingId}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
            />
        </div>
    );
}