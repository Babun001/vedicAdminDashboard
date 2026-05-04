// "use client";

// import { useEffect, useRef, useCallback, useState } from "react";
// import {
//   Bold, Italic, Underline, Strikethrough,
//   AlignLeft, AlignCenter, AlignRight, AlignJustify,
//   List, ListOrdered, Minus, Quote,
//   Undo, Redo, Link, ImagePlus, Table2,
//   Palette, Type, ChevronDown, X,
// } from "lucide-react";


// interface RichEditorProps {
//   value: string;
//   onChange: (html: string) => void;
//   placeholder?: string;
//   error?: string;
//   minHeight?: string;
// }


// const FONT_FAMILIES = [
//   { label: "Default", value: "" },
//   { label: "Serif (Times)", value: "Georgia, 'Times New Roman', serif" },
//   { label: "Sans-Serif", value: "'Helvetica Neue', Arial, sans-serif" },
//   { label: "Monospace", value: "'Courier New', Courier, monospace" },
//   { label: "Cursive", value: "'Palatino Linotype', Palatino, serif" },
//   { label: "Cinzel", value: "Cinzel, serif" },
// ];

// const FONT_SIZES = [
//   "8", "9", "10", "11", "12", "14", "16", "18",
//   "20", "22", "24", "28", "32", "36", "48", "64",
// ];

// const TEXT_COLORS = [
//   "#000000", "#1a1a2e", "#16213e", "#0f3460",
//   "#533483", "#7b2d8b", "#c0392b", "#e74c3c",
//   "#e67e22", "#f39c12", "#f1c40f", "#2ecc71",
//   "#27ae60", "#1abc9c", "#3498db", "#2980b9",
//   "#ffffff", "#ecf0f1", "#bdc3c7", "#95a5a6",
//   "#7f8c8d", "#6c5ce7", "#a29bfe", "#fd79a8",
// ];

// const BG_COLORS = [
//   "transparent", "#fff9c4", "#fff3cd", "#fce4ec",
//   "#e8f5e9", "#e3f2fd", "#f3e5f5", "#ffe0b2",
//   "#e0f7fa", "#f1f8e9", "#fbe9e7", "#e8eaf6",
// ];


// function ToolBtn({
//   onClick, active, title, disabled, children,
// }: {
//   onClick: () => void;
//   active?: boolean;
//   title: string;
//   disabled?: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       type="button"
//       title={title}
//       disabled={disabled}
//       onMouseDown={(e) => { e.preventDefault(); onClick(); }}
//       className={`
//         relative h-7 w-7 flex items-center justify-center rounded-md text-sm
//         transition-all duration-100 select-none
//         ${active
//           ? "bg-purple-100 text-purple-700 shadow-inner"
//           : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
//         }
//         ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
//       `}
//     >
//       {children}
//     </button>
//   );
// }


// function Dropdown({
//   label, icon, children, width = "w-40",
// }: {
//   label?: string;
//   icon?: React.ReactNode;
//   children: React.ReactNode;
//   width?: string;
// }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   return (
//     <div ref={ref} className="relative">
//       <button
//         type="button"
//         onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
//         className="h-7 flex items-center gap-1 px-2 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer select-none"
//       >
//         {icon}
//         {label && <span className="max-w-[72px] truncate">{label}</span>}
//         <ChevronDown size={10} className="opacity-60 shrink-0" />
//       </button>

//       {open && (
//         <div className={`
//           absolute top-full left-0 mt-1 ${width} z-50
//           bg-white border border-gray-200 rounded-xl shadow-xl
//           py-1 max-h-60 overflow-y-auto
//         `}>
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }


// function ColorDropdown({
//   title, icon, colors, onSelect, currentColor,
// }: {
//   title: string;
//   icon: React.ReactNode;
//   colors: string[];
//   onSelect: (c: string) => void;
//   currentColor?: string;
// }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   return (
//     <div ref={ref} className="relative">
//       <button
//         type="button"
//         title={title}
//         onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
//         className="h-7 flex flex-col items-center justify-center w-7 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
//       >
//         {icon}
//         <div
//           className="w-4 h-1 rounded-sm mt-0.5 border border-gray-300"
//           style={{ backgroundColor: currentColor && currentColor !== "transparent" ? currentColor : "#000" }}
//         />
//       </button>

//       {open && (
//         <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2.5 w-[152px]">
//           <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">{title}</p>
//           <div className="grid grid-cols-6 gap-1">
//             {colors.map(c => (
//               <button
//                 key={c}
//                 type="button"
//                 onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
//                 title={c}
//                 className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
//                 style={{
//                   backgroundColor: c === "transparent" ? undefined : c,
//                   backgroundImage: c === "transparent"
//                     ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)"
//                     : undefined,
//                   backgroundSize: c === "transparent" ? "8px 8px" : undefined,
//                   backgroundPosition: c === "transparent" ? "0 0, 4px 4px" : undefined,
//                 }}
//               />
//             ))}
//           </div>
//           <div className="mt-2 pt-2 border-t border-gray-100">
//             <label className="text-[10px] text-gray-400 block mb-1">Custom</label>
//             <input
//               type="color"
//               className="w-full h-6 rounded cursor-pointer border border-gray-200"
//               onChange={(e) => { onSelect(e.target.value); }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// function Sep() {
//   return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
// }


// export function RichEditor({ value, onChange, placeholder, error, minHeight = "320px" }: RichEditorProps) {
//   const editorRef = useRef<HTMLDivElement>(null);
//   const isInternalChange = useRef(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const savedRangeRef = useRef<Range | null>(null);
//   const [textColor, setTextColor] = useState("#000000");
//   const [bgColor, setBgColor] = useState("transparent");
//   const [fontFamily, setFontFamily] = useState("");
//   const [fontSize, setFontSize] = useState("11");
//   const [activeStates, setActiveStates] = useState({
//     bold: false, italic: false, underline: false, strikeThrough: false,
//     justifyLeft: false, justifyCenter: false, justifyRight: false, justifyFull: false,
//     insertUnorderedList: false, insertOrderedList: false,
//   });

//   useEffect(() => {
//     const editor = editorRef.current;
//     if (!editor) return;
//     if (isInternalChange.current) { isInternalChange.current = false; return; }
//     if (editor.innerHTML !== value) {
//       editor.innerHTML = value ?? "";
//     }
//   }, [value]);

//   const updateActiveStates = useCallback(() => {
//     const states: typeof activeStates = {} as any;
//     const keys = Object.keys(activeStates) as Array<keyof typeof activeStates>;
//     keys.forEach(cmd => {
//       try { (states as any)[cmd] = document.queryCommandState(cmd); } catch { (states as any)[cmd] = false; }
//     });
//     setActiveStates(states);
//   }, []);

//   const exec = useCallback((cmd: string, value?: string) => {
//     editorRef.current?.focus();
//     document.execCommand(cmd, false, value);
//     isInternalChange.current = true;
//     onChange(editorRef.current?.innerHTML ?? "");
//     updateActiveStates();
//   }, [onChange, updateActiveStates]);

//   const handleInput = useCallback(() => {
//     isInternalChange.current = true;
//     onChange(editorRef.current?.innerHTML ?? "");
//     updateActiveStates();
//   }, [onChange, updateActiveStates]);

//   const handleFontFamily = useCallback((family: string) => {
//     setFontFamily(family);
//     if (family) exec("fontName", family);
//   }, [exec]);

//   const handleFontSize = useCallback((size: string) => {
//     setFontSize(size);
//     const sel = window.getSelection();
//     if (!sel || sel.rangeCount === 0) return;
//     const range = sel.getRangeAt(0);
//     if (range.collapsed) return;
//     const span = document.createElement("span");
//     span.style.fontSize = size + "pt";
//     range.surroundContents(span);
//     isInternalChange.current = true;
//     onChange(editorRef.current?.innerHTML ?? "");
//   }, [onChange]);

//   const handleTextColor = useCallback((color: string) => {
//     setTextColor(color);
//     exec("foreColor", color);
//   }, [exec]);

//   const handleBgColor = useCallback((color: string) => {
//     setBgColor(color);
//     exec("hiliteColor", color === "transparent" ? "transparent" : color);
//   }, [exec]);

//   const handleLink = useCallback(() => {
//     const url = prompt("Enter URL:", "https://");
//     if (url) exec("createLink", url);
//   }, [exec]);

//   const handleImageButtonClick = useCallback(() => {
//     const sel = window.getSelection();
//     if (sel && sel.rangeCount > 0) {
//       savedRangeRef.current = sel.getRangeAt(0).cloneRange();
//     }
//     fileInputRef.current?.click();
//   }, []);

//   const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = () => {
//       const dataUrl = reader.result as string;
//       const editor = editorRef.current;
//       if (!editor) return;

//       editor.focus();

//       const sel = window.getSelection();
//       if (sel) {
//         sel.removeAllRanges();
//         if (savedRangeRef.current) {
//           try {
//             sel.addRange(savedRangeRef.current);
//           } catch {
//             const range = document.createRange();
//             range.selectNodeContents(editor);
//             range.collapse(false);
//             sel.addRange(range);
//           }
//         } else {
//           const range = document.createRange();
//           range.selectNodeContents(editor);
//           range.collapse(false);
//           sel.addRange(range);
//         }
//       }

//       const img = document.createElement("img");
//       img.src = dataUrl;
//       img.alt = file.name;
//       img.style.maxWidth = "100%";
//       img.style.borderRadius = "6px";
//       img.style.margin = "4px 0";
//       img.style.display = "inline-block";

//       const currentSel = window.getSelection();
//       if (currentSel && currentSel.rangeCount > 0) {
//         const range = currentSel.getRangeAt(0);
//         range.deleteContents();
//         range.insertNode(img);
//         const newRange = document.createRange();
//         newRange.setStartAfter(img);
//         newRange.collapse(true);
//         currentSel.removeAllRanges();
//         currentSel.addRange(newRange);
//       } else {
//         editor.appendChild(img);
//       }

//       isInternalChange.current = true;
//       onChange(editor.innerHTML);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     };

//     reader.readAsDataURL(file);
//   }, [onChange]);

//   const insertTable = useCallback(() => {
//     const rows = parseInt(prompt("Rows:", "3") ?? "3", 10);
//     const cols = parseInt(prompt("Columns:", "3") ?? "3", 10);
//     if (!rows || !cols) return;
//     let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0">`;
//     for (let r = 0; r < rows; r++) {
//       html += "<tr>";
//       for (let c = 0; c < cols; c++) {
//         const isH = r === 0;
//         html += isH
//           ? `<th style="border:1px solid #ccc;padding:6px 8px;background:#f3e8ff;font-weight:600;text-align:left">&nbsp;</th>`
//           : `<td style="border:1px solid #ccc;padding:6px 8px">&nbsp;</td>`;
//       }
//       html += "</tr>";
//     }
//     html += "</table><p><br></p>";
//     exec("insertHTML", html);
//   }, [exec]);

//   const currentFontLabel = FONT_FAMILIES.find(f => f.value === fontFamily)?.label ?? "Font";

//   return (
//     <div className={`flex flex-col rounded-xl border ${error ? "border-red-300" : "border-gray-200"} bg-white overflow-hidden shadow-sm`}>

//       <input
//         ref={fileInputRef}
//         type="file"
//         accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
//         className="hidden"
//         onChange={handleFileChange}
//       />
//       <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">

//         {/* History */}
//         <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo size={13} /></ToolBtn>
//         <Sep />

//         {/* Font family */}
//         <Dropdown label={currentFontLabel} icon={<Type size={11} />} width="w-52">
//           {FONT_FAMILIES.map(f => (
//             <button
//               key={f.value}
//               type="button"
//               onMouseDown={(e) => { e.preventDefault(); handleFontFamily(f.value); }}
//               className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors ${fontFamily === f.value ? "text-purple-700 font-semibold bg-purple-50" : "text-gray-700"}`}
//               style={{ fontFamily: f.value || undefined }}
//             >
//               {f.label}
//             </button>
//           ))}
//         </Dropdown>

//         {/* Font size */}
//         <Dropdown label={fontSize + "pt"} width="w-20">
//           {FONT_SIZES.map(s => (
//             <button
//               key={s}
//               type="button"
//               onMouseDown={(e) => { e.preventDefault(); handleFontSize(s); }}
//               className={`w-full text-left px-3 py-1 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors ${fontSize === s ? "text-purple-700 font-semibold bg-purple-50" : "text-gray-700"}`}
//             >
//               {s}pt
//             </button>
//           ))}
//         </Dropdown>

//         <Sep />

//         {/* Text format */}
//         <ToolBtn onClick={() => exec("bold")} active={activeStates.bold} title="Bold"><Bold size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("italic")} active={activeStates.italic} title="Italic"><Italic size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("underline")} active={activeStates.underline} title="Underline"><Underline size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("strikeThrough")} active={activeStates.strikeThrough} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>

//         <Sep />

//         {/* Colors */}
//         <ColorDropdown
//           title="Text Color"
//           icon={<Palette size={13} />}
//           colors={TEXT_COLORS}
//           onSelect={handleTextColor}
//           currentColor={textColor}
//         />
//         <ColorDropdown
//           title="Highlight Color"
//           icon={<span className="text-[11px] font-bold leading-none">A</span>}
//           colors={BG_COLORS}
//           onSelect={handleBgColor}
//           currentColor={bgColor}
//         />

//         <Sep />

//         {/* Alignment */}
//         <ToolBtn onClick={() => exec("justifyLeft")} active={activeStates.justifyLeft} title="Align Left"><AlignLeft size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("justifyCenter")} active={activeStates.justifyCenter} title="Center"><AlignCenter size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("justifyRight")} active={activeStates.justifyRight} title="Align Right"><AlignRight size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("justifyFull")} active={activeStates.justifyFull} title="Justify"><AlignJustify size={13} /></ToolBtn>

//         <Sep />

//         {/* Lists */}
//         <ToolBtn onClick={() => exec("insertUnorderedList")} active={activeStates.insertUnorderedList} title="Bullet List"><List size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("insertOrderedList")} active={activeStates.insertOrderedList} title="Numbered List"><ListOrdered size={13} /></ToolBtn>

//         <Sep />

//         {/* Headings */}
//         <Dropdown label="Heading" width="w-36">
//           {[
//             { label: "Heading 1", tag: "<h1>" },
//             { label: "Heading 2", tag: "<h2>" },
//             { label: "Heading 3", tag: "<h3>" },
//             { label: "Paragraph", tag: "<p>" },
//           ].map(h => (
//             <button
//               key={h.tag}
//               type="button"
//               onMouseDown={(e) => {
//                 e.preventDefault();
//                 exec("formatBlock", h.tag);
//               }}
//               className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
//             >
//               {h.label}
//             </button>
//           ))}
//         </Dropdown>

//         {/* Block extras */}
//         <ToolBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Block Quote"><Quote size={13} /></ToolBtn>
//         <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Divider"><Minus size={13} /></ToolBtn>

//         <Sep />

//         {/* Insert */}
//         <ToolBtn onClick={handleLink} title="Insert Link"><Link size={13} /></ToolBtn>
//         <ToolBtn onClick={handleImageButtonClick} title="Insert Image from local file"><ImagePlus size={13} /></ToolBtn>
//         <ToolBtn onClick={insertTable} title="Insert Table"><Table2 size={13} /></ToolBtn>

//         <Sep />

//         {/* Clear */}
//         <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting">
//           <span className="text-[10px] font-bold leading-none flex items-center gap-px">T<X size={8} /></span>
//         </ToolBtn>
//       </div>

//       <div
//         ref={editorRef}
//         contentEditable
//         suppressContentEditableWarning
//         onInput={handleInput}
//         onKeyUp={updateActiveStates}
//         onMouseUp={updateActiveStates}
//         onSelect={updateActiveStates}
//         data-placeholder={placeholder}
//         className={`
//           rich-editor-content px-5 py-4 outline-none overflow-y-auto
//           text-gray-800 text-[13px] leading-relaxed
//         `}
//         style={{ minHeight }}
//       />

//       {error && (
//         <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-500">
//           ⚠ {error}
//         </div>
//       )}

//       {/* Styles */}
//       <style>{`
//         .rich-editor-content:empty:before {
//           content: attr(data-placeholder);
//           color: #9ca3af;
//           pointer-events: none;
//           position: absolute;
//         }
//         .rich-editor-content h1 { font-size: 1.5em; font-weight: 700; margin: 0.6em 0 0.3em; color: #1e0f3f; }
//         .rich-editor-content h2 { font-size: 1.25em; font-weight: 700; margin: 0.6em 0 0.3em; color: #2d1a5e; }
//         .rich-editor-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; color: #4a2080; }
//         .rich-editor-content p { margin: 0.35em 0; }
//         .rich-editor-content ul { list-style: disc; padding-left: 1.5em; margin: 0.3em 0; }
//         .rich-editor-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.3em 0; }
//         .rich-editor-content li { margin: 0.2em 0; }
//         .rich-editor-content blockquote {
//           border-left: 3px solid #7c3aed;
//           padding: 6px 12px;
//           margin: 6px 0;
//           background: #f5f0ff;
//           border-radius: 0 6px 6px 0;
//           font-style: italic;
//           color: #4c1d95;
//         }
//         .rich-editor-content hr { border: none; border-top: 1px solid #d8b4fe; margin: 10px 0; }
//         .rich-editor-content a { color: #7c3aed; text-decoration: underline; }
//         .rich-editor-content img {
//           max-width: 100%;
//           border-radius: 6px;
//           margin: 4px 0;
//           display: inline-block;
//         }
//         .rich-editor-content table {
//           border-collapse: collapse;
//           width: 100%;
//           margin: 8px 0;
//           font-size: 0.9em;
//         }
//         .rich-editor-content th {
//           background: #f3e8ff;
//           border: 1px solid #d8b4fe;
//           padding: 6px 10px;
//           font-weight: 600;
//           text-align: left;
//         }
//         .rich-editor-content td {
//           border: 1px solid #e5e7eb;
//           padding: 5px 10px;
//         }
//         .rich-editor-content tr:nth-child(even) td { background: #fafafa; }
//       `}</style>
//     </div>
//   );
// }



"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus, Quote,
  Undo, Redo, Link, ImagePlus, Table2,
  Palette, Type, ChevronDown, X,
} from "lucide-react";


interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  minHeight?: string;
}


const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Serif (Times)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans-Serif", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Monospace", value: "'Courier New', Courier, monospace" },
  { label: "Cursive", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Cinzel", value: "Cinzel, serif" },
];

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18",
  "20", "22", "24", "28", "32", "36", "48", "64",
];

const TEXT_COLORS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#533483", "#7b2d8b", "#c0392b", "#e74c3c",
  "#e67e22", "#f39c12", "#f1c40f", "#2ecc71",
  "#27ae60", "#1abc9c", "#3498db", "#2980b9",
  "#ffffff", "#ecf0f1", "#bdc3c7", "#95a5a6",
  "#7f8c8d", "#6c5ce7", "#a29bfe", "#fd79a8",
];

const BG_COLORS = [
  "transparent", "#fff9c4", "#fff3cd", "#fce4ec",
  "#e8f5e9", "#e3f2fd", "#f3e5f5", "#ffe0b2",
  "#e0f7fa", "#f1f8e9", "#fbe9e7", "#e8eaf6",
];


function ToolBtn({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`
        relative h-7 w-7 flex items-center justify-center rounded-md text-sm
        transition-all duration-100 select-none
        ${active
          ? "bg-purple-100 text-purple-700 shadow-inner"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}


function Dropdown({
  label, icon, children, width = "w-40",
}: {
  label?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className="h-7 flex items-center gap-1 px-2 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer select-none"
      >
        {icon}
        {label && <span className="max-w-[72px] truncate">{label}</span>}
        <ChevronDown size={10} className="opacity-60 shrink-0" />
      </button>

      {open && (
        <div className={`
          absolute top-full left-0 mt-1 ${width} z-50
          bg-white border border-gray-200 rounded-xl shadow-xl
          py-1 max-h-60 overflow-y-auto
        `}>
          {children}
        </div>
      )}
    </div>
  );
}


function ColorDropdown({
  title, icon, colors, onSelect, currentColor,
}: {
  title: string;
  icon: React.ReactNode;
  colors: string[];
  onSelect: (c: string) => void;
  currentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        className="h-7 flex flex-col items-center justify-center w-7 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
      >
        {icon}
        <div
          className="w-4 h-1 rounded-sm mt-0.5 border border-gray-300"
          style={{ backgroundColor: currentColor && currentColor !== "transparent" ? currentColor : "#000" }}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2.5 w-[152px]">
          <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">{title}</p>
          <div className="grid grid-cols-6 gap-1">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
                title={c}
                className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                style={{
                  backgroundColor: c === "transparent" ? undefined : c,
                  backgroundImage: c === "transparent"
                    ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)"
                    : undefined,
                  backgroundSize: c === "transparent" ? "8px 8px" : undefined,
                  backgroundPosition: c === "transparent" ? "0 0, 4px 4px" : undefined,
                }}
              />
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <label className="text-[10px] text-gray-400 block mb-1">Custom</label>
            <input
              type="color"
              className="w-full h-6 rounded cursor-pointer border border-gray-200"
              onChange={(e) => { onSelect(e.target.value); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
}

// ─── Image resize/delete overlay ────────────────────────────────────────────

interface ImageOverlayProps {
  img: HTMLImageElement;
  editorEl: HTMLDivElement;
  onCommit: () => void;
  onDeselect: () => void;
}

function ImageOverlay({ img, editorEl, onCommit, onDeselect }: ImageOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const resizeRef = useRef<{
    handle: string;
    startX: number; startY: number;
    startW: number; startH: number;
    aspectRatio: number;
  } | null>(null);

  // Keep overlay positioned over the image
  const syncRect = useCallback(() => {
    const editorRect = editorEl.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setRect({
      top: imgRect.top - editorRect.top + editorEl.scrollTop,
      left: imgRect.left - editorRect.left,
      width: imgRect.width,
      height: imgRect.height,
    });
  }, [img, editorEl]);

  useEffect(() => {
    syncRect();
    const observer = new ResizeObserver(syncRect);
    observer.observe(img);
    window.addEventListener("scroll", syncRect, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", syncRect, true);
    };
  }, [syncRect]);

  // Resize logic
  const onResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: img.offsetWidth,
      startH: img.offsetHeight,
      aspectRatio: img.offsetWidth / img.offsetHeight,
    };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const { handle, startX, startY, startW, startH, aspectRatio } = resizeRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW;
      let newH = startH;

      // Shift key = free resize, otherwise maintain aspect ratio
      const freeResize = ev.shiftKey;

      if (handle.includes("e")) newW = Math.max(40, startW + dx);
      if (handle.includes("w")) newW = Math.max(40, startW - dx);
      if (handle.includes("s")) newH = Math.max(40, startH + dy);
      if (handle.includes("n")) newH = Math.max(40, startH - dy);

      if (!freeResize) {
        // Determine dominant axis
        if (handle === "se" || handle === "nw") {
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          newW = Math.max(40, startW + (handle === "se" ? delta : -delta));
          newH = Math.round(newW / aspectRatio);
        } else if (handle === "sw" || handle === "ne") {
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          newW = Math.max(40, startW + (handle === "ne" ? delta : -delta));
          newH = Math.round(newW / aspectRatio);
        } else if (handle === "e" || handle === "w") {
          newH = Math.round(newW / aspectRatio);
        } else if (handle === "s" || handle === "n") {
          newW = Math.round(newH * aspectRatio);
        }
      }

      img.style.width = newW + "px";
      img.style.height = newH + "px";
      syncRect();
    };

    const onUp = () => {
      resizeRef.current = null;
      onCommit();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [img, syncRect, onCommit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    img.remove();
    onCommit();
    onDeselect();
  }, [img, onCommit, onDeselect]);

  // Handles: 8 corners + edges
  const handles = [
    { id: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
    { id: "n", cursor: "n-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
    { id: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
    { id: "e", cursor: "e-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
    { id: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
    { id: "s", cursor: "s-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
    { id: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
    { id: "w", cursor: "w-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
  ];

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* Selection border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "2px solid #7c3aed",
          borderRadius: 4,
          pointerEvents: "none",
          boxShadow: "0 0 0 1px rgba(124,58,237,0.2)",
        }}
      />

      {/* Delete button */}
      <button
        type="button"
        onMouseDown={handleDelete}
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#ef4444",
          border: "2px solid white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          pointerEvents: "all",
          zIndex: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          color: "white",
          padding: 0,
        }}
        title="Delete image"
      >
        <X size={11} strokeWidth={3} />
      </button>

      {/* Size label */}
      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(124,58,237,0.85)",
          color: "white",
          fontSize: 10,
          padding: "1px 6px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          backdropFilter: "blur(4px)",
        }}
      >
        {Math.round(rect.width)} × {Math.round(rect.height)}px
        <span style={{ opacity: 0.7, marginLeft: 4 }}>· Shift for free resize</span>
      </div>

      {/* Resize handles */}
      {handles.map(h => (
        <div
          key={h.id}
          onMouseDown={(e) => onResizeMouseDown(e, h.id)}
          style={{
            position: "absolute",
            width: 9,
            height: 9,
            background: "white",
            border: "2px solid #7c3aed",
            borderRadius: 2,
            cursor: h.cursor,
            pointerEvents: "all",
            zIndex: 15,
            ...h.style as any,
          }}
        />
      ))}
    </div>
  );
}


// ─── Main Editor ────────────────────────────────────────────────────────────

export function RichEditor({ value, onChange, placeholder, error, minHeight = "320px" }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("transparent");
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("11");
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [activeStates, setActiveStates] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false,
    justifyLeft: false, justifyCenter: false, justifyRight: false, justifyFull: false,
    insertUnorderedList: false, insertOrderedList: false,
  });

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    if (editor.innerHTML !== value) {
      editor.innerHTML = value ?? "";
    }
  }, [value]);

  // Click outside editor → deselect image
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSelectedImg(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Clicking an image inside editor → select it
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      e.preventDefault();
      setSelectedImg(target as HTMLImageElement);
    } else {
      setSelectedImg(null);
    }
  }, []);

  const commitChange = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const updateActiveStates = useCallback(() => {
    const states: typeof activeStates = {} as any;
    const keys = Object.keys(activeStates) as Array<keyof typeof activeStates>;
    keys.forEach(cmd => {
      try { (states as any)[cmd] = document.queryCommandState(cmd); } catch { (states as any)[cmd] = false; }
    });
    setActiveStates(states);
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
    updateActiveStates();
  }, [onChange, updateActiveStates]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
    updateActiveStates();
  }, [onChange, updateActiveStates]);

  const handleFontFamily = useCallback((family: string) => {
    setFontFamily(family);
    if (family) exec("fontName", family);
  }, [exec]);

  const handleFontSize = useCallback((size: string) => {
    setFontSize(size);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.style.fontSize = size + "pt";
    range.surroundContents(span);
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const handleTextColor = useCallback((color: string) => {
    setTextColor(color);
    exec("foreColor", color);
  }, [exec]);

  const handleBgColor = useCallback((color: string) => {
    setBgColor(color);
    exec("hiliteColor", color === "transparent" ? "transparent" : color);
  }, [exec]);

  const handleLink = useCallback(() => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  }, [exec]);

  const handleImageButtonClick = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        if (savedRangeRef.current) {
          try { sel.addRange(savedRangeRef.current); }
          catch {
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.addRange(range);
          }
        } else {
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          sel.addRange(range);
        }
      }

      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = file.name;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "6px";
      img.style.margin = "4px 0";
      img.style.display = "inline-block";
      img.style.cursor = "pointer";
      // Mark as resizable for CSS
      img.setAttribute("data-rich-img", "true");

      const currentSel = window.getSelection();
      if (currentSel && currentSel.rangeCount > 0) {
        const range = currentSel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        currentSel.removeAllRanges();
        currentSel.addRange(newRange);
      } else {
        editor.appendChild(img);
      }

      isInternalChange.current = true;
      onChange(editor.innerHTML);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-select the newly inserted image
      setSelectedImg(img);
    };

    reader.readAsDataURL(file);
  }, [onChange]);

  const insertTable = useCallback(() => {
    const rows = parseInt(prompt("Rows:", "3") ?? "3", 10);
    const cols = parseInt(prompt("Columns:", "3") ?? "3", 10);
    if (!rows || !cols) return;
    let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0">`;
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        const isH = r === 0;
        html += isH
          ? `<th style="border:1px solid #ccc;padding:6px 8px;background:#f3e8ff;font-weight:600;text-align:left">&nbsp;</th>`
          : `<td style="border:1px solid #ccc;padding:6px 8px">&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p><br></p>";
    exec("insertHTML", html);
  }, [exec]);

  const currentFontLabel = FONT_FAMILIES.find(f => f.value === fontFamily)?.label ?? "Font";

  return (
    <div
      className={`flex flex-col rounded-xl border ${error ? "border-red-300" : "border-gray-200"} bg-white overflow-hidden shadow-sm`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {/* <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm"> */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-30">
        <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo size={13} /></ToolBtn>
        <Sep />

        <Dropdown label={currentFontLabel} icon={<Type size={11} />} width="w-52">
          {FONT_FAMILIES.map(f => (
            <button
              key={f.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFontFamily(f.value); }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors ${fontFamily === f.value ? "text-purple-700 font-semibold bg-purple-50" : "text-gray-700"}`}
              style={{ fontFamily: f.value || undefined }}
            >
              {f.label}
            </button>
          ))}
        </Dropdown>

        <Dropdown label={fontSize + "pt"} width="w-20">
          {FONT_SIZES.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFontSize(s); }}
              className={`w-full text-left px-3 py-1 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors ${fontSize === s ? "text-purple-700 font-semibold bg-purple-50" : "text-gray-700"}`}
            >
              {s}pt
            </button>
          ))}
        </Dropdown>

        <Sep />

        <ToolBtn onClick={() => exec("bold")} active={activeStates.bold} title="Bold"><Bold size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} active={activeStates.italic} title="Italic"><Italic size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} active={activeStates.underline} title="Underline"><Underline size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} active={activeStates.strikeThrough} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>

        <Sep />

        <ColorDropdown title="Text Color" icon={<Palette size={13} />} colors={TEXT_COLORS} onSelect={handleTextColor} currentColor={textColor} />
        <ColorDropdown title="Highlight Color" icon={<span className="text-[11px] font-bold leading-none">A</span>} colors={BG_COLORS} onSelect={handleBgColor} currentColor={bgColor} />

        <Sep />

        <ToolBtn onClick={() => exec("justifyLeft")} active={activeStates.justifyLeft} title="Align Left"><AlignLeft size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} active={activeStates.justifyCenter} title="Center"><AlignCenter size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} active={activeStates.justifyRight} title="Align Right"><AlignRight size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} active={activeStates.justifyFull} title="Justify"><AlignJustify size={13} /></ToolBtn>

        <Sep />

        <ToolBtn onClick={() => exec("insertUnorderedList")} active={activeStates.insertUnorderedList} title="Bullet List"><List size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} active={activeStates.insertOrderedList} title="Numbered List"><ListOrdered size={13} /></ToolBtn>

        <Sep />

        <Dropdown label="Heading" width="w-36">
          {[
            { label: "Heading 1", tag: "<h1>" },
            { label: "Heading 2", tag: "<h2>" },
            { label: "Heading 3", tag: "<h3>" },
            { label: "Paragraph", tag: "<p>" },
          ].map(h => (
            <button
              key={h.tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", h.tag); }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              {h.label}
            </button>
          ))}
        </Dropdown>

        <ToolBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Block Quote"><Quote size={13} /></ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Divider"><Minus size={13} /></ToolBtn>

        <Sep />

        <ToolBtn onClick={handleLink} title="Insert Link"><Link size={13} /></ToolBtn>
        <ToolBtn onClick={handleImageButtonClick} title="Insert Image from local file"><ImagePlus size={13} /></ToolBtn>
        <ToolBtn onClick={insertTable} title="Insert Table"><Table2 size={13} /></ToolBtn>

        <Sep />

        <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting">
          <span className="text-[10px] font-bold leading-none flex items-center gap-px">T<X size={8} /></span>
        </ToolBtn>
      </div>

      {/* ── Editor area (position:relative so overlay is positioned correctly) */}
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateActiveStates}
          onMouseUp={(e) => { handleEditorClick(e); updateActiveStates(); }}
          onSelect={updateActiveStates}
          data-placeholder={placeholder}
          className="rich-editor-content px-5 py-4 outline-none overflow-y-auto text-gray-800 text-[13px] leading-relaxed"
          style={{ minHeight }}
        />

        {/* Image resize overlay — rendered inside the wrapper so it's positioned relative to it */}
        {selectedImg && editorRef.current && (
          <ImageOverlay
            img={selectedImg}
            editorEl={editorRef.current}
            onCommit={commitChange}
            onDeselect={() => setSelectedImg(null)}
          />
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-500">
          ⚠ {error}
        </div>
      )}

      <style>{`
        .rich-editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        .rich-editor-content h1 { font-size: 1.5em; font-weight: 700; margin: 0.6em 0 0.3em; color: #1e0f3f; }
        .rich-editor-content h2 { font-size: 1.25em; font-weight: 700; margin: 0.6em 0 0.3em; color: #2d1a5e; }
        .rich-editor-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; color: #4a2080; }
        .rich-editor-content p { margin: 0.35em 0; }
        .rich-editor-content ul { list-style: disc; padding-left: 1.5em; margin: 0.3em 0; }
        .rich-editor-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.3em 0; }
        .rich-editor-content li { margin: 0.2em 0; }
        .rich-editor-content blockquote {
          border-left: 3px solid #7c3aed;
          padding: 6px 12px;
          margin: 6px 0;
          background: #f5f0ff;
          border-radius: 0 6px 6px 0;
          font-style: italic;
          color: #4c1d95;
        }
        .rich-editor-content hr { border: none; border-top: 1px solid #d8b4fe; margin: 10px 0; }
        .rich-editor-content a { color: #7c3aed; text-decoration: underline; }
        .rich-editor-content img {
          max-width: 100%;
          border-radius: 6px;
          margin: 4px 0;
          display: inline-block;
          cursor: pointer;
        }
        .rich-editor-content img[data-rich-img]:hover {
          outline: 2px dashed #a78bfa;
          outline-offset: 2px;
        }
        .rich-editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          font-size: 0.9em;
        }
        .rich-editor-content th {
          background: #f3e8ff;
          border: 1px solid #d8b4fe;
          padding: 6px 10px;
          font-weight: 600;
          text-align: left;
        }
        .rich-editor-content td {
          border: 1px solid #e5e7eb;
          padding: 5px 10px;
        }
        .rich-editor-content tr:nth-child(even) td { background: #fafafa; }
      `}</style>
    </div>
  );
}