// "use client";

// import { useState, useCallback } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { reportSchema, type ReportSchema } from "@/lib/schemas";
// // import { mockCustomers } from "@/lib/mock-data";
// import { useCustomers } from "@/hooks/useCustomers";
// import { generateReportPDF } from "@/lib/pdf-generator";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { RichEditor } from "@/components/editor/rich-editor";
// import { ReportPreviewModal } from "@/components/dashboard/report-preview-modal";
// import type { Report, ReportTemplate } from "@/types";
// import {
//   Sparkles, FileText, PenLine, User, Eye,
//   Download, Send, CheckCircle2, Star
// } from "lucide-react";

// const TEMPLATES = [
//   {
//     id: "free" as const,
//     label: "Free",
//     desc: "Basic report with essential insights",
//     icon: <FileText size={20} />,
//     color: "border-white/20 bg-white/5",
//     activeColor: "border-cosmos-500 bg-cosmos-500/15 shadow-cosmos",
//     badge: "text-white/60 bg-white/5 border-white/10",
//   },
//   {
//     id: "Basic Horoscope" as const,
//     label: "Basic Horoscope",
//     desc: "Detailed analysis with remedies",
//     icon: <PenLine size={20} />,
//     color: "border-white/20 bg-white/5",
//     activeColor: "border-cosmos-400 bg-cosmos-600/20 shadow-cosmos",
//     badge: "text-cosmos-300 bg-cosmos-500/10 border-cosmos-500/30",
//   },
//   {
//     id: "Divine Destiny Report" as const,
//     label: "Divine Destiny Report",
//     desc: "Comprehensive Jyotish report with full analysis",
//     icon: <Sparkles size={20} />,
//     color: "border-white/20 bg-white/5",
//     activeColor: "border-gold-500 bg-gold-500/10 shadow-gold",
//     badge: "text-gold-400 bg-gold-500/10 border-gold-500/30",
//   },
// ] satisfies { id: ReportTemplate; label: string; desc: string; icon: JSX.Element; color: string; activeColor: string; badge: string }[];

// const STARTER_TEMPLATES: Record<string, string> = {
//   free: `<h2>Birth Chart Overview</h2><p>Based on the birth details provided, this report presents a concise analysis of the key planetary positions and their influences on your life.</p><h2>Key Planetary Positions</h2><ul><li>Sun Sign:</li><li>Moon Sign:</li><li>Ascendant (Lagna):</li></ul><h2>Guidance</h2><p>Add your guidance here.</p>`,
//   "Basic Horoscope": `<h2>Natal Chart Analysis</h2><p>This Basic Horoscope Report presents a detailed Vedic Jyotish analysis encompassing your natal chart, current planetary transits, and upcoming Dasha periods.</p><h2>Lagna & Planetary Strength</h2><p>Describe the ascendant and key planet positions here.</p><h2>Career & Finance</h2><p>Analysis of the 10th and 2nd house lords...</p><h2>Relationships</h2><p>Analysis of the 7th house...</p><h2>Remedies</h2><ul><li>Gemstone recommendation:</li><li>Mantra:</li><li>Charity:</li></ul>`,
//   "Divine Destiny Report": `<h2>Executive Summary</h2><p>This Divine Destiny Report provides the most comprehensive analysis of your birth chart, combining classical Parashari Jyotish with Jaimini techniques.</p><h2>Natal Chart — Detailed Analysis</h2><p>Ascendant, planets, houses...</p><h2>Vimshottari Dasha</h2><p>Current Dasha period and its implications...</p><h2>Career & Dharma</h2><p>Detailed 10th house analysis...</p><h2>Relationships & Marriage</h2><p>7th house, Venus, Jaimini analysis...</p><h2>Health & Wellness</h2><p>6th house, Moon, Ascendant lord...</p><h2>Spiritual Path</h2><p>9th house, 12th house, Ketu...</p><h2>Remedies & Prescriptions</h2><ul><li><strong>Gemstone:</strong></li><li><strong>Yantra:</strong></li><li><strong>Mantra:</strong></li><li><strong>Fasting:</strong></li><li><strong>Charity:</strong></li></ul><h2>Conclusion</h2><p>Summary and blessings...</p>`,
// };

// export default function CreateReportPage() {

//   const { customers, loading } = useCustomers();

//   console.log("Customers in CreateReportPage:", customers);


//   const [previewReport, setPreviewReport] = useState<Report | null>(null);
//   const [created, setCreated] = useState(false);
//   const [generating, setGenerating] = useState(false);

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors, isSubmitting },
//   } = useForm<ReportSchema>({
//     resolver: zodResolver(reportSchema),
//     defaultValues: {
//       userId: "",
//       title: "",
//       content: "",
//       template: "free",
//       adminNotes: "",
//     },
//   });

//   const [selectedTemplate, content, userId] = watch(["template", "content", "userId"]);

//   const selectedCustomer = customers.find(c => c._id === userId) ?? null;

//   const applyTemplate = useCallback((tplId: ReportSchema["template"]) => {
//     setValue("template", tplId, { shouldValidate: true });
//     if (!content || content === "" || content.startsWith("<")) {
//       setValue("content", STARTER_TEMPLATES[tplId] ?? "", { shouldValidate: false });
//     }
//   }, [setValue, content]);

//   const buildReport = (data: ReportSchema): Report => ({
//     id: `r-${Date.now()}`,
//     userId: data.userId,
//     userName: selectedCustomer?.name ?? "Unknown",
//     userEmail: selectedCustomer?.email ?? "",
//     title: data.title,
//     content: data.content,
//     template: data.template,
//     status: "created",
//     createdAt: new Date().toISOString(),
//     adminNotes: data.adminNotes,
//   });

//   const onSubmit = async (data: ReportSchema) => {
//     await new Promise(r => setTimeout(r, 600));
//     const report = buildReport(data);
//     setPreviewReport(report);
//     setCreated(true);
//   };

//   const handleDownloadPDF = async () => {
//     if (!previewReport) return;
//     setGenerating(true);
//     try {
//       await generateReportPDF(previewReport, selectedCustomer);
//     } finally {
//       setGenerating(false);
//     }
//   };

//   return (
//     <div className="mx-auto space-y-6 animate-[fadeIn_0.4s_ease]">
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

//         {/* Template selector */}
//         <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
//           <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
//             <Sparkles size={14} className="text-purple-500" />
//             Choose Template
//           </h3>

//           <div className="grid grid-cols-3 gap-3">
//             {TEMPLATES.map(tpl => (
//               <button
//                 key={tpl.id}
//                 type="button"
//                 onClick={() => applyTemplate(tpl.id)}
//                 className={`
//                 relative p-4 rounded-xl border text-left transition-all duration-200
//                 ${selectedTemplate === tpl.id
//                     ? "border-purple-400 bg-purple-50 shadow-sm"
//                     : "border-gray-200 bg-gray-50 hover:border-gray-300"}
//               `}
//               >
//                 {selectedTemplate === tpl.id && (
//                   <div className="absolute top-2 right-2">
//                     <CheckCircle2 size={14} className="text-purple-500" />
//                   </div>
//                 )}

//                 <div className={`mb-2 ${selectedTemplate === tpl.id ? "text-purple-600" : "text-gray-400"}`}>
//                   {tpl.icon}
//                 </div>

//                 <p className={`font-display font-semibold text-sm mb-0.5 ${selectedTemplate === tpl.id ? "text-gray-900" : "text-gray-700"
//                   }`}>
//                   {tpl.label}
//                 </p>

//                 <p className="text-xs text-gray-500 leading-tight">
//                   {tpl.desc}
//                 </p>

//                 <Badge className="mt-2 bg-gray-100 text-gray-700 border border-gray-200">
//                   <Star size={8} className="mr-1" />
//                   {tpl.label}
//                 </Badge>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Client + Title */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//           {/* Client */}
//           <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
//             <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
//               <User size={14} className="text-purple-500" />
//               Select Client
//             </h3>

//             <Controller
//               name="userId"
//               control={control}
//               render={({ field }) => (
//                 <Select
//                   {...field}
//                   error={errors.userId?.message}
//                   options={[
//                     { value: "", label: "— Choose a client —" },
//                     ...customers.map(c => ({
//                       value: c._id,
//                       label: `${c.fullName} (${c.planName})`,
//                     })),
//                   ]}
//                 />
//               )}
//             />

//             {selectedCustomer && (
//               <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
//                 <p className="text-xs font-medium text-gray-900">{selectedCustomer.name}</p>
//                 <p className="text-[10px] text-gray-500">{selectedCustomer.email}</p>
//                 <p className="text-[10px] text-gray-500 mt-0.5">
//                   DOB: {selectedCustomer.dob} · {selectedCustomer.tob} · {selectedCustomer.pobCity}
//                 </p>
//                 <p className="text-[10px] text-purple-600 mt-0.5">
//                   Concern: {selectedCustomer.concern}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Title + Notes */}
//           <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
//             <Input
//               label="Report Title"
//               placeholder="e.g. Annual Vedic Horoscope 2024 — Priya Sharma"
//               error={errors.title?.message}
//               {...register("title")}
//             />

//             <div className="space-y-1.5">
//               <label className="block text-sm font-medium text-gray-700">
//                 Admin Notes (optional)
//               </label>

//               <textarea
//                 rows={3}
//                 placeholder="Internal notes for reference…"
//                 className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all resize-none"
//                 {...register("adminNotes")}
//               />

//               {errors.adminNotes && (
//                 <p className="text-xs text-red-500">
//                   ⚠ {errors.adminNotes.message}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Editor */}
//         <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
//           <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
//             <PenLine size={14} className="text-purple-500" />
//             Report Content
//           </h3>

//           <Controller
//             name="content"
//             control={control}
//             render={({ field }) => (
//               <RichEditor
//                 value={field.value}
//                 onChange={field.onChange}
//                 placeholder="Start writing the astrology report…"
//                 error={errors.content?.message}
//                 minHeight="400px"
//               />
//             )}
//           />
//         </div>

//         {/* Actions */}
//         <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
//           <div className="text-xs text-gray-500">
//             {content?.replace(/<[^>]+>/g, "").length ?? 0} characters
//             {errors.content && (
//               <span className="text-red-500 ml-2">
//                 ⚠ {errors.content.message}
//               </span>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             {previewReport && (
//               <>
//                 <Button type="button" variant="secondary" onClick={handleDownloadPDF} loading={generating}>
//                   <Download size={14} />
//                   Download PDF
//                 </Button>

//                 <Button type="button" variant="secondary">
//                   <Eye size={14} />
//                   Preview
//                 </Button>
//               </>
//             )}

//             <Button type="submit" loading={isSubmitting} variant="primary" size="lg">
//               <FileText size={15} />
//               {created ? "Recreate Report" : "Create Report"}
//             </Button>
//           </div>
//         </div>

//       </form>

//       <ReportPreviewModal
//         open={!!previewReport && created}
//         onClose={() => setCreated(false)}
//         report={previewReport}
//       />
//     </div>
//   );
// }



"use client";

import { useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema, type ReportSchema } from "@/lib/schemas";
import { useCustomers } from "@/hooks/useCustomers";
import { generateReportPDF } from "@/lib/pdf-generator";
import { parseDocxToHtml } from "@/lib/docx-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/editor/rich-editor";
import { ReportPreviewModal } from "@/components/dashboard/report-preview-modal";
import type { Report, ReportTemplate } from "@/types";
import {
  Sparkles, FileText, PenLine, User, Eye,
  Download, Send, CheckCircle2, Star,
  Upload, X, FileUp, AlertCircle, Loader2,
  BookOpen, Wand2, ChevronRight,
} from "lucide-react";


const TEMPLATES = [
  {
    id: "free" as const,
    label: "Free",
    desc: "Basic report with essential insights",
    icon: <FileText size={20} />,
  },
  {
    id: "Basic Horoscope" as const,
    label: "Basic Horoscope",
    desc: "Detailed analysis with remedies",
    icon: <PenLine size={20} />,
  },
  {
    id: "Divine Destiny Report" as const,
    label: "Divine Destiny Report",
    desc: "Comprehensive Jyotish full analysis",
    icon: <Sparkles size={20} />,
  },
] satisfies { id: ReportTemplate; label: string; desc: string; icon: JSX.Element }[];

const STARTER_TEMPLATES: Record<string, string> = {
  free: `<h2>Birth Chart Overview</h2><p>Based on the birth details provided, this report presents a concise analysis of the key planetary positions and their influences on your life.</p><h2>Key Planetary Positions</h2><ul><li>Sun Sign:</li><li>Moon Sign:</li><li>Ascendant (Lagna):</li></ul><h2>Guidance</h2><p>Add your guidance here.</p>`,
  "Basic Horoscope": `<h2>Natal Chart Analysis</h2><p>This Basic Horoscope Report presents a detailed Vedic Jyotish analysis encompassing your natal chart, current planetary transits, and upcoming Dasha periods.</p><h2>Lagna & Planetary Strength</h2><p>Describe the ascendant and key planet positions here.</p><h2>Career & Finance</h2><p>Analysis of the 10th and 2nd house lords...</p><h2>Relationships</h2><p>Analysis of the 7th house...</p><h2>Remedies</h2><ul><li>Gemstone recommendation:</li><li>Mantra:</li><li>Charity:</li></ul>`,
  "Divine Destiny Report": `<h2>Executive Summary</h2><p>This Divine Destiny Report provides the most comprehensive analysis of your birth chart, combining classical Parashari Jyotish with Jaimini techniques.</p><h2>Natal Chart — Detailed Analysis</h2><p>Ascendant, planets, houses...</p><h2>Vimshottari Dasha</h2><p>Current Dasha period and its implications...</p><h2>Career & Dharma</h2><p>Detailed 10th house analysis...</p><h2>Relationships & Marriage</h2><p>7th house, Venus, Jaimini analysis...</p><h2>Health & Wellness</h2><p>6th house, Moon, Ascendant lord...</p><h2>Spiritual Path</h2><p>9th house, 12th house, Ketu...</p><h2>Remedies & Prescriptions</h2><ul><li><strong>Gemstone:</strong></li><li><strong>Yantra:</strong></li><li><strong>Mantra:</strong></li><li><strong>Fasting:</strong></li><li><strong>Charity:</strong></li></ul><h2>Conclusion</h2><p>Summary and blessings...</p>`,
};


interface DocxUploadCardProps {
  onImport: (html: string, filename: string) => void;
}

function DocxUploadCard({ onImport }: DocxUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "parsing" | "done" | "error"
  >("idle");
  const [info, setInfo] = useState<{
    name: string;
    pages: number;
    warnings: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".docx")) {
        setStatus("error");
        setErrorMsg("Only .docx files are supported. Please upload a Word document.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setStatus("error");
        setErrorMsg("File is too large (max 20 MB).");
        return;
      }

      setStatus("parsing");
      setErrorMsg("");
      setInfo(null);

      try {
        const result = await parseDocxToHtml(file);
        setInfo({
          name: file.name,
          pages: result.pageEstimate,
          warnings: result.warnings,
        });
        setStatus("done");
        onImport(result.html, file.name.replace(/\.docx$/i, ""));
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMsg("Failed to parse the document. Make sure it is a valid .docx file.");
      }
    },
    [onImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setInfo(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileUp size={14} className="text-amber-500" />
          Import Word Document
          <span className="ml-1 text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-semibold">
            .docx
          </span>
        </h3>
        {status === "done" && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <X size={11} /> Replace file
          </button>
        )}
      </div>

      {/* Drop zone */}
      {status === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 
            border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer
            transition-all duration-200 group
            ${dragOver
              ? "border-amber-400 bg-amber-50"
              : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/40"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Icon */}
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center transition-all
            ${dragOver ? "bg-amber-100" : "bg-white border border-gray-200 group-hover:border-purple-200 group-hover:bg-purple-50"}
          `}>
            <Upload size={22} className={dragOver ? "text-amber-500" : "text-gray-400 group-hover:text-purple-500"} />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {dragOver ? "Drop your .docx here" : "Drag & drop your Word file"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              or <span className="text-purple-600 font-medium">click to browse</span>
              &nbsp;· 40–50 pages supported · Max 20 MB
            </p>
          </div>

          {/* What happens note */}
          <div className="flex items-start gap-2 mt-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-left max-w-sm">
            <Wand2 size={13} className="text-purple-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Your document will be parsed and re-applied with the <strong className="text-gray-700">Vedic template</strong> — header, footer &amp; decorative border on every page.
            </p>
          </div>
        </div>
      )}

      {/* Parsing state */}
      {status === "parsing" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/40">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Loader2 size={22} className="text-purple-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Parsing document…</p>
            <p className="text-xs text-gray-400 mt-0.5">Extracting content & applying Vedic template</p>
          </div>
          {/* Fake progress bar */}
          <div className="w-48 h-1.5 bg-purple-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full animate-[progress_2s_ease-in-out_infinite]"
              style={{ width: "70%", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {/* Success state */}
      {status === "done" && info && (
        <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 truncate">{info.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <BookOpen size={10} />
                  ~{info.pages} pages detected
                </span>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Content imported into editor
                </span>
              </div>
              {info.warnings.length > 0 && (
                <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={9} />
                  {info.warnings.length} formatting note(s) — complex styles may need adjustment
                </p>
              )}
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {["Content Extracted", "Vedic Header", "Vedic Footer", "Page Border", "PDF Ready"].map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-0.5 bg-white border border-green-200 text-green-700 rounded-full font-medium">
                  ✓ {step}
                </span>
                {i < 4 && <ChevronRight size={9} className="text-green-300" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Import failed</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-xs text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CreateReportPage() {
  const { customers, loading } = useCustomers();
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
      template: "free",
      adminNotes: "",
    },
  });

  const [selectedTemplate, content, userId] = watch(["template", "content", "userId"]);
  const selectedCustomer = customers.find((c) => c._id === userId) ?? null;

  const applyTemplate = useCallback(
    (tplId: ReportSchema["template"]) => {
      setValue("template", tplId, { shouldValidate: true });
      if (!content || content === "" || content.startsWith("<")) {
        setValue("content", STARTER_TEMPLATES[tplId] ?? "", { shouldValidate: false });
      }
    },
    [setValue, content]
  );

  // Called when DOCX is imported
  const handleDocxImport = useCallback(
    (html: string, filename: string) => {
      setValue("content", html, { shouldValidate: false });
      // Auto-set report title if empty
      const currentTitle = watch("title");
      if (!currentTitle) {
        setValue("title", filename, { shouldValidate: false });
      }
    },
    [setValue, watch]
  );

  const buildReport = (data: ReportSchema): Report => ({
    id: `r-${Date.now()}`,
    userId: data.userId,
    userName: selectedCustomer?.name ?? "Unknown",
    userEmail: selectedCustomer?.email ?? "",
    title: data.title,
    content: data.content,
    template: data.template,
    status: "created",
    createdAt: new Date().toISOString(),
    adminNotes: data.adminNotes,
  });

  const onSubmit = async (data: ReportSchema) => {
    await new Promise((r) => setTimeout(r, 400));
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

        {/* ── Template selector ────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-purple-500" />
            Choose Template
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl.id)}
                className={`
                  relative p-4 rounded-xl border text-left transition-all duration-200
                  ${selectedTemplate === tpl.id
                    ? "border-purple-400 bg-purple-50 shadow-sm"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }
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
                <p className={`font-semibold text-sm mb-0.5 ${selectedTemplate === tpl.id ? "text-gray-900" : "text-gray-700"}`}>
                  {tpl.label}
                </p>
                <p className="text-xs text-gray-500 leading-tight">{tpl.desc}</p>
                <Badge className="mt-2 bg-gray-100 text-gray-700 border border-gray-200">
                  <Star size={8} className="mr-1" />
                  {tpl.label}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* ── Client + Title ───────────────────────────────────────────── */}
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
                    ...customers.map((c) => ({
                      value: c._id,
                      label: `${c.fullName} (${c.planName})`,
                    })),
                  ]}
                />
              )}
            />

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs font-medium text-gray-900">{selectedCustomer.name}</p>
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
                <p className="text-xs text-red-500">⚠ {errors.adminNotes.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── DOCX Upload ──────────────────────────────────────────────── */}
        <DocxUploadCard onImport={handleDocxImport} />

        {/* ── Rich Text Editor ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <PenLine size={14} className="text-purple-500" />
              Report Content
            </h3>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <FileText size={10} />
              You can type directly or import a .docx above
            </span>
          </div>

          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Start writing the astrology report… or import a Word document above ↑"
                error={errors.content?.message}
                minHeight="420px"
              />
            )}
          />
        </div>

        {/* ── Action bar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-xs text-gray-500">
            {content?.replace(/<[^>]+>/g, "").length ?? 0} characters
            {errors.content && (
              <span className="text-red-500 ml-2">⚠ {errors.content.message}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previewReport && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadPDF}
                  loading={generating}
                >
                  <Download size={14} />
                  {generating ? "Generating…" : "Download PDF"}
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