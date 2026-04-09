"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFilterSchema, type UserFilterSchema } from "@/lib/schemas";
import { mockUsers } from "@/lib/mock-data";
import { formatDateTime, getPlanColor, getStatusColor, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserDetailModal } from "@/components/dashboard/user-detail-modal";
import type { PlatformUser } from "@/types";
import { Search, Eye, Users } from "lucide-react";

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const { register, watch } = useForm<UserFilterSchema>({
    resolver: zodResolver(userFilterSchema),
    defaultValues: { search: "", plan: "all", status: "all" },
  });

  const filters = watch();

  const filtered = useMemo(() => {
    return mockUsers.filter(u => {
      const q = (filters.search ?? "").toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchPlan = filters.plan === "all" || u.plan === filters.plan;
      const matchStatus = filters.status === "all" || u.status === filters.status;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [filters]);

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <span className="text-gray-500 text-sm">
            {filtered.length} users found
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search name, email, phone…"
            icon={<Search size={14} />}
            {...register("search")}
          />
          <Select
            options={[
              { value: "all", label: "All Plans" },
              { value: "free", label: "Free" },
              { value: "modern", label: "Modern" },
              { value: "premium", label: "Premium" },
            ]}
            {...register("plan")}
          />
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
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
                {["User", "Contact", "Birth Details", "Concern", "Plan", "Status", "Last Login", "Actions"].map(h => (
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
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">
                          {getInitials(user.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-gray-700 text-xs">{user.email}</p>
                    <p className="text-gray-500 text-xs">{user.phone}</p>
                  </td>

                  {/* Birth */}
                  <td className="px-4 py-3">
                    <p className="text-gray-700 text-xs whitespace-nowrap">
                      {user.dateOfBirth} · {user.timeOfBirth}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {user.cityOfBirth}, {user.countryOfBirth}
                    </p>
                  </td>

                  {/* Concern */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-gray-700 text-xs truncate">
                      {user.primaryConcern}
                    </p>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <Badge className={getPlanColor(user.plan)}>
                      {user.plan}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-500 text-xs">
                      {formatDateTime(user.lastLogin)}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-[#F5A703] text-black hover:bg-[#d48f02] transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye size={13} />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      <UserDetailModal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        type="user"
      />
    </div>
  );
}
