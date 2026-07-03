"use client";

import { Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface FiltersProps {
    search: string;
    onSearchChange: (value: string) => void;

    statusFilter: "all" | "active" | "inactive";
    onStatusChange: (
        value: "all" | "active" | "inactive"
    ) => void;

    onCreatePlan: () => void;
}

export default function Filters({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onCreatePlan,
}: FiltersProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">

            <div className="grid grid-cols-1 md:grid-cols-3 md:[&>*:first-child]:col-span-2 gap-4">

                {/* Search */}

                <Input
                    placeholder="Search plans..."
                    icon={<Search size={15} />}
                    value={search}
                    onChange={(e) =>
                        onSearchChange(e.target.value)
                    }
                />

                <Button
                    variant="gold"
                    className="w-full"
                    onClick={onCreatePlan}
                >
                    <Plus size={16} />
                    Create Plan
                </Button>

            </div>

        </div>
    );
}