"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema, type ReportSchema } from "@/lib/schemas";
// import { mockCustomers } from "@/lib/mock-data";
import { useCustomers } from "@/hooks/useCustomers";
import { generateReportPDF } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/editor/rich-editor";
import { ReportPreviewModal } from "@/components/dashboard/report-preview-modal";
import type { Report } from "@/types";
import {
  Sparkles, FileText, PenLine, User, Eye,
  Download, Send, CheckCircle2, Star
} from "lucide-react";

const TEMPLATES = [
  {
    id: "free" as const,
    label: "Free",
    desc: "Basic report with essential insights",
    icon: <FileText size={20} />,
    color: "border-white/20 bg-white/5",
    activeColor: "border-cosmos-500 bg-cosmos-500/15 shadow-cosmos",
    badge: "text-white/60 bg-white/5 border-white/10",
  },
  {
    id: "modern" as const,
    label: "Modern",
    desc: "Detailed analysis with remedies",
    icon: <PenLine size={20} />,
    color: "border-white/20 bg-white/5",
    activeColor: "border-cosmos-400 bg-cosmos-600/20 shadow-cosmos",
    badge: "text-cosmos-300 bg-cosmos-500/10 border-cosmos-500/30",
  },
  {
    id: "premium" as const,
    label: "Premium",
    desc: "Comprehensive Jyotish report with full analysis",
    icon: <Sparkles size={20} />,
    color: "border-white/20 bg-white/5",
    activeColor: "border-gold-500 bg-gold-500/10 shadow-gold",
    badge: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  },
];

const STARTER_TEMPLATES: Record<string, string> = {
  free: `<h2>Birth Chart Overview</h2><p>Based on the birth details provided, this report presents a concise analysis of the key planetary positions and their influences on your life.</p><h2>Key Planetary Positions</h2><ul><li>Sun Sign:</li><li>Moon Sign:</li><li>Ascendant (Lagna):</li></ul><h2>Guidance</h2><p>Add your guidance here.</p>`,
  modern: `<h2>Natal Chart Analysis</h2><p>This Modern Report presents a detailed Vedic Jyotish analysis encompassing your natal chart, current planetary transits, and upcoming Dasha periods.</p><h2>Lagna & Planetary Strength</h2><p>Describe the ascendant and key planet positions here.</p><h2>Career & Finance</h2><p>Analysis of the 10th and 2nd house lords...</p><h2>Relationships</h2><p>Analysis of the 7th house...</p><h2>Remedies</h2><ul><li>Gemstone recommendation:</li><li>Mantra:</li><li>Charity:</li></ul>`,
  premium: `<h2>Executive Summary</h2><p>This Premium Vedic Astrology Report provides the most comprehensive analysis of your birth chart, combining classical Parashari Jyotish with Jaimini techniques.</p><h2>Natal Chart — Detailed Analysis</h2><p>Ascendant, planets, houses...</p><h2>Vimshottari Dasha</h2><p>Current Dasha period and its implications...</p><h2>Career & Dharma</h2><p>Detailed 10th house analysis...</p><h2>Relationships & Marriage</h2><p>7th house, Venus, Jaimini analysis...</p><h2>Health & Wellness</h2><p>6th house, Moon, Ascendant lord...</p><h2>Spiritual Path</h2><p>9th house, 12th house, Ketu...</p><h2>Remedies & Prescriptions</h2><ul><li><strong>Gemstone:</strong></li><li><strong>Yantra:</strong></li><li><strong>Mantra:</strong></li><li><strong>Fasting:</strong></li><li><strong>Charity:</strong></li></ul><h2>Conclusion</h2><p>Summary and blessings...</p>`,
};

export default function CreateReportPage() {

  const { customers, loading } = useCustomers();

  console.log("Customers in CreateReportPage:", customers);

  
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [created, setCreated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportSchema>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      userId: "",
      title: "",
      content: "",
      template: "premium",
      adminNotes: "",
    },
  });

  const [selectedTemplate, content, userId] = watch(["template", "content", "userId"]);

  const selectedCustomer = customers.find(c => c._id === userId) ?? null;

  const applyTemplate = useCallback((tplId: ReportSchema["template"]) => {
    setValue("template", tplId, { shouldValidate: true });
    if (!content || content === "" || content.startsWith("<")) {
      setValue("content", STARTER_TEMPLATES[tplId] ?? "", { shouldValidate: false });
    }
  }, [setValue, content]);

  const buildReport = (data: ReportSchema): Report => ({
    id: `r-${Date.now()}`,
    userId: data.userId,
    userName: selectedCustomer?.fullName ?? "Unknown",
    userEmail: selectedCustomer?.email ?? "",
    title: data.title,
    content: data.content,
    template: data.template,
    status: "created",
    createdAt: new Date().toISOString(),
    adminNotes: data.adminNotes,
  });

  const onSubmit = async (data: ReportSchema) => {
    await new Promise(r => setTimeout(r, 600));
    const report = buildReport(data);
    setPreviewReport(report);
    setCreated(true);
  };

  const handleDownloadPDF = async () => {
    if (!previewReport) return;
    setGenerating(true);
    try {
      await generateReportPDF(previewReport, selectedCustomer);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 animate-[fadeIn_0.4s_ease]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Template selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-purple-500" />
            Choose Template
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl.id)}
                className={`
                relative p-4 rounded-xl border text-left transition-all duration-200
                ${selectedTemplate === tpl.id
                    ? "border-purple-400 bg-purple-50 shadow-sm"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"}
              `}
              >
                {selectedTemplate === tpl.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={14} className="text-purple-500" />
                  </div>
                )}

                <div className={`mb-2 ${selectedTemplate === tpl.id ? "text-purple-600" : "text-gray-400"}`}>
                  {tpl.icon}
                </div>

                <p className={`font-display font-semibold text-sm mb-0.5 ${selectedTemplate === tpl.id ? "text-gray-900" : "text-gray-700"
                  }`}>
                  {tpl.label}
                </p>

                <p className="text-xs text-gray-500 leading-tight">
                  {tpl.desc}
                </p>

                <Badge className="mt-2 bg-gray-100 text-gray-700 border border-gray-200">
                  <Star size={8} className="mr-1" />
                  {tpl.label}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Client + Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Client */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-purple-500" />
              Select Client
            </h3>

            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  error={errors.userId?.message}
                  options={[
                    { value: "", label: "— Choose a client —" },
                    ...customers.map(c => ({
                      value: c._id,
                      label: `${c.fullName} (${c.planName})`,
                    })),
                  ]}
                />
              )}
            />

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs font-medium text-gray-900">{selectedCustomer.fullName}</p>
                <p className="text-[10px] text-gray-500">{selectedCustomer.email}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  DOB: {selectedCustomer.dob} · {selectedCustomer.tob} · {selectedCustomer.pobCity}
                </p>
                <p className="text-[10px] text-purple-600 mt-0.5">
                  Concern: {selectedCustomer.concern}
                </p>
              </div>
            )}
          </div>

          {/* Title + Notes */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <Input
              label="Report Title"
              placeholder="e.g. Annual Vedic Horoscope 2024 — Priya Sharma"
              error={errors.title?.message}
              {...register("title")}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Admin Notes (optional)
              </label>

              <textarea
                rows={3}
                placeholder="Internal notes for reference…"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all resize-none"
                {...register("adminNotes")}
              />

              {errors.adminNotes && (
                <p className="text-xs text-red-500">
                  ⚠ {errors.adminNotes.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <PenLine size={14} className="text-purple-500" />
            Report Content
          </h3>

          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Start writing the astrology report…"
                error={errors.content?.message}
                minHeight="400px"
              />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-xs text-gray-500">
            {content?.replace(/<[^>]+>/g, "").length ?? 0} characters
            {errors.content && (
              <span className="text-red-500 ml-2">
                ⚠ {errors.content.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previewReport && (
              <>
                <Button type="button" variant="secondary" onClick={handleDownloadPDF} loading={generating}>
                  <Download size={14} />
                  Download PDF
                </Button>

                <Button type="button" variant="secondary">
                  <Eye size={14} />
                  Preview
                </Button>
              </>
            )}

            <Button type="submit" loading={isSubmitting} variant="primary" size="lg">
              <FileText size={15} />
              {created ? "Recreate Report" : "Create Report"}
            </Button>
          </div>
        </div>

      </form>

      <ReportPreviewModal
        open={!!previewReport && created}
        onClose={() => setCreated(false)}
        report={previewReport}
      />
    </div>
  );
}
