"use client";

import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Gift,
} from "lucide-react";

interface SummaryCardsProps {
  summary: {
    total: number;
    active: number;
    inactive: number;
    free: number;
  };
}

export default function SummaryCards({
  summary,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Plans",
      value: summary.total,
      icon: CreditCard,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Active",
      value: summary.active,
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: summary.inactive,
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Free Plans",
      value: summary.free,
      icon: Gift,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-display font-bold text-gray-900">
                  {card.value}
                </h2>

              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}
              >
                <Icon
                  size={22}
                  className={card.iconColor}
                />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}