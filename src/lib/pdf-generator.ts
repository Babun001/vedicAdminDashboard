"use client";

import type { Report, Customer } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  deepNavy:     [12, 8, 32]       as const,
  navy:         [25, 10, 48]      as const,
  navyMid:      [35, 15, 65]      as const,
  navyLight:    [45, 20, 80]      as const,
  gold:         [201, 138, 4]     as const,
  goldLight:    [245, 192, 50]    as const,
  goldPale:     [253, 233, 139]   as const,
  purple:       [120, 40, 200]    as const,
  purpleSoft:   [176, 100, 240]   as const,
  purpleLight:  [190, 160, 255]   as const,
  parchment:    [250, 245, 235]   as const,
  clientBoxBg:  [245, 238, 255]   as const,
  clientBoxBdr: [180, 140, 240]   as const,
  concernBg:    [255, 248, 224]   as const,
  concernBdr:   [220, 160, 20]    as const,
  blockquoteBg: [245, 240, 255]   as const,
  tableBgEven:  [248, 245, 255]   as const,
  textDark:     [30, 20, 50]      as const,
  textMid:      [80, 40, 140]     as const,
  textLight:    [160, 130, 210]   as const,
  textGold:     [110, 70, 0]      as const,
  footerCopy:   [160, 130, 210]   as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TextBlock =
  | { kind: "h2";        text: string }
  | { kind: "h3";        text: string }
  | { kind: "p";         text: string; bold?: boolean }
  | { kind: "bullet";    text: string }
  | { kind: "numbered";  text: string; num: number }
  | { kind: "divider" }
  | { kind: "blockquote"; text: string }
  | { kind: "table";     rows: TableRow[] }
  | { kind: "image";     src: string; alt?: string; adminW?: number; adminH?: number };

interface TableRow  { cells: TableCell[]; isHeader: boolean; }
interface TableCell { text: string; bold: boolean; colspan: number; }

interface RenderState {
  y:        number;
  pageW:    number;
  pageH:    number;
  margin:   number;
  contentW: number;
}

interface LoadedFonts { regular: string; bold: string; }

interface CompressedImage {
  base64:   string;
  widthPx:  number;
  heightPx: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MAX_PX      = 1200;
const JPEG_QUALITY = 0.82;
const PX_TO_MM    = 25.4 / 96;
const HDR_H       = 48;   // header height in mm – shared everywhere

// ─────────────────────────────────────────────────────────────────────────────
// FONT LOADER
// ─────────────────────────────────────────────────────────────────────────────
let _fontCache: LoadedFonts | null = null;

async function arrayBufferToBase64(buf: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob   = new Blob([buf]);
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadFonts(): Promise<LoadedFonts> {
  if (_fontCache) return _fontCache;
  const [regRes, boldRes] = await Promise.all([
    fetch("/fonts/NotoSans-Regular.ttf"),
    fetch("/fonts/NotoSans-Bold.ttf"),
  ]);
  if (!regRes.ok || !boldRes.ok)
    throw new Error("Could not load NotoSans fonts from /public/fonts/.");
  const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
  _fontCache = {
    regular: await arrayBufferToBase64(regBuf),
    bold:    await arrayBufferToBase64(boldBuf),
  };
  return _fontCache;
}

function registerFonts(doc: import("jspdf").jsPDF, fonts: LoadedFonts): void {
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf",    fonts.bold);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf",    "NotoSans", "bold");
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO LOADER  ← loaded ONCE before PDF generation, stored synchronously
// ─────────────────────────────────────────────────────────────────────────────
let _logoBase64: string | null = null;   // "" = failed, non-empty = ok, null = not tried

async function preloadLogo(): Promise<void> {
  if (_logoBase64 !== null) return;
  try {
    const res = await fetch("/assets/astro-logo-1.png");
    if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`);
    const buf   = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary  = "";
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    _logoBase64 = btoa(binary);
  } catch (err) {
    console.warn("pdf-generator: could not load logo PNG", err);
    _logoBase64 = "";   // mark as failed so we don't retry every page
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function compressImage(
  src: string, adminW?: number, adminH?: number,
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img  = new Image();
    img.onload = () => {
      const { naturalWidth: nW, naturalHeight: nH } = img;
      let cW: number, cH: number;
      if      (adminW && adminH) { cW = adminW; cH = adminH; }
      else if (adminW)           { cW = adminW; cH = Math.round((nH / nW) * adminW); }
      else if (adminH)           { cH = adminH; cW = Math.round((nW / nH) * adminH); }
      else {
        const scale = Math.min(1, MAX_PX / Math.max(nW, nH));
        cW = Math.round(nW * scale); cH = Math.round(nH * scale);
      }
      cW = Math.max(Math.round(cW), 1);
      cH = Math.max(Math.round(cH), 1);

      const canvas = document.createElement("canvas");
      canvas.width = cW; canvas.height = cH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D unavailable")); return; }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cW, cH);
      ctx.drawImage(img, 0, 0, cW, cH);
      resolve({
        base64:   canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1],
        widthPx:  cW,
        heightPx: cH,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function parseAdminSize(style: string): { w?: number; h?: number } {
  const w = style.match(/width\s*:\s*([\d.]+)px/i);
  const h = style.match(/height\s*:\s*([\d.]+)px/i);
  return { w: w ? parseFloat(w[1]) : undefined, h: h ? parseFloat(h[1]) : undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML PARSER → TextBlock[]
// ─────────────────────────────────────────────────────────────────────────────
function stripInline(s: string): string {
  return s
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "$1")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi,           "$1")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi,         "$1")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi,           "$1")
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi,           "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#8203;/g, "")
    .replace(/\s{2,}/g, " ").trim();
}

function hasStrongChild(html: string) { return /<strong|<b[ >]/i.test(html); }

function parseTable(html: string): TableRow[] {
  const rows: TableRow[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trM: RegExpExecArray | null;
  while ((trM = trRe.exec(html)) !== null) {
    const cells: TableCell[] = [];
    const cellRe = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cM: RegExpExecArray | null;
    let isHeader = false;
    while ((cM = cellRe.exec(trM[1])) !== null) {
      const tag = cM[1].toLowerCase();
      if (tag === "th") isHeader = true;
      const colspanM = cM[2].match(/colspan=['""]?(\d+)['""]?/i);
      cells.push({
        text:    stripInline(cM[3]),
        bold:    tag === "th" || hasStrongChild(cM[3]),
        colspan: colspanM ? parseInt(colspanM[1], 10) : 1,
      });
    }
    if (cells.length) rows.push({ cells, isHeader });
  }
  return rows;
}

function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const tableMap = new Map<string, TableRow[]>();
  const imageMap = new Map<string, { src: string; alt: string; adminW?: number; adminH?: number }>();
  let ti = 0, ii = 0;

  let h = html.replace(/<table[\s\S]*?<\/table>/gi, (m) => {
    const k = `__TABLE_${ti++}__`;
    tableMap.set(k, parseTable(m));
    return `<p>${k}</p>`;
  });

  h = h.replace(/<img([^>]*)>/gi, (_, attrs) => {
    const srcM   = attrs.match(/src=["']([^"']+)["']/i);
    const altM   = attrs.match(/alt=["']([^"']*)["']/i);
    const styleM = attrs.match(/style=["']([^"']*)["']/i);
    const src    = srcM ? srcM[1] : "";
    if (!src) return "";
    const { w: adminW, h: adminH } = parseAdminSize(styleM ? styleM[1] : "");
    const k = `__IMAGE_${ii++}__`;
    imageMap.set(k, { src, alt: altM ? altM[1] : "", adminW, adminH });
    return `<p>${k}</p>`;
  });

  const norm = h.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ");
  const re   = /<(h1|h2|h3|h4|p|li|blockquote|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(norm)) !== null) {
    const tag   = (m[1] ?? "hr").toLowerCase();
    const inner = m[3] ?? "";
    if (tag === "hr") { blocks.push({ kind: "divider" }); continue; }
    const text = stripInline(inner);

    if (tag === "p" && tableMap.has(text)) { blocks.push({ kind: "table", rows: tableMap.get(text)! }); continue; }
    if (tag === "p" && imageMap.has(text)) {
      const { src, alt, adminW, adminH } = imageMap.get(text)!;
      blocks.push({ kind: "image", src, alt, adminW, adminH });
      continue;
    }
    if (!text) continue;

    if      (tag === "h1" || tag === "h2" || tag === "h4") blocks.push({ kind: "h2", text });
    else if (tag === "h3")        blocks.push({ kind: "h3", text });
    else if (tag === "blockquote") blocks.push({ kind: "blockquote", text });
    else if (tag === "li")        blocks.push({ kind: "bullet", text });
    else if (tag === "p")         blocks.push({ kind: "p", text, bold: hasStrongChild(inner) });
  }

  if (!blocks.length && html.trim())
    stripInline(html).split(/\n+/).forEach(line => {
      if (line.trim()) blocks.push({ kind: "p", text: line.trim() });
    });

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// VEDIC BORDER
// ─────────────────────────────────────────────────────────────────────────────
function drawVedicBorder(doc: import("jspdf").jsPDF, W: number, H: number) {
  // Warm parchment page fill
  // doc.setFillColor(...C.parchment);
  // doc.rect(0, 0, W, H, "F");
  doc.setFillColor(255, 240, 222); // #FFF0DE
  doc.rect(0, 0, W, H, "F");

  const m = 8;
  // Outer gold rect
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(1.2);
  doc.rect(m, m, W - m * 2, H - m * 2);
  // Inner dark-red rect
  doc.setDrawColor(120, 30, 30);
  doc.setLineWidth(0.4);
  doc.rect(m + 3, m + 3, W - (m + 3) * 2, H - (m + 3) * 2);
  // Corner squares
  doc.setFillColor(...C.gold);
  ([[m, m], [W - m, m], [m, H - m], [W - m, H - m]] as [number, number][])
    .forEach(([cx, cy]) => doc.rect(cx - 2, cy - 2, 4, 4, "F"));
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER  – fully SYNCHRONOUS  (logo already pre-loaded into _logoBase64)
// Called both on first page and inside ensureSpace / addPage
// ─────────────────────────────────────────────────────────────────────────────
function drawHeaderSync(
  doc:    import("jspdf").jsPDF,
  W:      number,
  report: Report,
): void {
  const margin = 14;

  // ── Dark navy background ──────────────────────────────────────────────────
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, HDR_H, "F");

  // ── Gold top accent bar ───────────────────────────────────────────────────
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, W, 2.5, "F");

  // ── Logo (PNG pre-loaded, or text fallback) ───────────────────────────────
  const logoW = 38;       // mm wide; height auto-calculated by jsPDF
  const logoX = margin;
  const logoY = (HDR_H - 22) / 2;   // vertically centred

  if (_logoBase64) {
    // Use PNG with transparent background as-is
    doc.addImage(_logoBase64, "PNG", logoX, logoY, logoW, 0);
  } else {
    // Fallback: text brand
    doc.setTextColor(...C.goldLight);
    doc.setFontSize(15);
    doc.setFont("NotoSans", "bold");
    doc.text("Cosmic Remedies", logoX, HDR_H / 2 + 2);
    doc.setTextColor(...C.purpleLight);
    doc.setFontSize(7.5);
    doc.setFont("NotoSans", "normal");
    doc.text("Personalized Vedic Astrology Solutions", logoX, HDR_H / 2 + 8);
  }

  // ── Right column: report title + badge ───────────────────────────────────
  const rightX = W - margin;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("NotoSans", "bold");
  const titleShort = report.title.length > 52
    ? report.title.slice(0, 49) + "…"
    : report.title;
  doc.text(titleShort, rightX, HDR_H * 0.32, { align: "right" });

  // Template badge
  const badgeW = 44;
  const badgeY = HDR_H * 0.32 + 3;
  doc.setFillColor(...C.purple);
  doc.roundedRect(rightX - badgeW, badgeY, badgeW, 7.5, 1.8, 1.8, "F");
  // Badge inner gold border line
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.2);
  doc.roundedRect(rightX - badgeW + 0.6, badgeY + 0.6, badgeW - 1.2, 6.3, 1.4, 1.4, "S");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont("NotoSans", "bold");
  doc.text(report.template.toUpperCase(), rightX - badgeW / 2, badgeY + 5.3, { align: "center" });

  // ── Meta row ──────────────────────────────────────────────────────────────
  doc.setTextColor(...C.textLight);
  doc.setFontSize(7);
  doc.setFont("NotoSans", "normal");
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.text(`Generated: ${dateStr}`, margin, HDR_H - 5);
  doc.text(`ID: ${report.id.toUpperCase()}`, rightX, HDR_H - 5, { align: "right" });

  // ── Bottom gold divider ───────────────────────────────────────────────────
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.6);
  doc.line(margin, HDR_H, rightX, HDR_H);
  // Thin purple shadow line
  doc.setDrawColor(...C.purple);
  doc.setLineWidth(0.2);
  doc.line(margin, HDR_H + 0.8, rightX, HDR_H + 0.8);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function drawFooter(
  doc: import("jspdf").jsPDF,
  W: number, H: number, pageNum: number, totalPages: number,
) {
  const margin = 14;

  // Thin gold line above footer
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, H - 18, W - margin, H - 18);

  // Thin purple shadow
  doc.setDrawColor(...C.purple);
  doc.setLineWidth(0.2);
  doc.line(margin, H - 17.2, W - margin, H - 17.2);

  // Footer bar
  doc.setFillColor(...C.navy);
  doc.rect(0, H - 12, W, 12, "F");

  doc.setTextColor(...C.footerCopy);
  doc.setFontSize(7.5);
  doc.setFont("NotoSans", "normal");
  doc.text("\u00A9 Vedic Cosmos \u2014 Confidential Jyotish Report", margin, H - 5);

  doc.setTextColor(...C.goldLight);
  doc.setFont("NotoSans", "bold");
  doc.text(`\u0950  Page ${pageNum} of ${totalPages}`, W - margin, H - 5, { align: "right" });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE GUARD  – fully SYNCHRONOUS now; header draws via drawHeaderSync
// ─────────────────────────────────────────────────────────────────────────────
function ensureSpace(
  doc:      import("jspdf").jsPDF,
  state:    RenderState,
  needed:   number,
  report:   Report,
  _customer?: Customer | null,
): void {
  if (state.y + needed <= state.pageH - 22) return;  // still fits – nothing to do

  doc.addPage();
  drawVedicBorder(doc, state.pageW, state.pageH);
  drawHeaderSync(doc, state.pageW, report);            // ← sync, no await needed
  state.y = HDR_H + 8;                                // reset cursor below header
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function renderTable(
  doc:       import("jspdf").jsPDF,
  rows:      TableRow[],
  state:     RenderState,
  report:    Report,
  customer?: Customer | null,
): void {
  if (!rows.length) return;
  const { margin, contentW } = state;

  const colCount = rows.reduce((max, row) =>
    Math.max(max, row.cells.reduce((s, c) => s + c.colspan, 0)), 0);
  if (!colCount) return;

  const colW     = contentW / colCount;
  const cellPadX = 2.5;
  const cellPadY = 2;
  const lineH    = 4.5;
  doc.setFontSize(8.5);

  rows.forEach((row, rowIndex) => {
    let maxLines = 1;
    row.cells.forEach(cell => {
      const cW      = colW * cell.colspan - cellPadX * 2;
      const wrapped = doc.splitTextToSize(cell.text || " ", Math.max(cW, 8));
      if (wrapped.length > maxLines) maxLines = wrapped.length;
    });
    const rowH = maxLines * lineH + cellPadY * 2;
    ensureSpace(doc, state, rowH + 2, report, customer);

    let colCursor = 0;
    row.cells.forEach(cell => {
      const x = margin + colCursor * colW;
      const w = colW * cell.colspan;

      if (row.isHeader || cell.bold)
        doc.setFillColor(...C.navyMid);
      else
        rowIndex % 2 === 0
          ? doc.setFillColor(...C.tableBgEven)
          : doc.setFillColor(255, 255, 255);
      doc.rect(x, state.y, w, rowH, "F");

      doc.setDrawColor(180, 150, 230);
      doc.setLineWidth(0.25);
      doc.rect(x, state.y, w, rowH, "S");

      if (row.isHeader || cell.bold) {
        doc.setFont("NotoSans", "bold");
        doc.setTextColor(...C.goldLight);
      } else {
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(...C.textDark);
      }
      const cellW   = w - cellPadX * 2;
      const wrapped = doc.splitTextToSize(cell.text || "", Math.max(cellW, 8));
      wrapped.forEach((line: string, li: number) => {
        doc.text(line, x + cellPadX, state.y + cellPadY + lineH * 0.8 + li * lineH);
      });

      colCursor += cell.colspan;
    });
    state.y += rowH;
  });
  state.y += 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function generateReportPDF(
  report:    Report,
  customer?: Customer | null,
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ── 1. Load all async assets BEFORE touching jsPDF ───────────────────────
  const [fonts] = await Promise.all([
    loadFonts(),
    preloadLogo(),          // populates _logoBase64 synchronously accessible
  ]);

  // ── 2. Create document & register fonts ──────────────────────────────────
  const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW    = doc.internal.pageSize.getWidth();
  const pageH    = doc.internal.pageSize.getHeight();
  const margin   = 14;
  const contentW = pageW - margin * 2;

  registerFonts(doc, fonts);

  // ── 3. First page decorations ─────────────────────────────────────────────
  drawVedicBorder(doc, pageW, pageH);
  drawHeaderSync(doc, pageW, report);   // synchronous – logo already in _logoBase64

  // Content starts below the header
  const state: RenderState = {
    y: HDR_H + 8,
    pageW, pageH, margin, contentW,
  };

  // ── CLIENT DETAILS BOX ────────────────────────────────────────────────────
  if (customer) {
    ensureSpace(doc, state, 48, report, customer);

    const boxH = 42;
    doc.setFillColor(...C.clientBoxBg);
    doc.roundedRect(margin, state.y, contentW, boxH, 3, 3, "F");
    doc.setDrawColor(...C.clientBoxBdr);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, state.y, contentW, boxH, 3, 3, "S");

    // Left gold stripe
    doc.setFillColor(...C.gold);
    doc.roundedRect(margin, state.y, 3.5, boxH, 1.5, 1.5, "F");

    // Section label
    doc.setFontSize(7.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.textMid);
    doc.text("\u2756  CLIENT DETAILS", margin + 8, state.y + 8);

    // Subtle divider under label
    doc.setDrawColor(...C.clientBoxBdr);
    doc.setLineWidth(0.2);
    doc.line(margin + 8, state.y + 10, margin + contentW - 4, state.y + 10);

    // Fields – two columns
    const col1 = margin + 8;
    const col2 = margin + contentW / 2 + 4;
    doc.setFontSize(9);

    const field = (label: string, value: string, x: number, y: number) => {
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.textMid);
      doc.text(label, x, y);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(...C.textDark);
      doc.text(value, x + 14, y);
    };

    field("Name:",  customer.name,  col1, state.y + 18);
    field("Email:", customer.email, col1, state.y + 27);
    field("DOB:",   customer.dob,   col2, state.y + 18);
    field("TOB:",   customer.tob,   col2, state.y + 27);
    field("Place:", `${customer.pobCity}${customer.pobCountry ? ", " + customer.pobCountry : ""}`, col2, state.y + 36);

    state.y += boxH + 6;
  }

  // ── CONCERN BOX ───────────────────────────────────────────────────────────
  if (customer?.concern) {
    ensureSpace(doc, state, 20, report, customer);

    const boxH = 14;
    doc.setFillColor(...C.concernBg);
    doc.roundedRect(margin, state.y, contentW, boxH, 2, 2, "F");
    doc.setDrawColor(...C.concernBdr);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, state.y, contentW, boxH, 2, 2, "S");

    doc.setFillColor(...C.gold);
    doc.roundedRect(margin, state.y, 3.5, boxH, 1, 1, "F");

    doc.setFontSize(9);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.textGold);
    doc.text("Concern:", margin + 8, state.y + 9.5);
    doc.setFont("NotoSans", "normal");
    doc.setTextColor(80, 50, 0);
    const maxConcernW = contentW - 34;
    const concernLines = doc.splitTextToSize(customer.concern, maxConcernW);
    doc.text(concernLines[0], margin + 30, state.y + 9.5);

    state.y += boxH + 6;
  }

  // ── BODY BLOCKS ───────────────────────────────────────────────────────────
  const blocks = htmlToBlocks(report.content);

  for (const block of blocks) {

    // IMAGE ────────────────────────────────────────────────────────────────
    if (block.kind === "image") {
      if (!block.src.startsWith("data:")) continue;
      try {
        const compressed = await compressImage(block.src, block.adminW, block.adminH);
        let imgWmm: number, imgHmm: number;
        if      (block.adminW && block.adminH) {
          imgWmm = block.adminW * PX_TO_MM;
          imgHmm = block.adminH * PX_TO_MM;
        } else if (block.adminW) {
          imgWmm = block.adminW * PX_TO_MM;
          imgHmm = (compressed.heightPx / compressed.widthPx) * imgWmm;
        } else if (block.adminH) {
          imgHmm = block.adminH * PX_TO_MM;
          imgWmm = (compressed.widthPx / compressed.heightPx) * imgHmm;
        } else {
          imgWmm = contentW;
          imgHmm = (compressed.heightPx / compressed.widthPx) * imgWmm;
        }
        if (imgWmm > contentW) {
          const s = contentW / imgWmm; imgWmm *= s; imgHmm *= s;
        }
        const maxHmm = (pageH - 22 - margin) * 0.5;
        if (imgHmm > maxHmm) {
          const s = maxHmm / imgHmm; imgHmm *= s; imgWmm *= s;
        }

        ensureSpace(doc, state, imgHmm + 10, report, customer);
        // Gold border around image
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin - 1.5, state.y - 1.5, imgWmm + 3, imgHmm + 3, 1, 1, "F");
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin - 1.5, state.y - 1.5, imgWmm + 3, imgHmm + 3, 1, 1, "S");
        doc.addImage(compressed.base64, "JPEG", margin, state.y, imgWmm, imgHmm);
        state.y += imgHmm + 8;
      } catch (err) {
        console.warn("pdf-generator: could not embed image", err);
      }
      continue;
    }

    // TABLE ──────────────────────────────────────────────────────────────────
    if (block.kind === "table") {
      state.y += 3;
      renderTable(doc, block.rows, state, report, customer);
      continue;
    }

    // DIVIDER ────────────────────────────────────────────────────────────────
    if (block.kind === "divider") {
      ensureSpace(doc, state, 10, report, customer);
      const cx = pageW / 2;
      // Three-line ornamental divider
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.15);
      doc.line(margin + 20, state.y + 2,   pageW - margin - 20, state.y + 2);
      doc.setDrawColor(190, 150, 240);
      doc.setLineWidth(0.5);
      doc.line(margin + 10, state.y + 4,   pageW - margin - 10, state.y + 4);
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.15);
      doc.line(margin + 20, state.y + 6,   pageW - margin - 20, state.y + 6);
      // Centre diamond ornament
      doc.setFontSize(7);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.gold);
      doc.text("\u2666", cx, state.y + 5, { align: "center" });
      state.y += 10;
      continue;
    }

    // H2 ──────────────────────────────────────────────────────────────────────
    if (block.kind === "h2") {
      ensureSpace(doc, state, 22, report, customer);

      const bandH = 12;
      doc.setFillColor(...C.navyMid);
      doc.roundedRect(margin, state.y, contentW, bandH, 1.5, 1.5, "F");

      // Gold left accent
      doc.setFillColor(...C.gold);
      doc.roundedRect(margin, state.y, 4, bandH, 1.5, 1.5, "F");

      // Right star ornament
      doc.setFontSize(9);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.gold);
      doc.text("\u2756", pageW - margin - 6, state.y + 8.5);

      // Heading text
      doc.setFontSize(11.5);
      doc.setTextColor(...C.goldLight);
      doc.setFont("NotoSans", "bold");
      const h2Lines = doc.splitTextToSize(block.text, contentW - 20);
      doc.text(h2Lines[0], margin + 9, state.y + 8.8);
      state.y += bandH + 5;
      continue;
    }

    // H3 ──────────────────────────────────────────────────────────────────────
    if (block.kind === "h3") {
      ensureSpace(doc, state, 16, report, customer);
      doc.setFontSize(10.5);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.purpleSoft);
      doc.text("\u25B8  " + block.text, margin, state.y + 7);
      // Underline
      doc.setDrawColor(...C.purpleSoft);
      doc.setLineWidth(0.3);
      doc.line(margin, state.y + 9, margin + contentW * 0.5, state.y + 9);
      state.y += 14;
      continue;
    }

    // BLOCKQUOTE ──────────────────────────────────────────────────────────────
    if (block.kind === "blockquote") {
      const lines = doc.splitTextToSize(block.text, contentW - 18);
      const boxH  = lines.length * 5.5 + 12;
      ensureSpace(doc, state, boxH, report, customer);

      doc.setFillColor(...C.blockquoteBg);
      doc.roundedRect(margin, state.y, contentW, boxH, 2.5, 2.5, "F");
      doc.setFillColor(...C.purple);
      doc.roundedRect(margin, state.y, 4, boxH, 1.5, 1.5, "F");

      // Decorative quote mark
      doc.setFontSize(24);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(200, 170, 255);
      doc.text("\u201C", margin + 8, state.y + 10);

      doc.setFontSize(9.5);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(...C.textMid);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 10, state.y + 8 + i * 5.5);
      });
      state.y += boxH + 6;
      continue;
    }

    // BULLET ──────────────────────────────────────────────────────────────────
    if (block.kind === "bullet") {
      const lines = doc.splitTextToSize(block.text, contentW - 14);
      ensureSpace(doc, state, lines.length * 5.2 + 3, report, customer);

      // Gold diamond
      doc.setFontSize(8);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.gold);
      doc.text("\u2666", margin + 2, state.y + 5.5);

      doc.setFontSize(9.5);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(...C.textDark);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 8, state.y + 5.5 + i * 5.2);
      });
      state.y += lines.length * 5.2 + 3;
      continue;
    }

    // NUMBERED ────────────────────────────────────────────────────────────────
    if (block.kind === "numbered") {
      const lines = doc.splitTextToSize(block.text, contentW - 16);
      ensureSpace(doc, state, lines.length * 5.2 + 3, report, customer);

      doc.setFillColor(...C.purple);
      doc.circle(margin + 4, state.y + 4, 3.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${block.num}`, margin + 4, state.y + 5.5, { align: "center" });

      doc.setFontSize(9.5);
      doc.setFont("NotoSans", "normal");
      doc.setTextColor(...C.textDark);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 10, state.y + 5.5 + i * 5.2);
      });
      state.y += lines.length * 5.2 + 3;
      continue;
    }

    // PARAGRAPH ───────────────────────────────────────────────────────────────
    {
      const lines = doc.splitTextToSize(block.text, contentW);
      ensureSpace(doc, state, lines.length * 5.5 + 4, report, customer);
      doc.setFontSize(9.5);
      doc.setFont("NotoSans", (block as { bold?: boolean }).bold ? "bold" : "normal");
      doc.setTextColor(...C.textDark);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin, state.y + 5.5 * (i + 1));
      });
      state.y += lines.length * 5.5 + 4;
    }
  }

  // ── ADMIN NOTES ───────────────────────────────────────────────────────────
  if (report.adminNotes?.trim()) {
    ensureSpace(doc, state, 24, report, customer);
    state.y += 5;

    doc.setDrawColor(200, 180, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, state.y, pageW - margin, state.y);
    state.y += 7;

    doc.setFontSize(8.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(120, 90, 180);
    doc.text("Admin Notes:", margin, state.y);
    state.y += 6;

    doc.setFont("NotoSans", "normal");
    doc.setTextColor(100, 80, 140);
    const noteLines = doc.splitTextToSize(report.adminNotes, contentW);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, state.y);
      state.y += 5;
    });
  }

  // ── FOOTERS (all pages) ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageW, pageH, i, totalPages);
  }

  doc.save(`${report.title.replace(/\s+/g, "_")}_vedic_report.pdf`);
}