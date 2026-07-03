import axiosInstanceClient from "./client.services";
import { PlanFormData } from "../app/dashboard/subscription-plans/types";

export const getPlans = async () => {
    const { data } = await axiosInstanceClient.get("/subscription-plans");
    return data;
};

export const createPlan = async (plan: PlanFormData) => {
    const { data } = await axiosInstanceClient.post(
        "/subscription-plans/create",
        plan
    );
    return data;
};

export const updatePlan = async (
    id: string,
    plan: PlanFormData
) => {
    const { data } = await axiosInstanceClient.put(
        `/subscription-plans/${id}`,
        plan
    );
    return data;
};

export const deletePlan = async (id: string) => {
    console.log("Deleting Plan with ID:", id);
    const { data } = await axiosInstanceClient.delete(
        `/subscription-plans/${id}`
    );
    console.log("Delete Plan Response:", data);
    return data;
};

export const togglePlanStatus = async (id: string) => {
    const { data } = await axiosInstanceClient.patch(
        `/subscription-plans/${id}/toggle-status`
    );
    return data;
};

export const markPlanAsPopular = async (id: string) => {
    const { data } = await axiosInstanceClient.patch(
        `/subscription-plans/${id}/mark-as-popular`
    );
    return data;
};