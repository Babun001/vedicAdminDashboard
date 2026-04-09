"use client";

import type { Report, Customer } from "@/types";

// Strips HTML tags for plain-text PDF rendering
function stripHtml(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n$1\n" + "─".repeat(40) + "\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "$1")
    .replace(/<em>(.*?)<\/em>/gi, "$1")
    .replace(/<li>(.*?)<\/li>/gi, "  • $1\n")
    .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateReportPDF(
  report: Report,
  customer?: Customer | null
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header background ──────────────────────────────────────────────────────
  doc.setFillColor(20, 10, 40);
  doc.rect(0, 0, pageW, 50, "F");

  // ── Logo / Brand ───────────────────────────────────────────────────────────
  doc.setTextColor(245, 158, 11); // gold
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("✦ Vedic Cosmos", margin, 22);

  doc.setTextColor(180, 143, 255); // cosmos-300
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Jyotish Astrology Reports", margin, 30);

  // Template badge
  const templateLabel = report.template.toUpperCase();
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(pageW - margin - 30, 12, 30, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(templateLabel, pageW - margin - 15, 18.5, { align: "center" });

  y = 58;

  // ── Report Title ───────────────────────────────────────────────────────────
  doc.setTextColor(30, 27, 46);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(report.title, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // ── Meta info ──────────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 90, 130);
  doc.text(`Generated: ${new Date(report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, margin, y);
  doc.text(`Report ID: ${report.id.toUpperCase()}`, pageW - margin, y, { align: "right" });
  y += 6;

  // ── Divider ────────────────────────────────────────────────────────────────
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Client Info Box ────────────────────────────────────────────────────────
  if (customer) {
    doc.setFillColor(245, 240, 255);
    doc.roundedRect(margin, y, contentW, 36, 3, 3, "F");
    doc.setDrawColor(209, 191, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 36, 3, 3, "S");

    doc.setTextColor(93, 33, 182);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT DETAILS", margin + 5, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 40, 80);
    doc.setFontSize(9);

    const col1x = margin + 5;
    const col2x = margin + contentW / 2;
    doc.text(`Name: ${customer.name}`, col1x, y + 15);
    doc.text(`Email: ${customer.email}`, col1x, y + 22);
    doc.text(`Phone: ${customer.phone}`, col1x, y + 29);
    doc.text(`Date of Birth: ${customer.dateOfBirth}`, col2x, y + 15);
    doc.text(`Time of Birth: ${customer.timeOfBirth}`, col2x, y + 22);
    doc.text(`Place of Birth: ${customer.cityOfBirth}, ${customer.countryOfBirth}`, col2x, y + 29);

    y += 44;
  }

  // ── Concern Box ────────────────────────────────────────────────────────────
  if (customer?.primaryConcern) {
    doc.setFillColor(255, 248, 230);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, "S");
    doc.setTextColor(120, 80, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Primary Concern: `, margin + 5, y + 9);
    doc.setFont("helvetica", "normal");
    doc.text(customer.primaryConcern, margin + 40, y + 9);
    y += 20;
  }

  // ── Report Content ─────────────────────────────────────────────────────────
  const plainText = stripHtml(report.content);
  const lines = doc.splitTextToSize(plainText, contentW);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 27, 46);

  lines.forEach((line: string) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    // Section headings detected by "───" separator
    if (line.includes("─".repeat(10))) {
      doc.setDrawColor(200, 190, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, y, margin + contentW, y);
      y += 4;
      return;
    }
    if (line.trim() === "") { y += 3; return; }

    const isBullet = line.startsWith("  •");
    if (isBullet) {
      doc.setTextColor(124, 58, 237);
      doc.text("•", margin, y);
      doc.setTextColor(30, 27, 46);
      doc.text(line.slice(3), margin + 5, y);
    } else {
      doc.text(line, margin, y);
    }
    y += 5.5;
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(20, 10, 40);
    doc.rect(0, 285, pageW, 12, "F");
    doc.setFontSize(8);
    doc.setTextColor(140, 120, 180);
    doc.setFont("helvetica", "normal");
    doc.text("© Vedic Cosmos — Confidential Jyotish Report", margin, 292);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 292, { align: "right" });
  }

  doc.save(`${report.title.replace(/\s+/g, "_")}.pdf`);
}
