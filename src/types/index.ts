// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: string;
  lastLogin?: string;
}

// ─── Platform User (logged-in users) ─────────────────────────────────────────

export interface PlatformUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  tob: string;
  pobCity: string;
  pobCountry: string;
  currentCountry: string;
  concern: string;
  notes?: string;
  planName: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin: string;
  avatarUrl?: string;
}

// ─── Customer (paid plan) ─────────────────────────────────────────────────────

// types/index.ts
export type Customer = {
  _id: string;
  fullName: string;
  email: string;
  gender: string;
  dob: string;
  tob: string;
  pobCity: string;
  pobCountry: string;
  currentCountry: string;
  concern: string;
  notes?: string;
  planName: string;
  planPrice: number;
  paymentStatus: "pending" | "paid" | "failed";
  remedyPreference: string;
  createdAt: string;
};

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: "free" | "Basic Horoscope" | "Divine Destiny Report";
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed" | "refunded";
  gateway: "razorpay" | "stripe" | "paypal";
  transactionRef: string;
  createdAt: string;
  description: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportTemplate = "free" | "Basic Horoscope" | "Divine Destiny Report";

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  template: ReportTemplate;
  status: "draft" | "created" | "sent";
  createdAt: string;
  sentAt?: string;
  pdfUrl?: string;
  adminNotes?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalRevenue: number;
  totalReports: number;
  usersGrowth: number;
  revenueGrowth: number;
  reportsThisMonth: number;
  activeSubscriptions: number;
}

// ─── Form Schemas (Zod) ───────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface TwoFAFormData {
  code: string;
}

export interface ReportFormData {
  userId: string;
  title: string;
  content: string;
  template: ReportTemplate;
  adminNotes?: string;
}
