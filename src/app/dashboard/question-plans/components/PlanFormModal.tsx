"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X,
    Plus,
    Trash2,
} from "lucide-react";

import ConfirmSaveModal from "./ConfirmSaveModal";

import { Button } from "@/components/ui/button";

import {
    QuestionPlanFormData,
    QuestionPlan,
} from "../types";

const schema = z.object({
    name: z.string().min(2, "Plan name is required"),

    description: z.string().min(5, "Description is required"),

    questionCount: z.coerce
        .number()
        .int("Must be a whole number")
        .min(1, "A plan must allow at least 1 question"),

    priceINR: z.coerce
        .number()
        .min(0, "Price cannot be negative"),

    priceUSD: z.coerce
        .number()
        .min(0, "Price cannot be negative"),

    validityDays: z.coerce
        .number()
        .int("Must be a whole number")
        .min(1, "Validity must be at least 1 day"),

    status: z.enum(["active", "inactive"]),

    features: z
        .array(
            z.object({
                value: z.string().min(1, "Feature is required"),
            })
        )
        .min(1),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;

    mode: "create" | "edit";

    plan?: QuestionPlan | null;

    onClose: () => void;

    onSave: (
        data: QuestionPlanFormData,
        id?: string
    ) => void;
}

export default function PlanFormModal({
    open,
    mode,
    plan,
    onClose,
    onSave,
}: Props) {
    const [confirmOpen, setConfirmOpen] =
        useState(false);

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),

        defaultValues: {
            name: "",
            description: "",
            questionCount: 1,
            priceINR: 0,
            priceUSD: 0,
            validityDays: 30,
            status: "active",
            features: [
                {
                    value: "",
                },
            ],
        },
    });

    const {
        fields,
        append,
        remove,
    } = useFieldArray({
        control,
        name: "features",
    });

    useEffect(() => {
        if (mode === "edit" && plan) {
            reset({
                name: plan.name,
                description: plan.description,
                questionCount: plan.questionCount,
                priceINR: plan.priceINR,
                priceUSD: plan.priceUSD,
                validityDays: plan.validityDays,
                status: plan.isActive ? "active" : "inactive",
                features: plan.features.map(
                    (feature) => ({
                        value: feature,
                    })
                ),
            });
        }
    }, [mode, plan, reset]);
    if (!open) return null;
    const values = watch();

    const submit = () => {
        setConfirmOpen(true);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8" style={{ marginTop: 0 }}>
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {mode === "create"
                                    ? "Create Question Plan"
                                    : "Edit Question Plan"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Configure Ask-a-Question pack pricing, quota and features.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form
                        onSubmit={handleSubmit(submit)}
                        className="p-8 overflow-y-auto max-h-[calc(90vh-90px)]"
                    >
                        {/* Plan Name */}
                        <input
                            className="admin-inputs"
                            placeholder="Plan Name"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="err">
                                {errors.name.message}
                            </p>
                        )}
                        {/* Description */}
                        <textarea
                            rows={4}
                            placeholder="Description"
                            className="admin-inputs resize-none"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="err">
                                {errors.description.message}
                            </p>
                        )}

                        {/* Question count + validity */}
                        <div className="mt-2">
                            <h3 className="font-semibold text-gray-800 mb-3">
                                Pack Details
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                                        Number of Questions
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step="1"
                                        className="admin-inputs"
                                        placeholder="1"
                                        {...register("questionCount")}
                                    />
                                    {errors.questionCount && (
                                        <p className="err">
                                            {errors.questionCount.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                                        Validity (days)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step="1"
                                        className="admin-inputs"
                                        placeholder="30"
                                        {...register("validityDays")}
                                    />
                                    {errors.validityDays && (
                                        <p className="err">
                                            {errors.validityDays.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Prices — both currencies captured; the correct one is
                            resolved on the backend based on the visitor's IP */}
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-800 mb-3">
                                Pricing
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                                        Price (INR)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="admin-inputs"
                                        placeholder="0.00"
                                        {...register("priceINR")}
                                    />
                                    {errors.priceINR && (
                                        <p className="err">
                                            {errors.priceINR.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                                        Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="admin-inputs"
                                        placeholder="0.00"
                                        {...register("priceUSD")}
                                    />
                                    {errors.priceUSD && (
                                        <p className="err">
                                            {errors.priceUSD.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status */}

                        <select
                            className="admin-inputs mt-4"
                            {...register("status")}
                        >
                            <option value="active">
                                Active
                            </option>
                            <option value="inactive">
                                Inactive
                            </option>
                        </select>

                        {/* Features */}

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800">
                                    Plan Features
                                </h3>

                                <Button
                                    type="button"
                                    variant="gold"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            value: "",
                                        })
                                    }
                                >

                                    <Plus size={15} />
                                    Add Feature
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map(
                                    (field, index) => (
                                        <div
                                            key={field.id}
                                            className="flex gap-3 items-start"
                                        >
                                            <input
                                                className="admin-inputs flex-1"
                                                placeholder={`Feature ${index + 1
                                                    }`}
                                                {...register(
                                                    `features.${index}.value`
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="danger"
                                                onClick={() =>
                                                    remove(index)
                                                }
                                                disabled={
                                                    fields.length === 1
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>

                                    )
                                )}
                                {errors.features && (
                                    <p className="err">

                                        Please add at least one feature.

                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Submit */}
                        <div className="pt-8 border-t border-gray-200 mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="submit-btn"
                            >
                                {mode === "create"
                                    ? "Create Question Plan"
                                    : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Confirmation Modal */}
            <ConfirmSaveModal
                open={confirmOpen}
                mode={mode}
                planName={values.name}
                priceINR={Number(values.priceINR)}
                priceUSD={Number(values.priceUSD)}
                questionCount={Number(values.questionCount)}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                    const payload: QuestionPlanFormData = {
                        name: values.name,
                        description: values.description,
                        questionCount: Number(values.questionCount),
                        priceINR: Number(values.priceINR),
                        priceUSD: Number(values.priceUSD),
                        validityDays: Number(values.validityDays),
                        isActive: values.status === "active",
                        features: values.features
                            .map((item) => item.value.trim())
                            .filter((item) => item.length > 0),
                    };

                    if (mode === "edit" && plan) {
                        onSave(payload, plan._id);
                    } else {
                        onSave(payload);
                    }

                    setConfirmOpen(false);

                    reset({
                        name: "",
                        description: "",
                        questionCount: 1,
                        priceINR: 0,
                        priceUSD: 0,
                        validityDays: 30,
                        status: "active",
                        features: [{ value: "" }],
                    });
                    onClose();
                }}
            />
        </>
    );
}