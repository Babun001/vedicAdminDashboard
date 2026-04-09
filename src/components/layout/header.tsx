"use client";

import { usePathname } from "next/navigation";
// import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useState, useEffect } from "react";



export function Header() {
  const pathname = usePathname();


  const [adminName, setAdminName] = useState("");

  const { admin: user, fetchAdmin, logout } = useAuthStore((state) => ({
    admin: state.admin,
    fetchAdmin: state.fetchAdmin,
    logout: state.logout,
  }));

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);


  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": { title: "Overview", subtitle: `Welcome back, ${user?.name || "Admin"}` },
    "/dashboard/users": { title: "Users", subtitle: "All registered users" },
    "/dashboard/customers": { title: "Customers", subtitle: "Paid plan subscribers" },
    "/dashboard/transactions": { title: "Transactions", subtitle: "Payment history" },
    "/dashboard/reports": { title: "Reports", subtitle: "All astrology reports" },
    "/dashboard/create-report": { title: "Create Report", subtitle: "Compose & send a new report" },
    "/dashboard/superadmin": { title: "All Admins", subtitle: "Manage admin users" },
    "/dashboard/superadmin/create": { title: "Create Admin", subtitle: "Add a new admin user" },
  };

  const page = pageTitles[pathname] ?? { title: "Dashboard", subtitle: "" };



  return (
    <header className="h-16 border-b border-[#EAD9C8] bg-[#FFF8F1]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-[#3B2F2F]">
          {page.title}
        </h1>
        <p className="text-xs text-[#7A6A5A]">
          {page.subtitle}
        </p>
      </div>

      {/* Optional right actions */}
      {/* <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl bg-[#F8E4D2] border border-[#EAD9C8] flex items-center justify-center text-[#7A6A5A] hover:text-[#3B2F2F] hover:bg-[#F1E1D2] transition-all">
          <Search size={15} />
        </button>

        <button className="w-9 h-9 rounded-xl bg-[#F8E4D2] border border-[#EAD9C8] flex items-center justify-center text-[#7A6A5A] hover:text-[#3B2F2F] hover:bg-[#F1E1D2] transition-all relative">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F5A703]" />
        </button>
      </div> */}
    </header>
  );
}
