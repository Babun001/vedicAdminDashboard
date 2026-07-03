"use client";

import { useEffect, useMemo, useState } from "react";
import {
    PlanFormData,
    SubscriptionPlan,
} from "../types";

import {
    getPlans,
    createPlan as createPlanService,
    updatePlan as updatePlanService,
    deletePlan as deletePlanService,
    togglePlanStatus as togglePlanStatusService,
    markPlanAsPopular as markPlanAsPopularService,
} from "../../../../services/subscription.service";

export function usePlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // -----------------------------
    // Load Plans (API)
    // -----------------------------
    const fetchPlans = async () => {
        try {
            setLoading(true);

            const res = await getPlans();

            // backend: { success, data }
            setPlans(res.data || []);
        } catch (error) {
            console.error("Failed to fetch plans:", error);
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

    const [statusFilter, setStatusFilter] = useState<
        "all" | "active" | "inactive"
    >("all");

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
                        : plan.status === statusFilter;

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
            active: plans.filter((p) => p.status === "active").length,
            inactive: plans.filter((p) => p.status === "inactive").length,
            free: plans.filter(
                (p) => p.priceINR === 0 && p.priceUSD === 0
            ).length,
        };
    }, [plans]);

    // -----------------------------
    // CREATE
    // -----------------------------
    const createPlan = async (data: PlanFormData) => {
        try {
            await createPlanService(data);
            await fetchPlans();
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    // -----------------------------
    // UPDATE
    // -----------------------------
    const updatePlan = async (id: string, data: PlanFormData) => {
        try {
            await updatePlanService(id, data);
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
            await deletePlanService(id);
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
            await togglePlanStatusService(id);
            await fetchPlans();
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };
    const markPlanAsPopular = async (id: string) => {
        try {
            await markPlanAsPopularService(id);
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