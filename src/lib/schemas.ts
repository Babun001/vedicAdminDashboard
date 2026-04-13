import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const twoFASchema = z.object({
  code: z
    .string()
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must contain only numbers"),
});

// ─── Report Schema ────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  userId: z.string().min(1, "Please select a client"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  content: z
    .string()
    .min(50, "Report content must be at least 50 characters")
    .max(50000, "Report content is too long"),
  template: z.enum(["free", "Basic Horoscope", "Divine Destiny Report"], {
    errorMap: () => ({ message: "Please select a valid template" }),
  }),
  adminNotes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

// ─── Customer Filter Schema ───────────────────────────────────────────────────

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  plan: z.enum(["all", "free", "Basic Horoscope", "Divine Destiny Report"]).default("all"),
  status: z.enum(["all", "pending", "failed", "paid"]).default("all"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ─── Transaction Filter Schema ────────────────────────────────────────────────

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "success", "pending", "failed", "refunded"]).default("all"),
  gateway: z.enum(["all", "razorpay", "stripe", "paypal"]).default("all"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ─── User Filter Schema ───────────────────────────────────────────────────────

export const userFilterSchema = z.object({
  search: z.string().optional(),
  plan: z.enum(["all", "free", "modern", "premium"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

// ─── Types inferred from schemas ─────────────────────────────────────────────

export type LoginSchema = z.infer<typeof loginSchema>;
export type TwoFASchema = z.infer<typeof twoFASchema>;
export type ReportSchema = z.infer<typeof reportSchema>;
export type CustomerFilterSchema = z.infer<typeof customerFilterSchema>;
export type TransactionFilterSchema = z.infer<typeof transactionFilterSchema>;
export type UserFilterSchema = z.infer<typeof userFilterSchema>;
