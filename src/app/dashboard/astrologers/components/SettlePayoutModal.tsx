"use client";

import { useState } from "react";
import { X, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface SettlePayoutModalProps {
    open: boolean;
    astrologerName: string;
    unpaidAmount: number;
    unpaidCount: number;
    loading?: boolean;
    onClose: () => void;
    onConfirm: (paymentReference: string, note: string) => void;
}

export default function SettlePayoutModal({
    open,
    astrologerName,
    unpaidAmount,
    unpaidCount,
    loading,
    onClose,
    onConfirm,
}: SettlePayoutModalProps) {
    const [paymentReference, setPaymentReference] = useState("");
    const [note, setNote] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm(paymentReference.trim(), note.trim());
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" style={{ marginTop: 0 }}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100 relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>

                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-green-100">
                        <IndianRupee size={28} className="text-green-600" />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-gray-900">Mark as paid?</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        This freezes {astrologerName}'s current outstanding balance into a settlement
                        record. If you're partway through paying (e.g. bank transfer already sent), do
                        this right after — any answers they submit after clicking confirm will land in
                        the next batch instead.
                    </p>
                </div>

                {/* Summary + optional fields */}
                <div className="p-6 space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">Astrologer</span>
                            <span className="font-semibold text-gray-900">{astrologerName}</span>
                        </div>
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">Unpaid answers</span>
                            <span className="font-semibold text-gray-900">{unpaidCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Amount to settle</span>
                            <span className="font-bold text-green-700 text-lg">{formatCurrency(unpaidAmount)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">
                            Payment reference (optional)
                        </label>
                        <Input
                            placeholder="e.g. UTR / transaction ID"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">
                            Note (optional)
                        </label>
                        <Input
                            placeholder="e.g. Paid via bank transfer"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-5 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="gold" onClick={handleConfirm} loading={loading}>
                        <IndianRupee size={16} />
                        Confirm & mark paid
                    </Button>
                </div>
            </div>
        </div>
    );
}