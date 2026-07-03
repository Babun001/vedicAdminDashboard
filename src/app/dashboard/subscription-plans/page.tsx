"use client";

import { useState } from "react";

import SummaryCards from "./components/SummaryCards";
import Filters from "./components/Filters";
import PlanCard from "./components/PlanCard";
import PlanFormModal from "./components/PlanFormModal";
import DeletePlanModal from "./components/DeletePlanModal";
import StatusModal from "./components/StatusModal";

import { usePlans } from "./hooks/usePlans";

import {
    PlanFormData,
    SubscriptionPlan,
} from "./types";

export default function SubscriptionPlanPage() {
    const {
        filteredPlans,

        summary,

        search,
        setSearch,

        statusFilter,
        setStatusFilter,

        createPlan,
        updatePlan,
        deletePlan,
        toggleStatus,
        markPlanAsPopular,
    } = usePlans();

    // -----------------------------
    // Modal States
    // -----------------------------

    const [formOpen, setFormOpen] =
        useState(false);

    const [formMode, setFormMode] =
        useState<"create" | "edit">("create");

    const [selectedPlan, setSelectedPlan] =
        useState<SubscriptionPlan | null>(null);

    const [deleteOpen, setDeleteOpen] =
        useState(false);

    const [statusOpen, setStatusOpen] =
        useState(false);

    // -----------------------------
    // Handlers
    // -----------------------------

    const handleCreate = () => {
        setFormMode("create");
        setSelectedPlan(null);
        setFormOpen(true);
    };

    const handleEdit = (
        plan: SubscriptionPlan
    ) => {
        setFormMode("edit");
        setSelectedPlan(plan);
        setFormOpen(true);
    };

    const handleDelete = (
        plan: SubscriptionPlan
    ) => {
        setSelectedPlan(plan);
        setDeleteOpen(true);
    };

    const handleStatus = (
        plan: SubscriptionPlan
    ) => {
        setSelectedPlan(plan);
        setStatusOpen(true);
    };

    const handleSave = (
        data: PlanFormData,
        id?: string
    ) => {
        if (formMode === "create") {
            createPlan(data);
        } else if (id) {
            updatePlan(id, data);
        }
        setFormOpen(false);
        setSelectedPlan(null);
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.4s_ease]">
            {/* Summary */}

            <SummaryCards summary={summary} />

            <Filters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onCreatePlan={handleCreate}
            />

            {/* Plans */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {filteredPlans.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-2xl border border-gray-200 py-20 text-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            No Subscription Plans Found
                        </h3>
                        <p className="text-gray-500 mt-2">
                            Create your first subscription
                            plan to get started.
                        </p>
                    </div>

                ) : (

                    filteredPlans.map((plan) => (

                        <PlanCard
                            key={plan._id}
                            plan={plan}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatus={handleStatus}
                            onMarkPopular={(plan) => markPlanAsPopular(plan._id)}
                        />

                    ))

                )}

            </div>
            {/* Create / Edit Plan Modal */}

            <PlanFormModal
                open={formOpen}
                mode={formMode}
                plan={selectedPlan}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedPlan(null);
                }}
                onSave={handleSave}
            />

            {/* Delete Modal */}

            <DeletePlanModal
                open={deleteOpen}
                plan={selectedPlan}
                onClose={() => {
                    setDeleteOpen(false);
                    setSelectedPlan(null);
                }}
                onConfirm={(id) => {
                    deletePlan(id);
                    setDeleteOpen(false);
                    setSelectedPlan(null);
                }}
            />

            {/* Activate / Deactivate Modal */}

            <StatusModal
                open={statusOpen}
                plan={selectedPlan}
                onClose={() => {
                    setStatusOpen(false);
                    setSelectedPlan(null);
                }}
                onConfirm={(id) => {
                    toggleStatus(id);
                    setStatusOpen(false);
                    setSelectedPlan(null);
                }}
            />

        </div>
    );
}