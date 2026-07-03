"use client";

import {
    X,
    CheckCircle2,
    Power,
    IndianRupee,
    DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { SubscriptionPlan } from "../types";

interface StatusModalProps {
    open: boolean;

    plan: SubscriptionPlan | null;

    onClose: () => void;

    onConfirm: (id: string) => void;
}

export default function StatusModal({
    open,
    plan,
    onClose,
    onConfirm,
}: StatusModalProps) {
    if (!open || !plan) return null;

    const isActive = plan.status === "active";

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" style={{marginTop:0}}>

            <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">

                {/* Header */}

                <div className="p-6 text-center border-b border-gray-100 relative">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>

                    <div
                        className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isActive ? "bg-yellow-100" : "bg-green-100"
                            }`}
                    >
                        <Power
                            size={30}
                            className={
                                isActive ? "text-yellow-600" : "text-green-600"
                            }
                        />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-gray-900">
                        {isActive ? "Deactivate Plan?" : "Activate Plan?"}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        {isActive
                            ? "Customers won't be able to purchase this subscription."
                            : "Customers will be able to purchase this subscription."}
                    </p>

                </div>

                {/* Plan Details */}

                <div className="p-6">

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

                        <div className="flex justify-between mb-4">

                            <span className="text-gray-500">
                                Plan
                            </span>

                            <span className="font-semibold text-gray-900">
                                {plan.name}
                            </span>

                        </div>

                        <div className="flex justify-between mb-4">

                            <span className="text-gray-500">
                                Current Status
                            </span>

                            <span
                                className={`font-semibold ${isActive
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                {isActive
                                    ? "Active"
                                    : "Inactive"}
                            </span>

                        </div>

                        <div className="flex justify-between">

                            <span className="text-gray-500">
                                Price
                            </span>

                            <div className="flex gap-6">

                                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">

                                    <IndianRupee size={16} className="text-orange-600" />

                                    <div>
                                        <p className="text-xs text-gray-500">INR</p>
                                        <p className="font-semibold">
                                            ₹{plan.priceINR.toLocaleString("en-IN")}
                                        </p>
                                    </div>

                                </div>

                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">

                                    <DollarSign size={16} className="text-green-600" />

                                    <div>
                                        <p className="text-xs text-gray-500">USD</p>
                                        <p className="font-semibold">
                                            ${plan.priceUSD.toLocaleString("en-US")}
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div className="border-t border-gray-100 p-5 flex justify-end gap-3">

                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant={isActive ? "danger" : "gold"}
                        onClick={() => onConfirm(plan._id)}
                    >
                        <CheckCircle2 size={16} />

                        {isActive
                            ? "Deactivate"
                            : "Activate"}
                    </Button>

                </div>

            </div>

        </div>
    );
}