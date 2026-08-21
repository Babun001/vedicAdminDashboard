import axiosInstanceClient from "./client.services";
import { QuestionPlanFormData } from "../app/dashboard/question-plans/types";

// GET /question-plans (no /all) is the PUBLIC pricing-page endpoint and
// only returns isActive plans — the admin table needs everything,
// including inactive ones, hence /all.
export const getQuestionPlans = async () => {
    const { data } = await axiosInstanceClient.get("/question-plans/all");
    return data;
};

export const createQuestionPlan = async (plan: QuestionPlanFormData) => {
    const { data } = await axiosInstanceClient.post(
        "/question-plans",
        plan
    );
    return data;
};

export const updateQuestionPlan = async (
    id: string,
    plan: QuestionPlanFormData
) => {
    const { data } = await axiosInstanceClient.put(
        `/question-plans/${id}`,
        plan
    );
    return data;
};

export const deleteQuestionPlan = async (id: string) => {
    const { data } = await axiosInstanceClient.delete(
        `/question-plans/${id}`
    );
    return data;
};

export const toggleQuestionPlanStatus = async (id: string) => {
    const { data } = await axiosInstanceClient.patch(
        `/question-plans/${id}/toggle-status`
    );
    return data;
};

export const markQuestionPlanAsPopular = async (id: string) => {
    const { data } = await axiosInstanceClient.patch(
        `/question-plans/${id}/mark-as-popular`
    );
    return data;
};