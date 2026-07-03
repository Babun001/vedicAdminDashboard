"use client";

import { CheckCircle2, IndianRupee, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Currency } from "../types";

interface ConfirmSaveModalProps {
    open: boolean;
    mode: "create" | "edit";
    planName: string;
    priceINR: number;
    priceUSD: number;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmSaveModal({
    open,
    mode,
    planName,
    priceINR,
    priceUSD,
    onCancel,
    onConfirm,
}: ConfirmSaveModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                {/* Header */}

                <div className="p-6 text-center border-b border-gray-100">
                    <div className="w-14 h-14 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                        <CheckCircle2
                            size={28}
                            className="text-green-600"
                        />
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-gray-900">
                        {mode === "create"
                            ? "Create Plan?"
                            : "Save Changes?"}
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        Please confirm the subscription plan details.
                    </p>
                </div>

                {/* Content */}

                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <div className="flex justify-between mb-3">
                            <span className="text-sm text-gray-500">
                                Plan Name
                            </span>

                            <span className="font-medium text-gray-900">
                                {planName}
                            </span>

                        </div>

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                                Price
                            </span>
                            <div className="flex items-center gap-1 font-semibold text-gray-900">
                                {priceINR !== undefined && priceUSD !== undefined ? (
                                    <>
                                        {priceINR !== 0 ? (
                                            <IndianRupee size={15} />
                                        ) : (
                                            <DollarSign size={15} />
                                        )}
                                        {priceINR !== 0 ? priceINR : priceUSD}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}

                <div className="border-t border-gray-100 p-5 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="gold"
                        onClick={onConfirm}
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
}