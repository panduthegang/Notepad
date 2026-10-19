import { useState, useRef, useEffect } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Baseline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
} from "lucide-react";

import CustomSelect, { CustomSelectOption } from "./CustomSelect";

interface ToolbarProps {
  // TipTap editor instance passed down from App
  editor: Editor | null;
}

// System fonts (Windows native) and bundled open-source fonts (Fontsource)
const FONT_FAMILY_OPTIONS: CustomSelectOption[] = [
  { label: "Default (Inter)", shortLabel: "Inter", value: "", fontFamily: "" },
  // Bundled open-source fonts (Fontsource - work completely offline)
  {
    label: "Lora",
    shortLabel: "Lora",
    value: "'Lora Variable', 'Lora', Georgia, serif",
    fontFamily: "'Lora Variable', Georgia, serif",
  },
  {
    label: "Merriweather",
    shortLabel: "Merriweather",
    value: "'Merriweather', Georgia, serif",
    fontFamily: "'Merriweather', Georgia, serif",
  },
  {
    label: "JetBrains Mono",
    shortLabel: "JetBrains",
    value: "'JetBrains Mono Variable', 'JetBrains Mono', Consolas, monospace",
    fontFamily: "'JetBrains Mono Variable', Consolas, monospace",
  },
  // System fonts already present on Windows
  {
    label: "Arial",
    shortLabel: "Arial",
    value: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    fontFamily: "Arial, sans-serif",
  },
  {
    label: "Calibri",
    shortLabel: "Calibri",
    value: "Calibri, Carlito, sans-serif",
    fontFamily: "Calibri, sans-serif",
  },
  {
    label: "Consolas",
    shortLabel: "Consolas",
    value: "Consolas, 'Courier New', monospace",
    fontFamily: "Consolas, monospace",
  },
  {
    label: "Georgia",
    shortLabel: "Georgia",
    value: "Georgia, serif",
    fontFamily: "Georgia, serif",
  },
  {
    label: "Segoe UI",
    shortLabel: "Segoe UI",
    value: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamily: "'Segoe UI', sans-serif",
  },
  {
    label: "Times New Roman",
    shortLabel: "Times",
    value: "'Times New Roman', Times, serif",
    fontFamily: "'Times New Roman', serif",
  },
];

// Font sizes in pixels with 16px as default
const FONT_SIZE_OPTIONS: CustomSelectOption[] = [
  { label: "10px", shortLabel: "10px", value: "10" },
  { label: "12px", shortLabel: "12px", value: "12" },
  { label: "14px", shortLabel: "14px", value: "14" },
  { label: "16px (Default)", shortLabel: "16px", value: "16" },
  { label: "18px", shortLabel: "18px", value: "18" },
  { label: "20px", shortLabel: "20px", value: "20" },
  { label: "24px", shortLabel: "24px", value: "24" },
  { label: "28px", shortLabel: "28px", value: "28" },
  { label: "32px", shortLabel: "32px", value: "32" },
  { label: "36px", shortLabel: "36px", value: "36" },
];

// Preset text colors curated in a 5x2 grid with high legibility & aesthetic harmony
const TEXT_COLORS = [
  { name: "Default (Ink)", value: "", preview: "#0f172a", checkColor: "text-white" },
  { name: "Slate Gray", value: "#64748b", preview: "#64748b", checkColor: "text-white" },
  { name: "Ruby Red", value: "#e11d48", preview: "#e11d48", checkColor: "text-white" },
  { name: "Amber Orange", value: "#ea580c", preview: "#ea580c", checkColor: "text-white" },
  { name: "Golden Amber", value: "#d97706", preview: "#d97706", checkColor: "text-white" },
  { name: "Emerald Green", value: "#16a34a", preview: "#16a34a", checkColor: "text-white" },
  { name: "Teal Cyan", value: "#0d9488", preview: "#0d9488", checkColor: "text-white" },
  { name: "Royal Blue", value: "#2563eb", preview: "#2563eb", checkColor: "text-white" },
  { name: "Purple Violet", value: "#7c3aed", preview: "#7c3aed", checkColor: "text-white" },
  { name: "Rose Pink", value: "#db2777", preview: "#db2777", checkColor: "text-white" },
];

// 4 distinct highlight swatches matching design tokens
const HIGHLIGHT_COLORS = [
  {
    name: "Yellow",
    value: "#fef08a",
    cssVar: "var(--highlight-yellow)",
    activeRing: "ring-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.35)]",
    checkColor: "text-amber-800",
  },
  {
    name: "Green",
    value: "#bbf7d0",
    cssVar: "var(--highlight-green)",
    activeRing: "ring-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.35)]",
    checkColor: "text-emerald-800",
  },
  {
    name: "Pink",
    value: "#fbcfe8",
    cssVar: "var(--highlight-pink)",
    activeRing: "ring-pink-400/80 shadow-[0_0_8px_rgba(244,114,182,0.35)]",
    checkColor: "text-pink-800",
  },
  {
    name: "Blue",
    value: "#bfdbfe",
    cssVar: "var(--highlight-blue)",
    activeRing: "ring-sky-400/80 shadow-[0_0_8px_rgba(96,165,250,0.35)]",
    checkColor: "text-sky-800",
  },
];

export default function Toolbar({ editor }: ToolbarProps) {
  // State for toggling the text color popover
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker popover on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsColorPickerOpen(false);
      }
    }
    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isColorPickerOpen]);

  // Subscribe Toolbar to all relevant TipTap state updates using useEditorState
  const toolbarState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          canUndo: false,
          canRedo: false,
          isBold: false,
          isItalic: false,
          isUnderline: false,
          activeFontFamily: "",
          activeFontSize: "",
          activeTextColor: "",
          activeHighlightColor: undefined as string | undefined,
          textAlign: "left",
        };
      }

      // Read active formatting marks and attributes from TextStyle mark
      const textStyleAttrs = ctx.editor.getAttributes("textStyle");
      const currentFamily = (textStyleAttrs.fontFamily as string) || "";
      const currentSize = (textStyleAttrs.fontSize as string) || "";
      const currentColor = (textStyleAttrs.color as string) || "";
      const highlightColor = ctx.editor.getAttributes("highlight")?.color as
        | string
        | undefined;

      // Determine active alignment
      let alignment = "left";
      if (ctx.editor.isActive({ textAlign: "center" })) alignment = "center";
      else if (ctx.editor.isActive({ textAlign: "right" })) alignment = "right";
      else if (ctx.editor.isActive({ textAlign: "justify" }))
        alignment = "justify";

      return {
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isUnderline: ctx.editor.isActive("underline"),
        activeFontFamily: currentFamily,
        activeFontSize: currentSize,
        activeTextColor: currentColor,
        activeHighlightColor: highlightColor,
        textAlign: alignment,
      };
    },
  });

  // Skeleton placeholder when editor is loading
  if (!editor) {
    return (
      <header className="px-4 pt-3 pb-1 flex items-center select-none">
        <div className="h-11 w-full max-w-[800px] bg-surface/60 rounded-2xl animate-pulse border border-border" />
      </header>
    );
  }

  const canUndo = toolbarState?.canUndo ?? false;
  const canRedo = toolbarState?.canRedo ?? false;
  const isBold = toolbarState?.isBold ?? false;
  const isItalic = toolbarState?.isItalic ?? false;
  const isUnderline = toolbarState?.isUnderline ?? false;
  const activeFontFamily = toolbarState?.activeFontFamily ?? "";
  const activeFontSize = toolbarState?.activeFontSize ?? "";
  const activeTextColor = toolbarState?.activeTextColor ?? "";
  const activeHighlightColor = toolbarState?.activeHighlightColor;
  const currentAlignment = toolbarState?.textAlign ?? "left";

  // Clean raw font size string (e.g. "18px" -> "18")
  const numericFontSize = activeFontSize.replace("px", "");

  return (
    <header className="px-4 pt-3 pb-1 flex items-center justify-start select-none z-10">
      {/* Floating Island Dock with Soft Corners */}
      <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-surface/95 backdrop-blur-md border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] rounded-2xl transition-all">
        {/* GROUP 1: History Controls (Undo & Redo) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!canUndo}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text hover:bg-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!canRedo}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text hover:bg-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* GROUP 2: Font Family & Font Size Custom Selects */}
        <div className="flex items-center gap-1.5">
          {/* Custom Font Family Select */}
          <CustomSelect
            value={activeFontFamily}
            onChange={(val) => {
              if (val === "") {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(val).run();
              }
            }}
            options={FONT_FAMILY_OPTIONS}
            placeholder="Inter"
            title="Font Family"
            ariaLabel="Font Family"
            minWidth="110px"
          />

          {/* Custom Font Size Select */}
          <CustomSelect
            value={numericFontSize || "16"}
            onChange={(val) => {
              if (val === "" || val === "16") {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(`${val}px`).run();
              }
            }}
            options={FONT_SIZE_OPTIONS}
            placeholder="16px"
            title="Font Size"
            ariaLabel="Font Size"
            minWidth="72px"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* GROUP 3: Bold, Italic, Underline */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isBold
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={16} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isItalic
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={16} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isUnderline
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Underline (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* GROUP 4: Text Color & Highlight Colors */}
        <div className="flex items-center gap-2">
          {/* Text Color Picker Trigger with Popover */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer outline-none select-none ${
                isColorPickerOpen
                  ? "bg-hover text-text shadow-xs ring-1 ring-border"
                  : "text-text hover:bg-hover active:scale-95"
              }`}
              title="Text Color"
              aria-label="Text Color"
              aria-expanded={isColorPickerOpen}
            >
              <Baseline size={15} strokeWidth={2.4} />
              <div
                className="w-3.5 h-[3px] rounded-full mt-0.5 transition-colors duration-150"
                style={{ backgroundColor: activeTextColor || "var(--text)" }}
              />
            </button>

            {/* Floating Color Palette Popover */}
            {isColorPickerOpen && (
              <div
                role="dialog"
                aria-label="Text Color Palette"
                className="absolute top-10 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-xl border border-border shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-3 z-50 min-w-[172px] flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none"
              >
                {/* Header with Title and Quick Reset */}
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-semibold tracking-tight text-text">
                    Text Color
                  </span>
                  {activeTextColor ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        editor.chain().focus().unsetColor().run();
                        setIsColorPickerOpen(false);
                      }}
                      className="text-[10px] font-medium text-muted hover:text-text px-1.5 py-0.5 rounded-md hover:bg-hover transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-muted/70">
                      Default
                    </span>
                  )}
                </div>

                {/* Symmetrical 5x2 Color Grid */}
                <div className="grid grid-cols-5 gap-2 justify-items-center">
                  {TEXT_COLORS.map((col) => {
                    const isSelected = activeTextColor === col.value;

                    return (
                      <button
                        key={col.name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (col.value === "") {
                            editor.chain().focus().unsetColor().run();
                          } else {
                            editor.chain().focus().setColor(col.value).run();
                          }
                          setIsColorPickerOpen(false);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative outline-none ring-1 ring-black/10 dark:ring-white/10 ${
                          isSelected
                            ? "scale-110 shadow-sm ring-2 ring-offset-2 ring-text/80"
                            : "hover:scale-115 active:scale-90 hover:shadow-xs"
                        }`}
                        style={{
                          backgroundColor:
                            col.value === "" ? "var(--text)" : col.preview,
                        }}
                        title={col.name}
                        aria-label={col.name}
                      >
                        {isSelected && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className={col.checkColor}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Pickers */}
          <div className="flex items-center gap-1.5 pl-0.5">
            {HIGHLIGHT_COLORS.map((color) => {
              const isCurrentColorActive = activeHighlightColor === color.value;

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHighlight({ color: color.value })
                      .run()
                  }
                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90 ${
                    isCurrentColorActive
                      ? `ring-2 ring-offset-1.5 ring-offset-surface ${color.activeRing} scale-105`
                      : "border border-black/10 hover:shadow-2xs"
                  }`}
                  style={{ backgroundColor: color.cssVar }}
                  title={`Highlight ${color.name} (click to toggle)`}
                  aria-label={`Highlight ${color.name}`}
                >
                  {isCurrentColorActive && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className={color.checkColor}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* GROUP 5: Text Alignment (Left, Center, Right, Justify) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              currentAlignment === "left"
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Align Left"
            aria-label="Align Left"
          >
            <AlignLeft size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              currentAlignment === "center"
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Align Center"
            aria-label="Align Center"
          >
            <AlignCenter size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              currentAlignment === "right"
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Align Right"
            aria-label="Align Right"
          >
            <AlignRight size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              currentAlignment === "justify"
                ? "bg-text text-surface shadow-xs font-semibold scale-105"
                : "text-text hover:bg-hover active:scale-95"
            }`}
            title="Justify"
            aria-label="Justify"
          >
            <AlignJustify size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  );
}
