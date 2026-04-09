"use client";

import { useState, useMemo } from "react";
import { mockReports } from "@/lib/mock-data";
import { formatDateTime, getPlanColor, getReportStatusColor, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ReportPreviewModal } from "@/components/dashboard/report-preview-modal";
import type { Report } from "@/types";
import { Search, Eye, FileText, Send, Sparkles, PenLine } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchTemplate = templateFilter === "all" || r.template === templateFilter;
      return matchSearch && matchStatus && matchTemplate;
    });
  }, [reports, search, statusFilter, templateFilter]);

  const handleReportSent = (reportId: string) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status: "sent" as const, sentAt: new Date().toISOString() }
          : r
      )
    );
  };

  const templateIcons: Record<string, React.ReactNode> = {
    free: <FileText size={12} />,
    modern: <PenLine size={12} />,
    premium: <Sparkles size={12} />,
  };

  const summaryCards = [
    { label: "Total", value: reports.length, color: "text-cosmos-300" },
    { label: "Draft", value: reports.filter(r => r.status === "draft").length, color: "text-cosmos-300" },
    { label: "Created", value: reports.filter(r => r.status === "created").length, color: "text-gold-400" },
    { label: "Sent", value: reports.filter(r => r.status === "sent").length, color: "text-jade-400" },
  ];

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease]">

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-sm"
          >
            <p className="text-2xl font-display font-bold text-gray-900">
              {c.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search title, client…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "created", label: "Created" },
              { value: "sent", label: "Sent" },
            ]}
          />

          <Select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            options={[
              { value: "all", label: "All Templates" },
              { value: "free", label: "Free" },
              { value: "modern", label: "Modern" },
              { value: "premium", label: "Premium" },
            ]}
          />
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400">
            No reports found
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report.id}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-300"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getPlanColor(report.template)}>
                    {templateIcons[report.template]}
                    <span className="ml-1">{report.template}</span>
                  </Badge>

                  <Badge className={getReportStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>

                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {formatDateTime(report.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display font-semibold text-gray-900 text-base mb-2 line-clamp-2">
                {report.title}
              </h3>

              {/* Client */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">
                    {getInitials(report.userName)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-700">
                    {report.userName}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {report.userEmail}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedReport(report)}
                  className="flex-1"
                >
                  <Eye size={13} />
                  Preview
                </Button>

                {report.status !== "sent" && (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Send size={13} />
                    Send
                  </Button>
                )}

                {report.status === "sent" && (
                  <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                    ✓ Sent
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ReportPreviewModal
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        onSent={handleReportSent}
      />
    </div>
  );
}
