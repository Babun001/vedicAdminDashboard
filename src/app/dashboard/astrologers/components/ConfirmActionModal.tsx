"use client";

import { X, CheckCircle2, XCircle, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Astrologer } from "@/types";

type ActionType = "approve" | "reject" | "activate" | "deactivate";

interface ConfirmActionModalProps {
    open: boolean;
    astrologer: Astrologer | null;
    action: ActionType | null;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

interface ActionConfig {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    desc: string;
    buttonVariant: "gold" | "danger";
    buttonLabel: string;
}

const APPROVE_CONFIG: ActionConfig = {
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Allow this astrologer?",
    desc: "They will be approved and able to log in with their credentials.",
    buttonVariant: "gold",
    buttonLabel: "Allow",
};

const REJECT_CONFIG: ActionConfig = {
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    title: "Reject this astrologer?",
    desc: "Their application will be marked rejected and they won't be able to log in.",
    buttonVariant: "danger",
    buttonLabel: "Reject",
};

const ACTIVATE_CONFIG: ActionConfig = {
    icon: Power,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Activate this astrologer?",
    desc: "They will regain access and be able to log in with their credentials.",
    buttonVariant: "gold",
    buttonLabel: "Activate",
};

const DEACTIVATE_CONFIG: ActionConfig = {
    icon: PowerOff,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    title: "Deactivate this astrologer?",
    desc: "They will be blocked from logging in until reactivated.",
    buttonVariant: "danger",
    buttonLabel: "Deactivate",
};

const CONFIG: { [key in ActionType]: ActionConfig } = {
    approve: APPROVE_CONFIG,
    reject: REJECT_CONFIG,
    activate: ACTIVATE_CONFIG,
    deactivate: DEACTIVATE_CONFIG,
};

export default function ConfirmActionModal({
    open,
    astrologer,
    action,
    loading,
    onClose,
    onConfirm,
}: ConfirmActionModalProps) {
    if (!open || !astrologer || !action) return null;

    const cfg = CONFIG[action];
    const Icon = cfg.icon;

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

                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${cfg.iconBg}`}>
                        <Icon size={30} className={cfg.iconColor} />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-gray-900">{cfg.title}</h2>
                    <p className="mt-2 text-sm text-gray-500">{cfg.desc}</p>
                </div>

                {/* Astrologer summary */}
                <div className="p-6">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">Name</span>
                            <span className="font-semibold text-gray-900">{astrologer.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-semibold text-gray-900">{astrologer.email}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-5 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant={cfg.buttonVariant} onClick={onConfirm} loading={loading}>
                        <Icon size={16} />
                        {cfg.buttonLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}