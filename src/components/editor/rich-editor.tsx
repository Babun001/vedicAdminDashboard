"use client";

import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Heading3, Quote, Minus
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minHeight?: string;
}

export function RichEditor({
  value,
  onChange,
  placeholder,
  error,
  minHeight = "320px",
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const isFocused = useRef(false);

  // ✅ Seed initial content only once on mount
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || "";
      isInitialized.current = true;
    }
  }, []);

  // ✅ Sync only when value changes externally (e.g. form reset)
  // Never update DOM while user is typing (isFocused guard)
  useEffect(() => {
    if (
      editorRef.current &&
      isInitialized.current &&
      !isFocused.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg ?? undefined);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange]
  );

  const insertHeading = useCallback(
    (tag: "h2" | "h3") => {
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const el = document.createElement(tag);
      el.textContent = sel.toString() || "Heading";
      range.deleteContents();
      range.insertNode(el);

      // Move cursor after the heading
      const newRange = document.createRange();
      newRange.setStartAfter(el);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange]
  );

  const insertDivider = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    const hr = document.createElement("hr");
    range.deleteContents();
    range.insertNode(hr);

    // Move cursor after hr
    const newRange = document.createRange();
    newRange.setStartAfter(hr);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const toolbarBtns = [
    { icon: <Bold size={13} />,       title: "Bold",          action: () => execCmd("bold") },
    { icon: <Italic size={13} />,      title: "Italic",        action: () => execCmd("italic") },
    { icon: <Underline size={13} />,   title: "Underline",     action: () => execCmd("underline") },
    { icon: <Heading2 size={13} />,    title: "Heading 2",     action: () => insertHeading("h2") },
    { icon: <Heading3 size={13} />,    title: "Heading 3",     action: () => insertHeading("h3") },
    { icon: <List size={13} />,        title: "Bullet list",   action: () => execCmd("insertUnorderedList") },
    { icon: <ListOrdered size={13} />, title: "Numbered list", action: () => execCmd("insertOrderedList") },
    { icon: <Quote size={13} />,       title: "Blockquote",    action: () => execCmd("formatBlock", "blockquote") },
    { icon: <Minus size={13} />,       title: "Divider",       action: insertDivider },
  ];

  return (
    <div className="space-y-1.5">
      {/* Toolbar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 p-2 rounded-t-xl border border-b-0",
          "bg-ink-900/80 border-white/10"
        )}
      >
        {toolbarBtns.map((btn, i) => (
          <button
            key={i}
            type="button"
            title={btn.title}
            onMouseDown={(e) => {
              e.preventDefault(); // ✅ prevent editor losing focus
              btn.action();
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editable area — NO dangerouslySetInnerHTML */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={cn(
          "w-full bg-ink-900/60 border rounded-b-xl px-5 py-4 text-sm text-white/85 font-body leading-relaxed",
          "focus:outline-none focus:border-cosmos-500 focus:ring-1 focus:ring-cosmos-500/50",
          "transition-all duration-200 overflow-y-auto",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-white/25 empty:before:pointer-events-none",
          "[&_h2]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-1",
          "[&_h3]:text-cosmos-300 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1",
          "[&_p]:mb-3",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-cosmos-500 [&_blockquote]:pl-4 [&_blockquote]:text-white/60 [&_blockquote]:italic [&_blockquote]:my-3",
          "[&_strong]:text-gold-400 [&_strong]:font-semibold",
          "[&_hr]:border-white/10 [&_hr]:my-4",
          error ? "border-ember-500/50" : "border-white/10"
        )}
      />

      {error && <p className="text-xs text-ember-400">⚠ {error}</p>}
    </div>
  );
}