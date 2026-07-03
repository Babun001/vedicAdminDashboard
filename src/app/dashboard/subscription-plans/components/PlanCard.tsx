"use client";

import {
    Crown,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    Power,
    IndianRupee,
    DollarSign,
    Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SubscriptionPlan } from "../types";

interface PlanCardProps {
    plan: SubscriptionPlan;
    onEdit: (plan: SubscriptionPlan) => void;
    onDelete: (plan: SubscriptionPlan) => void;
    onStatus: (plan: SubscriptionPlan) => void;
    onMarkPopular: (plan: SubscriptionPlan) => void;
}

export default function PlanCard({
    plan,
    onEdit,
    onDelete,
    onStatus,
    onMarkPopular
}: PlanCardProps) {
    return (
        <div className="group flex flex-col h-full w-full min-h-[420px] bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">

            {/* Header */}
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                            <Crown className="text-yellow-600" size={20} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {plan.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {plan.description}
                            </p>
                        </div>
                    </div>

                    <Badge
                        className={
                            plan.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }
                    >
                        {plan.isActive ? (
                            <>
                                <CheckCircle2 size={12} />
                                <span className="ml-1">Active</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={12} />
                                <span className="ml-1">Inactive</span>
                            </>
                        )}
                    </Badge>
                </div>

                {/* Price */}
                <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <IndianRupee size={20} className="text-yellow-600" />
                        {plan.priceINR}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <DollarSign size={16} className="text-blue-600" />
                        {plan.priceUSD}
                    </div>
                    <p className="text-xs text-gray-400">
                        Subscription Price
                    </p>
                </div>

                {/* Features */}
                <div className="mt-6">
                    <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
                        Included Features
                    </p>
                    <div className="space-y-2">
                        {plan.features.map((feature) => (
                            <div
                                key={feature}
                                className="flex items-start gap-2 text-sm text-gray-700"
                            >
                                <Check size={14} className="text-green-500 mt-0.5" />
                                <span className="leading-snug">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer (ALWAYS at bottom) */}
            <div className="mt-auto border-t border-gray-100 bg-gray-50 px-5 py-4">
                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(plan)}
                        className="w-full"
                        style={{ whiteSpace: "nowrap", color: "#4B5563" }} // Gray-700
                    >
                        <Pencil size={15} />
                        Edit
                    </Button>

                    <Button
                        variant={plan.markedAsPopular ? "gold" : "secondary"}
                        size="sm"
                        onClick={() => onMarkPopular(plan)}
                        className="w-full"
                        style={{ whiteSpace: "nowrap", color: plan.markedAsPopular ? "#B45309" : "#4B5563" }} // Gold-600 or Gray-700
                    >
                        <Crown size={15} />
                        {plan.markedAsPopular ? "Popular" : "Mark"}
                    </Button>

                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(plan)}
                        className="w-full"
                    >
                        <Trash2 size={15} />
                        Delete
                    </Button>
                    <Button
                        variant={plan.isActive ? "gold" : "gold"}
                        size="sm"
                        onClick={() => onStatus(plan)}
                        className="w-full"
                    >
                        <Power size={15} />
                        {plan.isActive ? "Off" : "On"}
                    </Button>
                </div>
            </div>
        </div>
    );
}