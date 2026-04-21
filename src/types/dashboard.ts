// types/dashboard.ts

export interface Customer {
  _id: string;
  name: string;
  email: string;
  planName: string;
  planPrice: number;
  paymentStatus: "pending" | "paid" | "failed";
  concern: string;
  dob: string;
  tob: string;
  pobCity: string;
  pobCountry: string;
  currentCountry: string;
  createdAt: string; // ISO string
}

export interface User {
  _id: string;
  createdAt: string; // ISO string
}

export interface Report {
  _id: string;
  createdAt: string; // ISO string
}

export interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalRevenue: number;
  totalReports: number;
  usersGrowth: number;       // % vs last month
  revenueGrowth: number;     // % vs last month
  reportsThisMonth: number;
  activeSubscriptions: number;
}