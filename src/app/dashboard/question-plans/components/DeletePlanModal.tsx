"use client";

import {
    AlertTriangle,
    IndianRupee,
    DollarSign,
    Trash2,
    HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { QuestionPlan } from "../types";

interface DeletePlanModalProps {
    open: boolean;
    plan: QuestionPlan | null;
    onClose: () => void;
    onConfirm: (id: string) => void;
}

export default function DeletePlanModal({
    open,
    plan,
    onClose,
    onConfirm,
}: DeletePlanModalProps) {
    if (!open || !plan) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
                <div className="p-6 text-center border-b">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle size={30} className="text-red-600" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-gray-900">
                        Delete Question Plan?
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        This action cannot be undone. Clients who already
                        bought this plan keep their questions — only future
                        purchases are affected.
                    </p>
                </div>
                <div className="p-6">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-500">Plan</span>
                            <span className="font-semibold text-gray-900">{plan.name}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-500 flex items-center gap-1">
                                <HelpCircle size={14} />
                                Questions
                            </span>
                            <span className="font-semibold text-gray-900">{plan.questionCount}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-500">Price</span>
                            <div className="flex items-center gap-4 font-semibold">
                                <span className="flex items-center gap-1">
                                    <IndianRupee size={15} />
                                    {plan.priceINR}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">
                                    <DollarSign size={15} />
                                    {plan.priceUSD}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-2">Features</p>
                            <ul className="space-y-2">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="text-sm text-gray-700 list-disc ml-5">
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="border-t p-5 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={() => onConfirm(plan._id)}>
                        <Trash2 size={15} />
                        Delete Plan
                    </Button>
                </div>
            </div>
        </div>
    );
}