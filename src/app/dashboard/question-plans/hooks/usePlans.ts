"use client";

import { useEffect, useMemo, useState } from "react";
import {
    QuestionPlanFormData,
    QuestionPlan,
} from "../types";

import {
    getQuestionPlans,
    createQuestionPlan as createQuestionPlanService,
    updateQuestionPlan as updateQuestionPlanService,
    deleteQuestionPlan as deleteQuestionPlanService,
    toggleQuestionPlanStatus as toggleQuestionPlanStatusService,
    markQuestionPlanAsPopular as markQuestionPlanAsPopularService,
} from "../../../../services/questionPlan.service";

export function useQuestionPlans() {
    const [plans, setPlans] = useState<QuestionPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // -----------------------------
    // Load Plans (API)
    // -----------------------------
    const fetchPlans = async () => {
        try {
            setLoading(true);

            const res = await getQuestionPlans();

            // backend: ApiResponse -> { success, data: { plans } }
            setPlans(res.data?.plans || []);
        } catch (error) {
            console.error("Failed to fetch question plans:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // -----------------------------
    // Search & Filters
    // -----------------------------
    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    // -----------------------------
    // Filtered Plans
    // -----------------------------
    const filteredPlans = useMemo(() => {
        return plans
            .filter((plan) => {
                const matchesSearch = plan.name
                    .toLowerCase()
                    .includes(search.toLowerCase());

                const matchesStatus =
                    statusFilter === "all"
                        ? true
                        : statusFilter === "active"
                            ? plan.isActive
                            : !plan.isActive;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [plans, search, statusFilter]);

    // -----------------------------
    // Summary
    // -----------------------------
    const summary = useMemo(() => {
        return {
            total: plans.length,
            active: plans.filter((p) => p.isActive).length,
            inactive: plans.filter((p) => !p.isActive).length,
            free: plans.filter(
                (p) => p.priceINR === 0 && p.priceUSD === 0
            ).length,
        };
    }, [plans]);

    // -----------------------------
    // CREATE
    // -----------------------------
    const createPlan = async (data: QuestionPlanFormData) => {
        try {
            await createQuestionPlanService(data);
            await fetchPlans();
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    // -----------------------------
    // UPDATE
    // -----------------------------
    const updatePlan = async (id: string, data: QuestionPlanFormData) => {
        try {
            await updateQuestionPlanService(id, data);
            await fetchPlans();
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    // -----------------------------
    // DELETE
    // -----------------------------
    const deletePlan = async (id: string) => {
        try {
            await deleteQuestionPlanService(id);
            await fetchPlans();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    // -----------------------------
    // TOGGLE STATUS
    // -----------------------------
    const toggleStatus = async (id: string) => {
        try {
            await toggleQuestionPlanStatusService(id);
            await fetchPlans();
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    // -----------------------------
    // MARK AS POPULAR — backend enforces the single-select (unmarks
    // every other plan), so the frontend just needs to refetch after.
    // -----------------------------
    const markPlanAsPopular = async (id: string) => {
        try {
            await markQuestionPlanAsPopularService(id);
            await fetchPlans();
        } catch (error) {
            console.error("Failed to mark plan as popular:", error);
        }
    };

    return {
        // data
        plans,
        filteredPlans,
        loading,

        // summary
        summary,

        // search
        search,
        setSearch,

        // filters
        statusFilter,
        setStatusFilter,

        // actions
        createPlan,
        updatePlan,
        deletePlan,
        toggleStatus,
        markPlanAsPopular,

        // refresh
        fetchPlans,
    };
}