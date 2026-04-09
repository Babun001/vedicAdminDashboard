"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerFilterSchema, type CustomerFilterSchema } from "@/lib/schemas";
import { formatCurrency, formatDate, getPlanColor, getStatusColor, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserDetailModal } from "@/components/dashboard/user-detail-modal";
import type { Customer } from "@/types";
import { Search, Eye, ShoppingBag, Star, FileText } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { data: customers, loading, error, connected } = useSSE();

  // console.log("data ", customers);
  // console.log("loading ", loading);
  // console.log("error ", error);
  // console.log("connected ", connected);


  const { register, watch } = useForm<CustomerFilterSchema>({
    resolver: zodResolver(customerFilterSchema),
    defaultValues: { search: "", plan: "all", status: "all" },
  });

  const filters = watch();

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const q = (filters.search ?? "").toLowerCase();
      const matchSearch = !q
        || c.fullName.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q);
      const matchPlan = filters.plan === "all" || c.planName === filters.plan;
      const matchStatus = filters.status === "all" || "" ///c.paymentStatus === filters.status;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [customers, filters]);

  const totalRevenue = filtered.reduce((s, c) => s + (c.planPrice ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading leads...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
        {connected ? "Live — updates in real time" : "Reconnecting..."}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Customers", value: filtered.length, icon: <ShoppingBag size={16} />, color: "text-purple-600" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: <Star size={16} />, color: "text-yellow-600" },
          { label: "Pending Payment", value: filtered.filter(c => c.paymentStatus === "pending").length, icon: <FileText size={16} />, color: "text-green-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className={card.color}>{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-display font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search name, email…"
            icon={<Search size={14} />}
            {...register("search")}
          />
          <Select
            options={[
              { value: "all", label: "All Plans" },
              { value: "basic", label: "Basic" },
              { value: "modern", label: "Modern" },
              { value: "premium", label: "Premium" },
            ]}
            {...register("plan")}
          />
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "paid", label: "Paid" },
              { value: "failed", label: "Failed" },
            ]}
            {...register("status")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Customer", "Plan", "Amount Paid", "Concern", "Birth Info", "Location", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No leads found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-purple-500 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">
                            {getInitials(c.fullName)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.fullName}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <Badge className={getPlanColor(c.planName)}>
                        <Star size={9} className="mr-1" />
                        {c.planName}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <span className="text-yellow-600 font-medium">
                        {formatCurrency(c.planPrice)}
                      </span>
                    </td>

                    {/* Concern */}
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-xs">{c.concern}</span>
                    </td>

                    {/* Birth Info */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{c.dob} · {c.tob}</p>
                      <p className="text-xs text-gray-500">{c.pobCity}, {c.pobCountry}</p>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700">{c.currentCountry}</span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(c.paymentStatus)}>
                        {c.paymentStatus}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-[#F5A703] text-black hover:bg-[#d48f02] transition-colors"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <Eye size={13} /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailModal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        user={selectedCustomer}
        type="customer"
      />
    </div>
  );
}