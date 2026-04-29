"use client";

/**
 * docx-parser.ts
 * Parses an uploaded .docx file (client-side) into clean HTML
 * using the mammoth.js library (loaded dynamically).
 */

export interface DocxParseResult {
  html: string;
  plainText: string;
  pageEstimate: number;
  warnings: string[];
}

export async function parseDocxToHtml(file: File): Promise<DocxParseResult> {
  // Dynamic import — mammoth is a large lib, only load when needed
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title']     => h2:fresh",
        "b                         => strong",
        "i                         => em",
      ],
    }
  );

  const html = result.value;

  // Strip Word-injected empty paragraphs / excessive whitespace
  const cleanedHtml = html
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Rough page estimate: ~3000 chars per page
  const plainText = cleanedHtml.replace(/<[^>]+>/g, "");
  const pageEstimate = Math.max(1, Math.round(plainText.length / 3000));

  return {
    html: cleanedHtml,
    plainText,
    pageEstimate,
    warnings: result.messages
      .filter((m) => m.type === "warning")
      .map((m) => m.message),
  };
}