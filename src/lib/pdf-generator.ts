// "use client";

// import type { Report, Customer } from "@/types";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type TextBlock =
//   | { kind: "h2"; text: string }
//   | { kind: "h3"; text: string }
//   | { kind: "p"; text: string; bold?: boolean }
//   | { kind: "bullet"; text: string }
//   | { kind: "numbered"; text: string; num: number }
//   | { kind: "divider" }
//   | { kind: "blockquote"; text: string }
//   | { kind: "table"; rows: TableRow[] };

// interface TableRow {
//   cells: TableCell[];
//   isHeader: boolean;
// }

// interface TableCell {
//   text: string;
//   bold: boolean;
//   colspan: number;
// }

// // ─── Inline HTML stripper ─────────────────────────────────────────────────────

// function stripInline(s: string): string {
//   return s
//     .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "$1")
//     .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "$1")
//     .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "$1")
//     .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "$1")
//     .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
//     .replace(/<br\s*\/?>/gi, " ")
//     .replace(/<[^>]+>/g, "")
//     .replace(/&amp;/g, "&")
//     .replace(/&lt;/g, "<")
//     .replace(/&gt;/g, ">")
//     .replace(/&nbsp;/g, " ")
//     .replace(/&#8203;/g, "")
//     .replace(/\s{2,}/g, " ")
//     .trim();
// }

// function hasStrongChild(cellHtml: string): boolean {
//   return /<strong|<b[ >]/i.test(cellHtml);
// }

// // ─── Table parser ─────────────────────────────────────────────────────────────

// function parseTable(tableHtml: string): TableRow[] {
//   const rows: TableRow[] = [];

//   // Match each <tr>
//   const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
//   let trMatch: RegExpExecArray | null;

//   while ((trMatch = trPattern.exec(tableHtml)) !== null) {
//     const rowHtml = trMatch[1];
//     const cells: TableCell[] = [];

//     // Match <th> or <td> — handle colspan attribute
//     const cellPattern = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
//     let cellMatch: RegExpExecArray | null;
//     let isHeader = false;

//     while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
//       const tag = cellMatch[1].toLowerCase();
//       const attrs = cellMatch[2];
//       const cellHtml = cellMatch[3];

//       if (tag === "th") isHeader = true;

//       // Extract colspan
//       const colspanMatch = attrs.match(/colspan=['""]?(\d+)['""]?/i);
//       const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;

//       cells.push({
//         text: stripInline(cellHtml),
//         bold: tag === "th" || hasStrongChild(cellHtml),
//         colspan,
//       });
//     }

//     if (cells.length > 0) {
//       rows.push({ cells, isHeader });
//     }
//   }

//   return rows;
// }

// // ─── HTML → Block list (now handles <table>) ──────────────────────────────────

// function htmlToBlocks(html: string): TextBlock[] {
//   const blocks: TextBlock[] = [];

//   // We need to handle tables specially — extract them first with placeholders
//   const tableMap: Map<string, TableRow[]> = new Map();
//   let tableIndex = 0;

//   const htmlWithPlaceholders = html.replace(
//     /<table[\s\S]*?<\/table>/gi,
//     (match) => {
//       const key = `__TABLE_${tableIndex++}__`;
//       tableMap.set(key, parseTable(match));
//       return `<p>${key}</p>`;
//     }
//   );

//   // Normalise remaining HTML
//   const normalised = htmlWithPlaceholders
//     .replace(/\r?\n/g, " ")
//     .replace(/\s{2,}/g, " ");

//   const tagPattern =
//     /<(h2|h3|h4|h1|p|li|blockquote|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;

//   let olCounter = 0;
//   let lastTag = "";

//   let match: RegExpExecArray | null;
//   const re = new RegExp(tagPattern.source, "gi");

//   while ((match = re.exec(normalised)) !== null) {
//     const tag = (match[1] ?? "hr").toLowerCase();
//     const inner = match[3] ?? "";

//     if (tag === "hr") {
//       blocks.push({ kind: "divider" });
//       lastTag = "hr";
//       continue;
//     }

//     const text = stripInline(inner);

//     // Check if this is a table placeholder
//     if (tag === "p" && text.startsWith("__TABLE_") && tableMap.has(text)) {
//       blocks.push({ kind: "table", rows: tableMap.get(text)! });
//       lastTag = "table";
//       continue;
//     }

//     if (!text) continue;

//     if (tag === "h1" || tag === "h2" || tag === "h4") {
//       blocks.push({ kind: "h2", text });
//     } else if (tag === "h3") {
//       blocks.push({ kind: "h3", text });
//     } else if (tag === "blockquote") {
//       blocks.push({ kind: "blockquote", text });
//     } else if (tag === "li") {
//       // Detect if inside <ol> by checking lastTag — heuristic
//       blocks.push({ kind: "bullet", text });
//     } else if (tag === "p") {
//       // Detect bold paragraph (acts as a sub-heading)
//       const isBold = /<strong|<b[ >]/i.test(inner);
//       blocks.push({ kind: "p", text, bold: isBold });
//     }

//     lastTag = tag;
//   }

//   // Fallback: plain text
//   if (blocks.length === 0 && html.trim()) {
//     const plain = stripInline(html);
//     plain.split(/\n+/).forEach((line) => {
//       if (line.trim()) blocks.push({ kind: "p", text: line.trim() });
//     });
//   }

//   return blocks;
// }

// // ─── Table renderer ───────────────────────────────────────────────────────────

// function renderTable(
//   doc: import("jspdf").jsPDF,
//   rows: TableRow[],
//   state: RenderState,
//   report: Report,
//   customer?: Customer | null
// ): void {
//   if (rows.length === 0) return;

//   const { margin, contentW, pageW, pageH } = state;

//   // Determine column count (max cells in any row, accounting for colspan)
//   let colCount = 0;
//   for (const row of rows) {
//     const spanTotal = row.cells.reduce((sum, c) => sum + c.colspan, 0);
//     if (spanTotal > colCount) colCount = spanTotal;
//   }
//   if (colCount === 0) return;

//   // Equal column widths (can be improved with content-aware sizing)
//   const colWidth = contentW / colCount;

//   // Row height — dynamic based on cell content wrapping
//   const fontSize = 8.5;
//   const cellPadX = 2.5;
//   const cellPadY = 2;
//   const lineH = 4.5;

//   doc.setFontSize(fontSize);

//   for (const row of rows) {
//     // Calculate this row's height based on tallest wrapped cell
//     let maxLines = 1;
//     let colCursor = 0;
//     for (const cell of row.cells) {
//       const cellW = colWidth * cell.colspan - cellPadX * 2;
//       const wrapped = doc.splitTextToSize(cell.text || " ", Math.max(cellW, 8));
//       if (wrapped.length > maxLines) maxLines = wrapped.length;
//       colCursor += cell.colspan;
//     }
//     const rowH = maxLines * lineH + cellPadY * 2;

//     // Page break if needed
//     ensureSpace(doc, state, rowH + 2, report, customer);

//     // Draw cells
//     colCursor = 0;
//     for (const cell of row.cells) {
//       const x = margin + colCursor * colWidth;
//       const w = colWidth * cell.colspan;

//       // Cell background
//       if (row.isHeader || cell.bold) {
//         doc.setFillColor(35, 15, 65);        // dark purple header
//         doc.rect(x, state.y, w, rowH, "F");
//       } else {
//         // Alternate rows
//         const rowIndex = rows.indexOf(row);
//         if (rowIndex % 2 === 0) {
//           doc.setFillColor(248, 245, 255);   // very light purple
//         } else {
//           doc.setFillColor(255, 255, 255);   // white
//         }
//         doc.rect(x, state.y, w, rowH, "F");
//       }

//       // Cell border
//       doc.setDrawColor(180, 150, 230);
//       doc.setLineWidth(0.25);
//       doc.rect(x, state.y, w, rowH, "S");

//       // Cell text
//       const textX = x + cellPadX;
//       const textY = state.y + cellPadY + lineH * 0.8;
//       const cellW = w - cellPadX * 2;

//       if (row.isHeader || cell.bold) {
//         doc.setFont("helvetica", "bold");
//         doc.setTextColor(245, 192, 50);      // gold text on dark bg
//       } else {
//         doc.setFont("helvetica", "normal");
//         doc.setTextColor(30, 20, 50);
//       }

//       const wrapped = doc.splitTextToSize(cell.text || "", Math.max(cellW, 8));
//       wrapped.forEach((line: string, li: number) => {
//         doc.text(line, textX, textY + li * lineH);
//       });

//       colCursor += cell.colspan;
//     }

//     state.y += rowH;
//   }

//   // Bottom gap after table
//   state.y += 4;
// }

// // ─── Vedic border ─────────────────────────────────────────────────────────────

// function drawVedicBorder(
//   doc: import("jspdf").jsPDF,
//   pageW: number,
//   pageH: number
// ) {
//   const m = 8;
//   doc.setDrawColor(201, 138, 4);
//   doc.setLineWidth(1.2);
//   doc.rect(m, m, pageW - m * 2, pageH - m * 2);
//   doc.setDrawColor(120, 30, 30);
//   doc.setLineWidth(0.4);
//   doc.rect(m + 3, m + 3, pageW - (m + 3) * 2, pageH - (m + 3) * 2);
//   // Corner ornaments
//   doc.setFillColor(201, 138, 4);
//   [[m, m], [pageW - m, m], [m, pageH - m], [pageW - m, pageH - m]].forEach(
//     ([cx, cy]) => doc.rect(cx - 2, cy - 2, 4, 4, "F")
//   );
// }

// // ─── Header ───────────────────────────────────────────────────────────────────

// function drawHeader(
//   doc: import("jspdf").jsPDF,
//   pageW: number,
//   report: Report
// ) {
//   const margin = 14;
//   doc.setFillColor(25, 10, 48);
//   doc.rect(0, 0, pageW, 44, "F");
//   doc.setFillColor(201, 138, 4);
//   doc.rect(0, 0, pageW, 2.5, "F");

//   doc.setTextColor(245, 192, 50);
//   doc.setFontSize(16);
//   doc.setFont("helvetica", "bold");
//   doc.text("Cosmic Remedies", margin, 16);

//   doc.setTextColor(190, 160, 255);
//   doc.setFontSize(8);
//   doc.setFont("helvetica", "normal");
//   doc.text("Personalized Vedic Astrology Solutions", margin, 23);

//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(8.5);
//   doc.setFont("helvetica", "bold");
//   const titleShort =
//     report.title.length > 55 ? report.title.slice(0, 52) + "…" : report.title;
//   doc.text(titleShort, pageW - margin, 16, { align: "right" });

//   doc.setFillColor(120, 40, 200);
//   doc.roundedRect(pageW - margin - 36, 20, 36, 8, 1.5, 1.5, "F");
//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(6.5);
//   doc.text(
//     report.template.toUpperCase(),
//     pageW - margin - 18,
//     25.5,
//     { align: "center" }
//   );

//   doc.setTextColor(160, 140, 200);
//   doc.setFontSize(7.5);
//   doc.setFont("helvetica", "normal");
//   const dateStr = new Date(report.createdAt).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//   });
//   doc.text(`Generated: ${dateStr}`, margin, 38);
//   doc.text(`ID: ${report.id.toUpperCase()}`, pageW - margin, 38, { align: "right" });

//   doc.setDrawColor(201, 138, 4);
//   doc.setLineWidth(0.6);
//   doc.line(margin, 44, pageW - margin, 44);
// }

// // ─── Footer ───────────────────────────────────────────────────────────────────

// function drawFooter(
//   doc: import("jspdf").jsPDF,
//   pageW: number,
//   pageH: number,
//   pageNum: number,
//   totalPages: number
// ) {
//   const margin = 14;
//   doc.setDrawColor(201, 138, 4);
//   doc.setLineWidth(0.4);
//   doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
//   doc.setFillColor(25, 10, 48);
//   doc.rect(0, pageH - 12, pageW, 12, "F");
//   doc.setTextColor(160, 130, 210);
//   doc.setFontSize(7.5);
//   doc.setFont("helvetica", "normal");
//   doc.text("© Vedic Cosmos — Confidential Jyotish Report", margin, pageH - 5);
//   doc.setTextColor(245, 192, 50);
//   doc.setFont("helvetica", "bold");
//   doc.text(`ॐ  Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 5, {
//     align: "right",
//   });
// }

// // ─── Page-break guard ─────────────────────────────────────────────────────────

// interface RenderState {
//   y: number;
//   pageW: number;
//   pageH: number;
//   margin: number;
//   contentW: number;
// }

// function ensureSpace(
//   doc: import("jspdf").jsPDF,
//   state: RenderState,
//   needed: number,
//   report: Report,
//   customer?: Customer | null
// ): void {
//   if (state.y + needed > state.pageH - 22) {
//     doc.addPage();
//     drawVedicBorder(doc, state.pageW, state.pageH);
//     drawHeader(doc, state.pageW, report);
//     state.y = 52;
//   }
// }

// // ─── Main export ──────────────────────────────────────────────────────────────

// export async function generateReportPDF(
//   report: Report,
//   customer?: Customer | null
// ): Promise<void> {
//   const { jsPDF } = await import("jspdf");

//   const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
//   const pageW = doc.internal.pageSize.getWidth();
//   const pageH = doc.internal.pageSize.getHeight();
//   const margin = 14;
//   const contentW = pageW - margin * 2;

//   drawVedicBorder(doc, pageW, pageH);
//   drawHeader(doc, pageW, report);

//   const state: RenderState = { y: 52, pageW, pageH, margin, contentW };

//   // ── Client info ──────────────────────────────────────────────────────────
//   if (customer) {
//     ensureSpace(doc, state, 42, report, customer);
//     doc.setFillColor(245, 238, 255);
//     doc.roundedRect(margin, state.y, contentW, 38, 2.5, 2.5, "F");
//     doc.setDrawColor(180, 140, 240);
//     doc.setLineWidth(0.3);
//     doc.roundedRect(margin, state.y, contentW, 38, 2.5, 2.5, "S");
//     doc.setFontSize(7.5);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(80, 30, 160);
//     doc.text("✦  CLIENT DETAILS", margin + 5, state.y + 7);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(40, 30, 70);
//     doc.setFontSize(8.5);
//     const col1 = margin + 5;
//     const col2 = margin + contentW / 2 + 2;
//     doc.text(`Name:  ${customer.name}`, col1, state.y + 15);
//     doc.text(`Email:  ${customer.email}`, col1, state.y + 23);
//     doc.text(`DOB:  ${customer.dob}`, col2, state.y + 15);
//     doc.text(`TOB:  ${customer.tob}`, col2, state.y + 23);
//     doc.text(`Place: ${customer.pobCity}, ${customer.pobCountry ?? ""}`, col2, state.y + 31);
//     state.y += 44;
//   }

//   if (customer?.concern) {
//     ensureSpace(doc, state, 18, report, customer);
//     doc.setFillColor(255, 248, 224);
//     doc.roundedRect(margin, state.y, contentW, 13, 2, 2, "F");
//     doc.setDrawColor(220, 160, 20);
//     doc.setLineWidth(0.3);
//     doc.roundedRect(margin, state.y, contentW, 13, 2, 2, "S");
//     doc.setFontSize(8.5);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(110, 70, 0);
//     doc.text("Concern: ", margin + 5, state.y + 9);
//     doc.setFont("helvetica", "normal");
//     doc.text(customer.concern, margin + 25, state.y + 9);
//     state.y += 18;
//   }

//   // ── Report body ──────────────────────────────────────────────────────────
//   const blocks = htmlToBlocks(report.content);

//   for (const block of blocks) {

//     // TABLE ──────────────────────────────────────────────────────────────────
//     if (block.kind === "table") {
//       state.y += 2; // small top gap before table
//       renderTable(doc, block.rows, state, report, customer);
//       continue;
//     }

//     // DIVIDER ────────────────────────────────────────────────────────────────
//     if (block.kind === "divider") {
//       ensureSpace(doc, state, 8, report, customer);
//       doc.setDrawColor(190, 150, 240);
//       doc.setLineWidth(0.3);
//       doc.line(margin + 10, state.y + 2, pageW - margin - 10, state.y + 2);
//       state.y += 6;
//       continue;
//     }

//     // H2 ─────────────────────────────────────────────────────────────────────
//     if (block.kind === "h2") {
//       ensureSpace(doc, state, 18, report, customer);
//       doc.setFillColor(35, 15, 65);
//       doc.rect(margin, state.y, contentW, 10, "F");
//       doc.setFillColor(201, 138, 4);
//       doc.rect(margin, state.y, 3, 10, "F");
//       doc.setFontSize(11);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(245, 192, 50);
//       const h2Lines = doc.splitTextToSize(block.text, contentW - 10);
//       doc.text(h2Lines[0], margin + 7, state.y + 7);
//       state.y += 14;
//       continue;
//     }

//     // H3 ─────────────────────────────────────────────────────────────────────
//     if (block.kind === "h3") {
//       ensureSpace(doc, state, 12, report, customer);
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(160, 100, 240);
//       doc.text("▸  " + block.text, margin, state.y + 6);
//       doc.setDrawColor(160, 100, 240);
//       doc.setLineWidth(0.2);
//       doc.line(margin, state.y + 8, margin + contentW * 0.4, state.y + 8);
//       state.y += 12;
//       continue;
//     }

//     // BLOCKQUOTE ─────────────────────────────────────────────────────────────
//     if (block.kind === "blockquote") {
//       const lines = doc.splitTextToSize(block.text, contentW - 14);
//       const boxH = lines.length * 5.5 + 8;
//       ensureSpace(doc, state, boxH, report, customer);
//       doc.setFillColor(245, 240, 255);
//       doc.rect(margin, state.y, contentW, boxH, "F");
//       doc.setFillColor(120, 60, 200);
//       doc.rect(margin, state.y, 3, boxH, "F");
//       doc.setFontSize(9);
//       doc.setFont("helvetica", "bolditalic");
//       doc.setTextColor(80, 40, 140);
//       lines.forEach((line: string, i: number) => {
//         doc.text(line, margin + 7, state.y + 6 + i * 5.5);
//       });
//       state.y += boxH + 4;
//       continue;
//     }

//     // BULLET ─────────────────────────────────────────────────────────────────
//     if (block.kind === "bullet") {
//       const lines = doc.splitTextToSize(block.text, contentW - 10);
//       ensureSpace(doc, state, lines.length * 5 + 2, report, customer);
//       doc.setFillColor(201, 138, 4);
//       doc.circle(margin + 2.5, state.y + 3.5, 1, "F");
//       doc.setFontSize(9.5);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(30, 20, 50);
//       lines.forEach((line: string, i: number) => {
//         doc.text(line, margin + 7, state.y + 5 + i * 5);
//       });
//       state.y += lines.length * 5 + 3;
//       continue;
//     }

//     // NUMBERED ───────────────────────────────────────────────────────────────
//     if (block.kind === "numbered") {
//       const lines = doc.splitTextToSize(block.text, contentW - 12);
//       ensureSpace(doc, state, lines.length * 5 + 2, report, customer);
//       doc.setFontSize(9.5);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(160, 100, 240);
//       doc.text(`${block.num}.`, margin + 1, state.y + 5);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(30, 20, 50);
//       lines.forEach((line: string, i: number) => {
//         doc.text(line, margin + 8, state.y + 5 + i * 5);
//       });
//       state.y += lines.length * 5 + 3;
//       continue;
//     }

//     // PARAGRAPH ──────────────────────────────────────────────────────────────
//     const lines = doc.splitTextToSize(block.text, contentW);
//     ensureSpace(doc, state, lines.length * 5.5 + 3, report, customer);
//     doc.setFontSize(9.5);
//     doc.setFont("helvetica", (block as any).bold ? "bold" : "normal");
//     doc.setTextColor(30, 20, 50);
//     lines.forEach((line: string, i: number) => {
//       doc.text(line, margin, state.y + 5.5 * (i + 1));
//     });
//     state.y += lines.length * 5.5 + 4;
//   }

//   // ── Admin notes ──────────────────────────────────────────────────────────
//   if (report.adminNotes?.trim()) {
//     ensureSpace(doc, state, 20, report, customer);
//     state.y += 4;
//     doc.setDrawColor(200, 180, 240);
//     doc.setLineWidth(0.3);
//     doc.line(margin, state.y, pageW - margin, state.y);
//     state.y += 6;
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bolditalic");
//     doc.setTextColor(120, 90, 180);
//     doc.text("Admin Notes:", margin, state.y);
//     state.y += 5;
//     doc.setFont("helvetica", "italic");
//     doc.setTextColor(100, 80, 140);
//     const noteLines = doc.splitTextToSize(report.adminNotes, contentW);
//     noteLines.forEach((line: string) => {
//       doc.text(line, margin, state.y);
//       state.y += 5;
//     });
//   }

//   // ── Footers on every page ─────────────────────────────────────────────────
//   const totalPages = doc.getNumberOfPages();
//   for (let i = 1; i <= totalPages; i++) {
//     doc.setPage(i);
//     drawFooter(doc, pageW, pageH, i, totalPages);
//   }

//   doc.save(`${report.title.replace(/\s+/g, "_")}_vedic_report.pdf`);
// }



"use client";

import type { Report, Customer } from "@/types";


type TextBlock =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string; bold?: boolean }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; text: string; num: number }
  | { kind: "divider" }
  | { kind: "blockquote"; text: string }
  | { kind: "table"; rows: TableRow[] };

interface TableRow {
  cells: TableCell[];
  isHeader: boolean;
}

interface TableCell {
  text: string;
  bold: boolean;
  colspan: number;
}

//
// jsPDF ships only with Latin fonts (Helvetica, Times, Courier).
// Sanskrit / Devanagari (U+0900–U+097F) needs a Unicode TTF embedded at runtime.
//
// Strategy:
//   1. Fonts are placed in /public/fonts/ as standard TTF files.
//   2. At PDF-generation time we fetch() them → ArrayBuffer → base64.
//   3. We call doc.addFileToVFS() + doc.addFont() to register them.
//   4. All doc.setFont() calls use "NotoSans" instead of "helvetica".
//
// Font files needed in /public/fonts/:
//   NotoSans-Regular.ttf   (~133 KB)
//   NotoSans-Bold.ttf      (~94 KB)
//
// These are subsetted FreeSans TTFs (Latin + Devanagari) generated via fonttools.
// See: scripts/subset-fonts.py  (or copy from the repo assets folder)

async function arrayBufferToBase64(buf: ArrayBuffer): Promise<string> {
  // Use FileReader for browser compatibility (no Buffer in browser)
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf]);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl = "data:application/octet-stream;base64,AAEC..."
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface LoadedFonts {
  regular: string; // base64
  bold: string;    // base64
}

let _fontCache: LoadedFonts | null = null;

async function loadFonts(): Promise<LoadedFonts> {
  if (_fontCache) return _fontCache;

  const [regRes, boldRes] = await Promise.all([
    fetch("/fonts/NotoSans-Regular.ttf"),
    fetch("/fonts/NotoSans-Bold.ttf"),
  ]);

  if (!regRes.ok || !boldRes.ok) {
    throw new Error(
      "Could not load Vedic fonts from /public/fonts/. " +
      "Make sure NotoSans-Regular.ttf and NotoSans-Bold.ttf are in /public/fonts/."
    );
  }

  const [regBuf, boldBuf] = await Promise.all([
    regRes.arrayBuffer(),
    boldRes.arrayBuffer(),
  ]);

  _fontCache = {
    regular: await arrayBufferToBase64(regBuf),
    bold: await arrayBufferToBase64(boldBuf),
  };

  return _fontCache;
}

function registerFonts(doc: import("jspdf").jsPDF, fonts: LoadedFonts): void {
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
}

// ─── Inline HTML stripper ─────────────────────────────────────────────────────

function stripInline(s: string): string {
  return s
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "$1")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "$1")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "$1")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "$1")
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8203;/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hasStrongChild(cellHtml: string): boolean {
  return /<strong|<b[ >]/i.test(cellHtml);
}

// ─── Table parser ─────────────────────────────────────────────────────────────

function parseTable(tableHtml: string): TableRow[] {
  const rows: TableRow[] = [];
  const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trPattern.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1];
    const cells: TableCell[] = [];
    const cellPattern = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;
    let isHeader = false;

    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      const tag = cellMatch[1].toLowerCase();
      const attrs = cellMatch[2];
      const cellHtml = cellMatch[3];
      if (tag === "th") isHeader = true;
      const colspanMatch = attrs.match(/colspan=['""]?(\d+)['""]?/i);
      const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;
      cells.push({ text: stripInline(cellHtml), bold: tag === "th" || hasStrongChild(cellHtml), colspan });
    }

    if (cells.length > 0) rows.push({ cells, isHeader });
  }

  return rows;
}


function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const tableMap = new Map<string, TableRow[]>();
  let tableIndex = 0;

  const htmlWithPlaceholders = html.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    const key = `__TABLE_${tableIndex++}__`;
    tableMap.set(key, parseTable(match));
    return `<p>${key}</p>`;
  });

  const normalised = htmlWithPlaceholders.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ");
  const re = /<(h2|h3|h4|h1|p|li|blockquote|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let match: RegExpExecArray | null;
  let lastTag = "";

  while ((match = re.exec(normalised)) !== null) {
    const tag = (match[1] ?? "hr").toLowerCase();
    const inner = match[3] ?? "";

    if (tag === "hr") { blocks.push({ kind: "divider" }); lastTag = "hr"; continue; }

    const text = stripInline(inner);

    if (tag === "p" && text.startsWith("__TABLE_") && tableMap.has(text)) {
      blocks.push({ kind: "table", rows: tableMap.get(text)! });
      lastTag = "table";
      continue;
    }

    if (!text) continue;

    if (tag === "h1" || tag === "h2" || tag === "h4") blocks.push({ kind: "h2", text });
    else if (tag === "h3") blocks.push({ kind: "h3", text });
    else if (tag === "blockquote") blocks.push({ kind: "blockquote", text });
    else if (tag === "li") blocks.push({ kind: "bullet", text });
    else if (tag === "p") {
      const isBold = /<strong|<b[ >]/i.test(inner);
      blocks.push({ kind: "p", text, bold: isBold });
    }
    lastTag = tag;
  }

  if (blocks.length === 0 && html.trim()) {
    stripInline(html).split(/\n+/).forEach((line) => {
      if (line.trim()) blocks.push({ kind: "p", text: line.trim() });
    });
  }

  return blocks;
}


function renderTable(
  doc: import("jspdf").jsPDF,
  rows: TableRow[],
  state: RenderState,
  report: Report,
  customer?: Customer | null
): void {
  if (rows.length === 0) return;
  const { margin, contentW } = state;

  let colCount = 0;
  for (const row of rows) {
    const spanTotal = row.cells.reduce((sum, c) => sum + c.colspan, 0);
    if (spanTotal > colCount) colCount = spanTotal;
  }
  if (colCount === 0) return;

  const colWidth = contentW / colCount;
  const cellPadX = 2.5;
  const cellPadY = 2;
  const lineH = 4.5;

  doc.setFontSize(8.5);

  for (const row of rows) {
    let maxLines = 1;
    for (const cell of row.cells) {
      const cellW = colWidth * cell.colspan - cellPadX * 2;
      const wrapped = doc.splitTextToSize(cell.text || " ", Math.max(cellW, 8));
      if (wrapped.length > maxLines) maxLines = wrapped.length;
    }
    const rowH = maxLines * lineH + cellPadY * 2;

    ensureSpace(doc, state, rowH + 2, report, customer);

    let colCursor = 0;
    const rowIndex = rows.indexOf(row);
    for (const cell of row.cells) {
      const x = margin + colCursor * colWidth;
      const w = colWidth * cell.colspan;

      if (row.isHeader || cell.bold) {
        doc.setFillColor(35, 15, 65);
      } else {
        rowIndex % 2 === 0 ? doc.setFillColor(248, 245, 255) : doc.setFillColor(255, 255, 255);
      }
      doc.rect(x, state.y, w, rowH, "F");
      doc.setDrawColor(180, 150, 230);
      doc.setLineWidth(0.25);
      doc.rect(x, state.y, w, rowH, "S");

      const textX = x + cellPadX;
      const textY = state.y + cellPadY + lineH * 0.8;
      const cellW = w - cellPadX * 2;

      if (row.isHeader || cell.bold) {
        doc.setFont("NotoSans", "bold");
        doc.setTextColor(245, 192, 50);
      } else {
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(30, 20, 50);
      }

      const wrapped = doc.splitTextToSize(cell.text || "", Math.max(cellW, 8));
      wrapped.forEach((line: string, li: number) => {
        doc.text(line, textX, textY + li * lineH);
      });

      colCursor += cell.colspan;
    }
    state.y += rowH;
  }
  state.y += 4;
}


function drawVedicBorder(doc: import("jspdf").jsPDF, pageW: number, pageH: number) {
  const m = 8;
  doc.setDrawColor(201, 138, 4);
  doc.setLineWidth(1.2);
  doc.rect(m, m, pageW - m * 2, pageH - m * 2);
  doc.setDrawColor(120, 30, 30);
  doc.setLineWidth(0.4);
  doc.rect(m + 3, m + 3, pageW - (m + 3) * 2, pageH - (m + 3) * 2);
  doc.setFillColor(201, 138, 4);
  [[m, m], [pageW - m, m], [m, pageH - m], [pageW - m, pageH - m]].forEach(
    ([cx, cy]) => doc.rect(cx - 2, cy - 2, 4, 4, "F")
  );
}


function drawHeader(doc: import("jspdf").jsPDF, pageW: number, report: Report) {
  const margin = 14;
  doc.setFillColor(25, 10, 48);
  doc.rect(0, 0, pageW, 44, "F");
  doc.setFillColor(201, 138, 4);
  doc.rect(0, 0, pageW, 2.5, "F");

  doc.setTextColor(245, 192, 50);
  doc.setFontSize(16);
  doc.setFont("NotoSans", "bold");
  doc.text("Cosmic Remedies", margin, 16);

  doc.setTextColor(190, 160, 255);
  doc.setFontSize(8);
  doc.setFont("NotoSans", "normal");
  doc.text("Personalized Vedic Astrology Solutions", margin, 23);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("NotoSans", "bold");
  const titleShort = report.title.length > 55 ? report.title.slice(0, 52) + "…" : report.title;
  doc.text(titleShort, pageW - margin, 16, { align: "right" });

  doc.setFillColor(120, 40, 200);
  doc.roundedRect(pageW - margin - 36, 20, 36, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.text(report.template.toUpperCase(), pageW - margin - 18, 25.5, { align: "center" });

  doc.setTextColor(160, 140, 200);
  doc.setFontSize(7.5);
  doc.setFont("NotoSans", "normal");
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.text(`Generated: ${dateStr}`, margin, 38);
  doc.text(`ID: ${report.id.toUpperCase()}`, pageW - margin, 38, { align: "right" });

  doc.setDrawColor(201, 138, 4);
  doc.setLineWidth(0.6);
  doc.line(margin, 44, pageW - margin, 44);
}


function drawFooter(
  doc: import("jspdf").jsPDF,
  pageW: number, pageH: number,
  pageNum: number, totalPages: number
) {
  const margin = 14;
  doc.setDrawColor(201, 138, 4);
  doc.setLineWidth(0.4);
  doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
  doc.setFillColor(25, 10, 48);
  doc.rect(0, pageH - 12, pageW, 12, "F");

  doc.setTextColor(160, 130, 210);
  doc.setFontSize(7.5);
  doc.setFont("NotoSans", "normal");
  doc.text("© Vedic Cosmos — Confidential Jyotish Report", margin, pageH - 5);

  // ॐ symbol — renders correctly because NotoSans has Devanagari
  doc.setTextColor(245, 192, 50);
  doc.setFont("NotoSans", "bold");
  doc.text(`ॐ  Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
}


interface RenderState {
  y: number;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
}

function ensureSpace(
  doc: import("jspdf").jsPDF,
  state: RenderState,
  needed: number,
  report: Report,
  customer?: Customer | null
): void {
  if (state.y + needed > state.pageH - 22) {
    doc.addPage();
    drawVedicBorder(doc, state.pageW, state.pageH);
    drawHeader(doc, state.pageW, report);
    state.y = 52;
  }
}


export async function generateReportPDF(
  report: Report,
  customer?: Customer | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const fonts = await loadFonts();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  registerFonts(doc, fonts);

  drawVedicBorder(doc, pageW, pageH);
  drawHeader(doc, pageW, report);

  const state: RenderState = { y: 52, pageW, pageH, margin, contentW };

  if (customer) {
    ensureSpace(doc, state, 42, report, customer);
    doc.setFillColor(245, 238, 255);
    doc.roundedRect(margin, state.y, contentW, 38, 2.5, 2.5, "F");
    doc.setDrawColor(180, 140, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, state.y, contentW, 38, 2.5, 2.5, "S");
    doc.setFontSize(7.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(80, 30, 160);
    doc.text("✦  CLIENT DETAILS", margin + 5, state.y + 7);
    doc.setFont("NotoSans", "normal");
    doc.setTextColor(40, 30, 70);
    doc.setFontSize(8.5);
    const col1 = margin + 5;
    const col2 = margin + contentW / 2 + 2;
    doc.text(`Name:  ${customer.name}`, col1, state.y + 15);
    doc.text(`Email:  ${customer.email}`, col1, state.y + 23);
    doc.text(`DOB:  ${customer.dob}`, col2, state.y + 15);
    doc.text(`TOB:  ${customer.tob}`, col2, state.y + 23);
    doc.text(`Place: ${customer.pobCity}, ${customer.pobCountry ?? ""}`, col2, state.y + 31);
    state.y += 44;
  }

  if (customer?.concern) {
    ensureSpace(doc, state, 18, report, customer);
    doc.setFillColor(255, 248, 224);
    doc.roundedRect(margin, state.y, contentW, 13, 2, 2, "F");
    doc.setDrawColor(220, 160, 20);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, state.y, contentW, 13, 2, 2, "S");
    doc.setFontSize(8.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(110, 70, 0);
    doc.text("Concern: ", margin + 5, state.y + 9);
    doc.setFont("NotoSans", "normal");
    doc.text(customer.concern, margin + 25, state.y + 9);
    state.y += 18;
  }

  const blocks = htmlToBlocks(report.content);

  for (const block of blocks) {

    if (block.kind === "table") {
      state.y += 2;
      renderTable(doc, block.rows, state, report, customer);
      continue;
    }

    if (block.kind === "divider") {
      ensureSpace(doc, state, 8, report, customer);
      doc.setDrawColor(190, 150, 240);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, state.y + 2, pageW - margin - 10, state.y + 2);
      state.y += 6;
      continue;
    }

    if (block.kind === "h2") {
      ensureSpace(doc, state, 18, report, customer);
      doc.setFillColor(35, 15, 65);
      doc.rect(margin, state.y, contentW, 10, "F");
      doc.setFillColor(201, 138, 4);
      doc.rect(margin, state.y, 3, 10, "F");
      doc.setFontSize(11);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(245, 192, 50);
      const h2Lines = doc.splitTextToSize(block.text, contentW - 10);
      doc.text(h2Lines[0], margin + 7, state.y + 7);
      state.y += 14;
      continue;
    }

    if (block.kind === "h3") {
      ensureSpace(doc, state, 12, report, customer);
      doc.setFontSize(10);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(160, 100, 240);
      doc.text("▸  " + block.text, margin, state.y + 6);
      doc.setDrawColor(160, 100, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, state.y + 8, margin + contentW * 0.4, state.y + 8);
      state.y += 12;
      continue;
    }

    if (block.kind === "blockquote") {
      const lines = doc.splitTextToSize(block.text, contentW - 14);
      const boxH = lines.length * 5.5 + 8;
      ensureSpace(doc, state, boxH, report, customer);
      doc.setFillColor(245, 240, 255);
      doc.rect(margin, state.y, contentW, boxH, "F");
      doc.setFillColor(120, 60, 200);
      doc.rect(margin, state.y, 3, boxH, "F");
      doc.setFontSize(9);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(80, 40, 140);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 7, state.y + 6 + i * 5.5);
      });
      state.y += boxH + 4;
      continue;
    }

    if (block.kind === "bullet") {
      const lines = doc.splitTextToSize(block.text, contentW - 10);
      ensureSpace(doc, state, lines.length * 5 + 2, report, customer);
      doc.setFillColor(201, 138, 4);
      doc.circle(margin + 2.5, state.y + 3.5, 1, "F");
      doc.setFontSize(9.5);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(30, 20, 50);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 7, state.y + 5 + i * 5);
      });
      state.y += lines.length * 5 + 3;
      continue;
    }

    if (block.kind === "numbered") {
      const lines = doc.splitTextToSize(block.text, contentW - 12);
      ensureSpace(doc, state, lines.length * 5 + 2, report, customer);
      doc.setFontSize(9.5);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(160, 100, 240);
      doc.text(`${block.num}.`, margin + 1, state.y + 5);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(30, 20, 50);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 8, state.y + 5 + i * 5);
      });
      state.y += lines.length * 5 + 3;
      continue;
    }

    // Paragraph
    const lines = doc.splitTextToSize(block.text, contentW);
    ensureSpace(doc, state, lines.length * 5.5 + 3, report, customer);
    doc.setFontSize(9.5);
    doc.setFont("NotoSans", (block as any).bold ? "bold" : "normal");
    doc.setTextColor(30, 20, 50);
    lines.forEach((line: string, i: number) => {
      doc.text(line, margin, state.y + 5.5 * (i + 1));
    });
    state.y += lines.length * 5.5 + 4;
  }

  // ── Admin notes ────────────────────────────────────────────────────────────
  if (report.adminNotes?.trim()) {
    ensureSpace(doc, state, 20, report, customer);
    state.y += 4;
    doc.setDrawColor(200, 180, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, state.y, pageW - margin, state.y);
    state.y += 6;
    doc.setFontSize(8);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(120, 90, 180);
    doc.text("Admin Notes:", margin, state.y);
    state.y += 5;
    doc.setFont("NotoSans", "normal");
    doc.setTextColor(100, 80, 140);
    const noteLines = doc.splitTextToSize(report.adminNotes, contentW);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, state.y);
      state.y += 5;
    });
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageW, pageH, i, totalPages);
  }

  doc.save(`${report.title.replace(/\s+/g, "_")}_vedic_report.pdf`);
}