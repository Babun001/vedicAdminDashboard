"use client";

import { useAuthInit } from "@/hooks/useAuthInit";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuthInit();

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen starfield-bg">
        <p className="text-sm text-gray-400 animate-pulse">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null; // redirect already handled inside useAuthInit

  return (
    <div className="min-h-screen starfield-bg flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}