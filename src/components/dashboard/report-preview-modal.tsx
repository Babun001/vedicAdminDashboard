"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReportStatusColor, getPlanColor, formatDateTime } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf-generator";
import { mockCustomers } from "@/lib/mock-data";
import type { Report } from "@/types";
import { Download, Send, FileText, User, Calendar, Sparkles } from "lucide-react";

interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  report: Report | null;
  onSent?: (reportId: string) => void;
}

export function ReportPreviewModal({ open, onClose, report, onSent }: ReportPreviewModalProps) {
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);

  if (!report) return null;

  const customer = mockCustomers.find(c => c._id === report.userId) ?? null;

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await generateReportPDF(report, customer);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToClient = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1800)); // Simulate API
    setSending(false);
    setSent(true);
    onSent?.(report.id);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

  const templateLabels: Record<string, string> = {
    free: "Free Report",
    modern: "Modern Report",
    premium: "Premium Report",
  };

  return (
    <Modal open={open} onClose={onClose} title="Report Preview" size="xl">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={getReportStatusColor(report.status)}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Badge>
          <Badge className={getPlanColor(report.template)}>
            <Sparkles size={9} className="mr-1" />
            {templateLabels[report.template]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Calendar size={12} />
          <span>{formatDateTime(report.createdAt)}</span>
        </div>
      </div>

      {/* Client info strip */}
      {customer && (
        <div className="flex items-center gap-3 bg-cosmos-500/10 border border-cosmos-500/20 rounded-xl px-4 py-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmos-500 to-gold-500 flex items-center justify-center shrink-0">
            <User size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{customer.name}</p>
            <p className="text-xs text-white/50">{customer.email} </p> {/* · {customer.phone} */}
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-white/40">DOB: {customer.dob}</p>
            <p className="text-xs text-white/40">{customer.pobCity}, {customer.pobCountry}</p>
          </div>
        </div>
      )}

      {/* Report title */}
      <h2 className="text-xl font-display font-bold text-white mb-4">{report.title}</h2>

      {/* Report body — rendered HTML */}
      <div
        className="
          prose-custom bg-ink-950/60 border border-white/8 rounded-xl p-6 mb-6
          min-h-[200px] max-h-[420px] overflow-y-auto
          text-white/80 text-sm font-body leading-relaxed
          [&_h2]:text-white [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-1
          [&_h3]:text-cosmos-300 [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-3
          [&_p]:mb-3 [&_p]:text-white/75
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_li]:text-white/70
          [&_strong]:text-gold-400 [&_strong]:font-semibold
          [&_em]:text-cosmos-300 [&_em]:italic
        "
        dangerouslySetInnerHTML={{ __html: report.content }}
      />

      {/* Admin notes */}
      {report.adminNotes && (
        <div className="flex gap-3 bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3 mb-5">
          <FileText size={14} className="text-gold-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gold-400 font-medium mb-0.5">Admin Notes</p>
            <p className="text-xs text-white/60">{report.adminNotes}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10 flex-wrap">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            loading={generating}
            disabled={generating}
          >
            <Download size={14} />
            Download PDF
          </Button>
          {report.status !== "sent" && (
            <Button
              variant="gold"
              onClick={handleSendToClient}
              loading={sending}
              disabled={sending || sent}
            >
              {sent ? (
                <>✓ Sent!</>
              ) : (
                <>
                  <Send size={14} />
                  Send to Client
                </>
              )}
            </Button>
          )}
          {report.status === "sent" && (
            <span className="text-xs text-jade-400 flex items-center gap-1">
              ✓ Sent on {report.sentAt ? formatDateTime(report.sentAt) : "—"}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
