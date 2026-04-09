"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, Users, Eye } from "lucide-react";
import axiosInstance from "@/services/admin.services";

type Admin = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "superadmin";
    isActive: "active" | "inactive";
    createdAt: string;
};

// const mockAdmins: Admin[] = [
//     {
//         id: "1",
//         name: "John Doe",
//         email: "john@example.com",
//         role: "superadmin",
//         status: "active",
//         createdAt: "2025-03-01",
//     },
//     {
//         id: "2",
//         name: "Jane Smith",
//         email: "jane@example.com",
//         role: "admin",
//         status: "active",
//         createdAt: "2025-03-10",
//     },
// ];



export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await axiosInstance.get("/all", {
                    params: {
                        page: 1,
                        limit: 10,
                        search,
                        role,
                    },
                });

                setAdmins(response.data.data.admins);
            } catch (error) {
                console.error("Error fetching admins:", error);
            }
        };

        fetchAdmins();
    }, [search, role]);

    const summary = useMemo(() => {
        let total = admins.length;
        let superAdmins = 0;
        let active = 0;

        for (const a of admins) {
            if (a.role === "superadmin") superAdmins++;
            if (a.isActive) active++;
        }

        return { total, superAdmins, active };
    }, [admins]);

    const filtered = admins;

    const summaryCards = [
        {
            label: "Total Admins",
            value: admins.length,
            icon: <Users size={16} />,
            color: "text-blue-400",
        },
        {
            label: "Super Admins",
            value: admins.filter(a => a.role === "superadmin").length,
            icon: <Shield size={16} />,
            color: "text-purple-400",
        },
        {
            label: "Active",
            value: admins.filter(a => a.isActive).length,
            icon: <Users size={16} />,
            color: "text-green-400",
        },
    ];

    return (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

            
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {summaryCards.map((c, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                    >
                        <span className={c.color}>
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
                <div className="grid sm:grid-cols-2 gap-3">
                    <Input
                        placeholder="Search name, email…"
                        icon={<Search size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Select
                        value={role}
                        onChange={(e: any) => setRole(e.target.value)}
                        options={[
                            { value: "all", label: "All Roles" },
                            { value: "admin", label: "Admin" },
                            { value: "superadmin", label: "Super Admin" },
                        ]}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                {["Admin", "Role", "Status", "Created", "Actions"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs text-gray-500 uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((a) => (
                                <tr key={a.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{a.name}</p>
                                        <p className="text-xs text-gray-500">{a.email}</p>
                                    </td>

                                    <td className="px-4 py-3">
                                        <Badge className={a.role === "superadmin"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-blue-100 text-blue-700"}>
                                            {a.role}
                                        </Badge>
                                    </td>

                                    <td className="px-4 py-3">
                                        <Badge className="bg-green-100 text-green-700">
                                            {a.isActive ? "active" : "inactive"}
                                        </Badge>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {a.createdAt}
                                    </td>

                                    <td className="px-4 py-3">
                                        <Button size="sm" variant="secondary">
                                            <Eye size={13} /> View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
}

function Card({ label, value, icon }: any) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            {icon}
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </div>
    );
}