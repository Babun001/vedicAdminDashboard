"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard, Users, ShoppingBag, CreditCard,
  FileText, PlusSquare, LogOut, Star, ChevronRight
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";



export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin: user, fetchAdmin, logout } = useAuthStore((state) => ({
    admin: state.admin,
    fetchAdmin: state.fetchAdmin,
    logout: state.logout,
  }));

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  // console.log("Sidebar user ", user);

  const baseNavItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/customers", label: "Customers", icon: ShoppingBag },
    { href: "/dashboard/transactions", label: "Transactions", icon: CreditCard },
    { href: "/dashboard/reports", label: "All Reports", icon: FileText },
    { href: "/dashboard/create-report", label: "Create Report", icon: PlusSquare },
  ];

  const superAdminNavItems = [
    { href: "/dashboard/superadmin", label: "All Admins", icon: Users },
    { href: "/dashboard/superadmin/create", label: "Create Admin", icon: PlusSquare },
  ];

  const navItems = [
    ...baseNavItems,
    ...(user?.role === "superadmin" ? superAdminNavItems : []),
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#FFF8F1] border-r border-[#EAD9C8] flex flex-col z-40">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="logo-section flex items-center justify-center mb-4">
            <Image
              src="/assets/astro-logo-1.png"
              alt="logo"
              className="logo-navbar"
              width={170}
              height={60}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-[#A08F7D] font-body tracking-widest uppercase px-3 mb-3">Navigation</p>
        {
          navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-200 group",
                  active
                    ? "bg-[#F8E4D2] text-[#3B2F2F] border border-[#EAD9C8] shadow-sm"
                    : "text-[#7A6A5A] hover:text-[#3B2F2F] hover:bg-[#F1E1D2] border border-transparent"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    active
                      ? "text-[#F5A703]"
                      : "text-[#A08F7D] group-hover:text-[#3B2F2F]"
                  )}
                />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} className="text-cosmos-400" />}
              </Link>
            );
          })

        }
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmos-500 to-gold-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#3B2F2F] truncate">{user.name}</p>
              <p className="text-[10px] text-[#7A6A5A] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#7A6A5A] hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
