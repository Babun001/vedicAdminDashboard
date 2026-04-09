"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionFilterSchema, type TransactionFilterSchema } from "@/lib/schemas";
import { mockTransactions } from "@/lib/mock-data";
import { formatCurrency, formatDateTime, getPlanColor, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

export default function TransactionsPage() {
  const { register, watch } = useForm<TransactionFilterSchema>({
    resolver: zodResolver(transactionFilterSchema),
    defaultValues: { search: "", status: "all", gateway: "all" },
  });

  const filters = watch();

  const filtered = useMemo(() => {
    return mockTransactions.filter(t => {
      const q = (filters.search ?? "").toLowerCase();
      const matchSearch = !q || t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q) || t.transactionRef.toLowerCase().includes(q);
      const matchStatus = filters.status === "all" || t.status === filters.status;
      const matchGateway = filters.gateway === "all" || t.gateway === filters.gateway;
      return matchSearch && matchStatus && matchGateway;
    });
  }, [filters]);

  const totalRevenue = filtered.filter(t => t.status === "success").reduce((s, t) => s + t.amount, 0);

  const summaryCards = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: <CreditCard size={16} />, color: "text-gold-400" },
    { label: "Successful", value: filtered.filter(t => t.status === "success").length, icon: <CheckCircle size={16} />, color: "text-jade-400" },
    { label: "Pending", value: filtered.filter(t => t.status === "pending").length, icon: <Clock size={16} />, color: "text-gold-400" },
    { label: "Failed/Refunded", value: filtered.filter(t => ["failed", "refunded"].includes(t.status)).length, icon: <XCircle size={16} />, color: "text-ember-400" },
  ];

  const gatewayColors: Record<string, string> = {
    razorpay: "text-cosmos-300 bg-cosmos-500/10 border-cosmos-500/20",
    stripe: "text-gold-400 bg-gold-500/10 border-gold-500/20",
    paypal: "text-jade-400 bg-jade-400/10 border-jade-400/20",
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <span className={c.color.replace("text-", "text-").replace("-400", "-600")}>
              {c.icon}
            </span>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {c.label}
              </p>
              <p className="text-lg font-display font-bold text-gray-900">
                {c.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search name, ref, email…"
            icon={<Search size={14} />}
            {...register("search")}
          />

          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "success", label: "Success" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
            {...register("status")}
          />

          <Select
            options={[
              { value: "all", label: "All Gateways" },
              { value: "razorpay", label: "Razorpay" },
              { value: "stripe", label: "Stripe" },
              { value: "paypal", label: "PayPal" },
            ]}
            {...register("gateway")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Transaction", "User", "Plan", "Amount", "Gateway", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] text-gray-500 font-body tracking-widest uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Transaction */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-purple-600">
                        {tx.transactionRef}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tx.description}
                      </p>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-medium">
                        {tx.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.userEmail}
                      </p>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <Badge className={getPlanColor(tx.plan)}>
                        {tx.plan}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          tx.amount > 0
                            ? "text-yellow-600 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {tx.amount > 0
                          ? formatCurrency(tx.amount)
                          : "Free"}
                      </span>
                    </td>

                    {/* Gateway */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          tx.gateway === "razorpay"
                            ? "text-purple-600 bg-purple-50 border border-purple-200"
                            : tx.gateway === "stripe"
                              ? "text-yellow-600 bg-yellow-50 border border-yellow-200"
                              : tx.gateway === "paypal"
                                ? "text-green-600 bg-green-50 border border-green-200"
                                : "text-gray-600 bg-gray-100 border border-gray-200"
                        }
                      >
                        {tx.gateway}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-gray-500">
                        {formatDateTime(tx.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
