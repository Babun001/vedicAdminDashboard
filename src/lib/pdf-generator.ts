"use client";

import type { Report, Customer } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE  – Cosmic Remedies brand
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Backgrounds
  pageBg: [255, 245, 232] as const,   // warm cream  #FFF5E8
  // Text
  textDark: [60, 40, 20] as const,   // deep brown
  textMid: [120, 80, 30] as const,   // mid brown
  textLight: [180, 140, 80] as const,   // golden-tan
  // Brand orange / gold
  orange: [230, 140, 30] as const,   // primary brand orange
  orangeLight: [245, 175, 70] as const,
  gold: [200, 140, 20] as const,
  goldLight: [240, 190, 60] as const,
  // Accent
  purple: [120, 40, 200] as const,
  purpleSoft: [176, 100, 240] as const,
  purpleLight: [190, 160, 255] as const,
  // Boxes
  clientBoxBg: [255, 248, 235] as const,
  clientBoxBdr: [220, 160, 50] as const,
  concernBg: [255, 250, 230] as const,
  concernBdr: [220, 160, 20] as const,
  blockquoteBg: [255, 250, 240] as const,
  tableBgEven: [255, 250, 240] as const,
  // Footer
  footerText: [150, 100, 40] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TextBlock =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string; bold?: boolean }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; text: string; num: number }
  | { kind: "divider" }
  | { kind: "blockquote"; text: string }
  | { kind: "table"; rows: TableRow[] }
  | { kind: "image"; src: string; alt?: string; adminW?: number; adminH?: number };

interface TableRow { cells: TableCell[]; isHeader: boolean; }
interface TableCell { text: string; bold: boolean; colspan: number; }

interface RenderState {
  y: number;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
}

interface LoadedFonts { regular: string; bold: string; }

interface CompressedImage {
  base64: string;
  widthPx: number;
  heightPx: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MAX_PX = 1200;
const JPEG_QUALITY = 0.82;
const PX_TO_MM = 25.4 / 96;

// Header / footer heights in mm
const HDR_H = 52;   // header zone height (includes wave + logo)
const FOOT_H = 28;   // footer zone height

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE ASSET CACHE
// key → { base64, format }
// ─────────────────────────────────────────────────────────────────────────────
type ImgFormat = "PNG" | "JPEG";
interface CachedAsset { base64: string; format: ImgFormat; }
const _assetCache = new Map<string, CachedAsset | null>(); // null = failed

async function loadAsset(path: string): Promise<CachedAsset | null> {
  if (_assetCache.has(path)) return _assetCache.get(path)!;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary);
    const lower = path.toLowerCase();
    const format: ImgFormat = lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "JPEG" : "PNG";
    const asset: CachedAsset = { base64: b64, format };
    _assetCache.set(path, asset);
    return asset;
  } catch (err) {
    console.warn(`pdf-generator: could not load asset "${path}"`, err);
    _assetCache.set(path, null);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FONT LOADER
// ─────────────────────────────────────────────────────────────────────────────
let _fontCache: LoadedFonts | null = null;

async function arrayBufferToBase64(buf: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf]);
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
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

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE COMPRESS HELPER  (for inline report images)
// ─────────────────────────────────────────────────────────────────────────────
async function compressImage(
  src: string, adminW?: number, adminH?: number,
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: nW, naturalHeight: nH } = img;
      let cW: number, cH: number;
      if (adminW && adminH) { cW = adminW; cH = adminH; }
      else if (adminW) { cW = adminW; cH = Math.round((nH / nW) * adminW); }
      else if (adminH) { cH = adminH; cW = Math.round((nW / nH) * adminH); }
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
        base64: canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1],
        widthPx: cW,
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
// HTML PARSER → TextBlock[]   (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────
function stripInline(s: string): string {
  return s
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "$1")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "$1")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "$1")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "$1")
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
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
        text: stripInline(cM[3]),
        bold: tag === "th" || hasStrongChild(cM[3]),
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
    const srcM = attrs.match(/src=["']([^"']+)["']/i);
    const altM = attrs.match(/alt=["']([^"']*)["']/i);
    const styleM = attrs.match(/style=["']([^"']*)["']/i);
    const src = srcM ? srcM[1] : "";
    if (!src) return "";
    const { w: adminW, h: adminH } = parseAdminSize(styleM ? styleM[1] : "");
    const k = `__IMAGE_${ii++}__`;
    imageMap.set(k, { src, alt: altM ? altM[1] : "", adminW, adminH });
    return `<p>${k}</p>`;
  });

  const norm = h.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ");
  const re = /<(h1|h2|h3|h4|p|li|blockquote|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(norm)) !== null) {
    const tag = (m[1] ?? "hr").toLowerCase();
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

    if (tag === "h1" || tag === "h2" || tag === "h4") blocks.push({ kind: "h2", text });
    else if (tag === "h3") blocks.push({ kind: "h3", text });
    else if (tag === "blockquote") blocks.push({ kind: "blockquote", text });
    else if (tag === "li") blocks.push({ kind: "bullet", text });
    else if (tag === "p") blocks.push({ kind: "p", text, bold: hasStrongChild(inner) });
  }

  if (!blocks.length && html.trim())
    stripInline(html).split(/\n+/).forEach(line => {
      if (line.trim()) blocks.push({ kind: "p", text: line.trim() });
    });

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BACKGROUND
// Draws the cream background + lotus watermark centred on the page
// ─────────────────────────────────────────────────────────────────────────────
function drawPageBackground(
  doc: import("jspdf").jsPDF,
  W: number,
  H: number,
  assets: Record<string, CachedAsset | null>,
): void {
  // 1. Cream fill
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, W, H, "F");

  // 2. Background texture / pattern image (optional)
  //    Place it full-page, behind everything.
  //    ── CHANGE "background.png" to your actual relative path ──
  const bg = assets.bg; //assets["background.png"];
  if (bg) {
    doc.addImage(bg.base64, bg.format, 0, 0, W, H);
  }

  // 3. Lotus watermark – centred, large, very light (use opacity trick via canvas)
  //    ── CHANGE "lotus.png" to your actual relative path ──
  const lotus = assets.lotus;
  if (lotus) {
    const lW = W * 0.6;
    const lH = lW;
    const lX = (W - lW) / 2;
    const lY = (H - lH) / 2;

    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 0.15 })); // 👈 LOW OPACITY
    doc.addImage(lotus.base64, lotus.format, lX, lY, lW, lH);
    doc.restoreGraphicsState();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// Draws:  headercurve.png (top-right wave)  +  logo (top-left)
// ─────────────────────────────────────────────────────────────────────────────
function drawHeader(
  doc: import("jspdf").jsPDF,
  W: number,
  assets: Record<string, CachedAsset | null>,
  report: Report,
): void {
  // 1. Header curve / wave image – spans top of page
  //    ── CHANGE "headercurve.png" to your actual relative path ──
  const curve = assets.curve; //assets["headercurve.png"];
  if (curve) {
    // Draw full-width at top; height = HDR_H
    doc.addImage(curve.base64, curve.format, 0, 0, W, HDR_H);
  } else {
    // Fallback: solid orange band
    doc.setFillColor(...C.orange);
    doc.rect(0, 0, W, HDR_H * 0.45, "F");
  }

  // 2. Logo  – top-left, vertically centred in header zone
  //    ── CHANGE "logo.png" to your actual relative path ──
  const logo = assets.logo; //assets["logo.png"];
  const logoW = 44;   // mm
  const logoX = 12;
  const logoY = 6;
  if (logo) {
    doc.addImage(logo.base64, logo.format, logoX, logoY, logoW, 0);
    // passing height=0 lets jsPDF auto-calculate from aspect ratio
  } else {
    // Text fallback
    doc.setFontSize(16);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.orange);
    doc.text("COSMIC REMEDIES", logoX, logoY + 12);
    doc.setFontSize(8);
    doc.setFont("NotoSans", "normal");
    doc.setTextColor(...C.textMid);
    doc.text("& Dia", logoX, logoY + 20);
  }

  // 3. Thin separator line at bottom of header area
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.6);
  doc.line(12, HDR_H, W - 12, HDR_H);



  // ── RIGHT SIDE: Report Title + Type ─────────────────────────
  const rightX = W - 14;

  // Report Title
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0); // white over curve
  doc.text(report.title || "Report", rightX, 16, { align: "right" });

  // Report Type (smaller)
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const reportType = (report as any).type || "Astrology Report";
  doc.text(reportType, rightX, 22, { align: "right" });


  // ── LEFT SIDE: Meta Info ─────────────────────────
  const metaX = 12;
  const metaY = HDR_H - 18;

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);

  doc.text(`Date: ${dateStr}`, metaX, metaY);
  doc.text(`Time: ${timeStr}`, metaX, metaY + 5);

  if (report.userName) {
    doc.setFont("NotoSans", "bold");
    doc.text(`Client: ${report.userName}`, metaX, metaY + 10);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// Draws footerDesign.png spanning the bottom of the page + contact info
// ─────────────────────────────────────────────────────────────────────────────
function drawFooter(
  doc: import("jspdf").jsPDF,
  W: number,
  H: number,
  pageNum: number,
  totalPages: number,
  assets: Record<string, CachedAsset | null>,
  report: Report,
): void {
  const footerY = H - FOOT_H;

  // 1. Footer design image – spans full width at bottom
  //    ── CHANGE "footerDesign.png" to your actual relative path ──
  const footer = assets.footer; //assets["footerDesign.png"];
  if (footer) {
    doc.addImage(footer.base64, footer.format, 0, footerY, W, FOOT_H);
  } else {
    // Fallback: orange bar
    doc.setFillColor(...C.orange);
    doc.rect(0, footerY, W, FOOT_H, "F");
  }


  // ── CONTACT INFO ─────────────────────────
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.footerText);

  // Center aligned contact block
  doc.text(
    "Cosmic Remedies Pvt. Ltd.",
    W / 2,
    H - 16,
    { align: "center" }
  );

  doc.text(
    "Kolkata, West Bengal, India",
    W / 2,
    H - 12,
    { align: "center" }
  );

  doc.text(
    "📞 +91-XXXXXXXXXX   |   ✉ support@cosmicremedies.com",
    W / 2,
    H - 8,
    { align: "center" }
  );

  // 2. Page number overlay – right-aligned in footer
  doc.setFontSize(7.5);
  doc.setFont("NotoSans", "bold");
  doc.setTextColor(...C.textDark);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    W - 14,
    H - 6,
    { align: "right" },
  );

  // 3. Optional: confidential label left side
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.textMid);
  doc.text("\u00A9 Cosmic Remedies \u2014 Confidential Report", 14, H - 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL PAGE DECORATION  (background + header + footer skeleton)
// Called on first page and every new page
// ─────────────────────────────────────────────────────────────────────────────
function decoratePage(
  doc: import("jspdf").jsPDF,
  W: number,
  H: number,
  assets: Record<string, CachedAsset | null>,
  report: Report,
): void {
  drawPageBackground(doc, W, H, assets);
  drawHeader(doc, W, assets, report);
  // Footer is drawn at the very end after totalPages is known (see main export)
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE GUARD
// ─────────────────────────────────────────────────────────────────────────────
function ensureSpace(
  doc: import("jspdf").jsPDF,
  state: RenderState,
  needed: number,
  report: Report,
  assets: Record<string, CachedAsset | null>,
  _customer?: Customer | null,
): void {
  // const safeBottom = state.pageH - FOOT_H - 6;
  const safeBottom = state.pageH - FOOT_H - state.margin;
  if (state.y + needed <= safeBottom) return;

  doc.addPage();
  decoratePage(doc, state.pageW, state.pageH, assets, report);
  state.y = HDR_H + 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function renderTable(
  doc: import("jspdf").jsPDF,
  rows: TableRow[],
  state: RenderState,
  report: Report,
  assets: Record<string, CachedAsset | null>,
  customer?: Customer | null,
): void {
  if (!rows.length) return;
  const { margin, contentW } = state;

  const colCount = rows.reduce((max, row) =>
    Math.max(max, row.cells.reduce((s, c) => s + c.colspan, 0)), 0);
  if (!colCount) return;

  const colW = contentW / colCount;
  const cellPadX = 2.5;
  const cellPadY = 2;
  const lineH = 4.5;
  doc.setFontSize(8.5);

  rows.forEach((row, rowIndex) => {
    let maxLines = 1;
    row.cells.forEach(cell => {
      const cW = colW * cell.colspan - cellPadX * 2;
      const wrapped = doc.splitTextToSize(cell.text || " ", Math.max(cW, 8));
      if (wrapped.length > maxLines) maxLines = wrapped.length;
    });
    const rowH = maxLines * lineH + cellPadY * 2;
    ensureSpace(doc, state, rowH + 2, report, assets, customer);

    let colCursor = 0;
    row.cells.forEach(cell => {
      const x = margin + colCursor * colW;
      const w = colW * cell.colspan;

      if (row.isHeader || cell.bold)
        doc.setFillColor(...C.orange);
      else
        rowIndex % 2 === 0
          ? doc.setFillColor(...C.tableBgEven)
          : doc.setFillColor(255, 255, 255);
      doc.rect(x, state.y, w, rowH, "F");

      doc.setDrawColor(...C.clientBoxBdr);
      doc.setLineWidth(0.25);
      doc.rect(x, state.y, w, rowH, "S");

      if (row.isHeader || cell.bold) {
        doc.setFont("NotoSans", "bold");
        // doc.setTextColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(...C.textDark);
      }
      const cellW = w - cellPadX * 2;
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
  report: Report,
  customer?: Customer | null,
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ── 1. Load all async assets ──────────────────────────────────────────────
  // ⚠️  Change these keys to match the actual relative paths you use.
  //    The key is also what you pass to assets["key"] everywhere above.
  // const ASSET_PATHS = [
  //   "/assets/astro-logo-1.png",           // ← your logo file
  //   "/assets/bg-final.jpg",     // ← full-page background texture (optional; can be removed)
  //   "/assets/curve.png",    // ← orange wave at top
  //   "/assets/compress2.png",          // ← centre watermark (use a pre-faded / low-opacity PNG)
  //   "/assets/footerDesign.png",   // ← footer graphic
  // ];

  // const [fonts, ...assetResults] = await Promise.all([
  //   loadFonts(),
  //   ...ASSET_PATHS.map(p => loadAsset(p)),
  // ]);


  // Build a convenient lookup map
  // const assets: Record<string, CachedAsset | null> = {};
  // ASSET_PATHS.forEach((p, i) => { assets[p] = assetResults[i]; });

  // const assetEntries = Object.entries(ASSET_PATHS);

  // const [fonts, ...assetResults] = await Promise.all([
  //   loadFonts(),
  //   ...assetEntries.map(([_, path]) => loadAsset(path)),
  // ]);

  const ASSETS = {
    logo: "/assets/astro-logo-1.png",
    bg: "/assets/bg-final.jpg",
    curve: "/assets/curve.png",
    lotus: "/assets/compress2.png",
    footer: "/assets/footerDesign.png",
  };

  const entries = Object.entries(ASSETS);

  const [fonts, ...assetResults] = await Promise.all([
    loadFonts(),
    ...entries.map(([_, path]) => loadAsset(path)),
  ]);

  const assets: Record<string, CachedAsset | null> = {};
  entries.forEach(([key], i) => {
    assets[key] = assetResults[i];
  });

  // const assets: Record<string, CachedAsset | null> = {};
  // assetEntries.forEach(([key], i) => {
  //   assets[key] = assetResults[i];
  // });

  // ── 2. Create document & register fonts ──────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  registerFonts(doc, fonts);

  // ── 3. First page decorations ─────────────────────────────────────────────
  decoratePage(doc, pageW, pageH, assets, report);

  const state: RenderState = {
    y: HDR_H + 10,
    pageW, pageH, margin, contentW,
  };

  // ── CLIENT DETAILS BOX ────────────────────────────────────────────────────
  if (customer) {
    ensureSpace(doc, state, 48, report, assets, customer);

    const boxH = 42;
    doc.setFillColor(...C.clientBoxBg);
    doc.roundedRect(margin, state.y, contentW, boxH, 3, 3, "F");
    doc.setDrawColor(...C.clientBoxBdr);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, state.y, contentW, boxH, 3, 3, "S");

    // Orange left stripe
    doc.setFillColor(...C.orange);
    doc.roundedRect(margin, state.y, 3.5, boxH, 1.5, 1.5, "F");

    // Section label
    doc.setFontSize(7.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.textMid);
    doc.text("\u2756  CLIENT DETAILS", margin + 8, state.y + 8);

    doc.setDrawColor(...C.clientBoxBdr);
    doc.setLineWidth(0.2);
    doc.line(margin + 8, state.y + 10, margin + contentW - 4, state.y + 10);

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

    field("Name:", customer.name, col1, state.y + 18);
    field("Email:", customer.email, col1, state.y + 27);
    field("DOB:", customer.dob, col2, state.y + 18);
    field("TOB:", customer.tob, col2, state.y + 27);
    field("Place:", `${customer.pobCity}${customer.pobCountry ? ", " + customer.pobCountry : ""}`, col2, state.y + 36);

    state.y += boxH + 6;
  }

  // ── CONCERN BOX ───────────────────────────────────────────────────────────
  if (customer?.concern) {
    ensureSpace(doc, state, 20, report, assets, customer);

    const boxH = 14;
    doc.setFillColor(...C.concernBg);
    doc.roundedRect(margin, state.y, contentW, boxH, 2, 2, "F");
    doc.setDrawColor(...C.concernBdr);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, state.y, contentW, boxH, 2, 2, "S");

    doc.setFillColor(...C.orange);
    doc.roundedRect(margin, state.y, 3.5, boxH, 1, 1, "F");

    doc.setFontSize(9);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.textMid);
    doc.text("Concern:", margin + 8, state.y + 9.5);
    doc.setFont("NotoSans", "normal");
    doc.setTextColor(...C.textDark);
    const maxConcernW = contentW - 34;
    const concernLines = doc.splitTextToSize(customer.concern, maxConcernW);
    doc.text(concernLines[0], margin + 30, state.y + 9.5);

    state.y += boxH + 6;
  }

  // ── BODY BLOCKS ───────────────────────────────────────────────────────────
  const blocks = htmlToBlocks(report.content);

  for (const block of blocks) {

    // IMAGE ──────────────────────────────────────────────────────────────────
    if (block.kind === "image") {
      // if (!block.src.startsWith("data:")) continue;
      if (!block.src) continue;
      try {
        const compressed = await compressImage(block.src, block.adminW, block.adminH);
        let imgWmm: number, imgHmm: number;
        if (block.adminW && block.adminH) {
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
        const maxHmm = (pageH - FOOT_H - margin) * 0.5;
        if (imgHmm > maxHmm) {
          const s = maxHmm / imgHmm; imgHmm *= s; imgWmm *= s;
        }
        ensureSpace(doc, state, imgHmm + 10, report, assets, customer);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin - 1.5, state.y - 1.5, imgWmm + 3, imgHmm + 3, 1, 1, "F");
        doc.setDrawColor(...C.orange);
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
      renderTable(doc, block.rows, state, report, assets, customer);
      continue;
    }

    // DIVIDER ────────────────────────────────────────────────────────────────
    if (block.kind === "divider") {
      ensureSpace(doc, state, 10, report, assets, customer);
      const cx = pageW / 2;
      doc.setDrawColor(...C.orangeLight);
      doc.setLineWidth(0.15);
      doc.line(margin + 20, state.y + 2, pageW - margin - 20, state.y + 2);
      doc.setDrawColor(...C.orange);
      doc.setLineWidth(0.5);
      doc.line(margin + 10, state.y + 4, pageW - margin - 10, state.y + 4);
      doc.setDrawColor(...C.orangeLight);
      doc.setLineWidth(0.15);
      doc.line(margin + 20, state.y + 6, pageW - margin - 20, state.y + 6);
      doc.setFontSize(7);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.orange);
      doc.text("\u2666", cx, state.y + 5, { align: "center" });
      state.y += 10;
      continue;
    }

    // H2 ──────────────────────────────────────────────────────────────────────
    if (block.kind === "h2") {
      ensureSpace(doc, state, 22, report, assets, customer);

      const bandH = 12;
      doc.setFillColor(255, 240, 210);   // light orange tint band
      doc.roundedRect(margin, state.y, contentW, bandH, 1.5, 1.5, "F");

      // Orange left accent
      doc.setFillColor(...C.orange);
      doc.roundedRect(margin, state.y, 4, bandH, 1.5, 1.5, "F");

      // Bottom border line
      doc.setDrawColor(...C.orange);
      doc.setLineWidth(0.4);
      doc.line(margin, state.y + bandH, margin + contentW, state.y + bandH);

      // Heading text
      doc.setFontSize(11.5);
      doc.setTextColor(...C.textDark);
      doc.setFont("NotoSans", "bold");
      const h2Lines = doc.splitTextToSize(block.text, contentW - 14);
      doc.text(h2Lines[0], margin + 9, state.y + 8.8);
      state.y += bandH + 5;
      continue;
    }

    // H3 ──────────────────────────────────────────────────────────────────────
    if (block.kind === "h3") {
      ensureSpace(doc, state, 16, report, assets, customer);
      doc.setFontSize(10.5);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.orange);
      doc.text("\u25B8  " + block.text, margin, state.y + 7);
      doc.setDrawColor(...C.orangeLight);
      doc.setLineWidth(0.3);
      doc.line(margin, state.y + 9, margin + contentW * 0.5, state.y + 9);
      state.y += 14;
      continue;
    }

    // BLOCKQUOTE ──────────────────────────────────────────────────────────────
    if (block.kind === "blockquote") {
      const lines = doc.splitTextToSize(block.text, contentW - 18);
      const boxH = lines.length * 5.5 + 12;
      ensureSpace(doc, state, boxH, report, assets, customer);

      doc.setFillColor(...C.blockquoteBg);
      doc.roundedRect(margin, state.y, contentW, boxH, 2.5, 2.5, "F");
      doc.setFillColor(...C.orange);
      doc.roundedRect(margin, state.y, 4, boxH, 1.5, 1.5, "F");

      doc.setFontSize(24);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.orangeLight);
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
      ensureSpace(doc, state, lines.length * 5.2 + 3, report, assets, customer);

      // Orange diamond bullet
      doc.setFontSize(8);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(...C.orange);
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
      ensureSpace(doc, state, lines.length * 5.2 + 3, report, assets, customer);

      doc.setFillColor(...C.orange);
      doc.circle(margin + 4, state.y + 4, 3.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("NotoSans", "bold");
      // doc.setTextColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
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
      ensureSpace(doc, state, lines.length * 5.5 + 4, report, assets, customer);
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
    ensureSpace(doc, state, 24, report, assets, customer);
    state.y += 5;

    doc.setDrawColor(...C.clientBoxBdr);
    doc.setLineWidth(0.3);
    doc.line(margin, state.y, pageW - margin, state.y);
    state.y += 7;

    doc.setFontSize(8.5);
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(...C.textMid);
    doc.text("Admin Notes:", margin, state.y);
    state.y += 6;

    doc.setFont("NotoSans", "normal");
    doc.setTextColor(...C.textDark);
    const noteLines = doc.splitTextToSize(report.adminNotes, contentW);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, state.y);
      state.y += 5;
    });
  }

  // ── FOOTERS – drawn on every page once totalPages is known ───────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageW, pageH, i, totalPages, assets, report);
  }

  doc.save(`${report.title.replace(/\s+/g, "_")}_cosmic_report.pdf`);
}