"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { mockStats, revenueChartData, planDistributionData, mockTransactions, mockReports } from "@/lib/mock-data";
import { formatCurrency, formatDateTime, getPlanColor, getStatusColor, getReportStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Users, ShoppingBag, IndianRupee, FileText,
  TrendingUp, Star, Sparkles
} from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gold-400">
        {formatCurrency(payload[0].value)}
      </p>
      {payload[1] && (
        <p className="text-xs text-cosmos-300">{payload[1].value} new users</p>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const recentTransactions = mockTransactions.slice(0, 5);
  const recentReports = mockReports.slice(0, 4);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease]">
      {/* Welcome banner */}
      <div className="relative bg-white border border-gray-200 rounded-2xl px-6 py-5 overflow-hidden shadow-sm">
        {/* subtle background symbol */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-200 text-8xl font-display select-none pointer-events-none">☉</div>
        <p className="text-xs text-[#DFAF07] font-body tracking-widest uppercase mb-1"> Namaste, Admin</p>
        <h2 className="text-2xl font-display font-bold text-gray-900">Welcome to Vedic Remedies Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your astrology practice today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={mockStats.totalUsers}
          change={mockStats.usersGrowth}
          icon={<Users size={18} />}
          accent="cosmos"
        />
        <StatCard
          title="Customers"
          value={mockStats.totalCustomers}
          icon={<ShoppingBag size={18} />}
          accent="jade"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(mockStats.totalRevenue)}
          change={mockStats.revenueGrowth}
          icon={<IndianRupee size={18} />}
          accent="gold"
        />
        <StatCard
          title="Reports Created"
          value={mockStats.totalReports}
          icon={<FileText size={18} />}
          accent="ember"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-gray-900">
                Revenue Overview
              </h3>
              <p className="text-xs text-gray-500">
                Monthly revenue — 2024
              </p>
            </div>

            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <TrendingUp size={11} />
              +{mockStats.revenueGrowth}%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-1">
            Plan Distribution
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Active subscriptions
          </p>

          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie
                data={planDistributionData}
                cx={75}
                cy={75}
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {planDistributionData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div className="space-y-2 mt-2">
            {planDistributionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {d.value} users
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions + Reports */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={15} className="text-yellow-500" />
            Recent Transactions
          </h3>

          <div className="space-y-3">
            {recentTransactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">
                    {tx.userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(tx.createdAt)}
                  </p>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-yellow-600">
                    {formatCurrency(tx.amount)}
                  </p>
                  <Badge className={getStatusColor(tx.status)}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-purple-500" />
            Recent Reports
          </h3>

          <div className="space-y-3">
            {recentReports.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">
                    {r.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.userName}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge className={getPlanColor(r.template)}>
                    {r.template}
                  </Badge>
                  <Badge className={getReportStatusColor(r.status)}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
