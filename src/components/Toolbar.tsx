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
  Sun,
  Moon,
  Highlighter,
} from "lucide-react";

import CustomSelect, { CustomSelectOption } from "./CustomSelect";
import Tooltip from "./Tooltip";

interface ToolbarProps {
  // TipTap editor instance passed down from App
  editor: Editor | null;
  // Current active theme ("light" or "dark")
  theme?: "light" | "dark";
  // Callback to toggle theme
  onToggleTheme?: () => void;
}

// System fonts (Windows native) and bundled open-source fonts (Fontsource - 100% offline)
const FONT_FAMILY_OPTIONS: CustomSelectOption[] = [
  { label: "Default (Inter)", shortLabel: "Inter", value: "", fontFamily: "" },
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

// Preset text colors curated to be readable on BOTH white and black backgrounds.
// Default text color is "" (inherit) so it automatically adapts to light/dark themes.
const TEXT_COLORS = [
  { name: "Default", value: "", preview: "var(--text)", checkColor: "text-surface" },
  { name: "Ruby Red", value: "#e11d48", preview: "#e11d48", checkColor: "text-white" },
  { name: "Amber Orange", value: "#ea580c", preview: "#ea580c", checkColor: "text-white" },
  { name: "Golden Amber", value: "#ca8a04", preview: "#ca8a04", checkColor: "text-white" },
  { name: "Emerald Green", value: "#16a34a", preview: "#16a34a", checkColor: "text-white" },
  { name: "Teal Cyan", value: "#0d9488", preview: "#0d9488", checkColor: "text-white" },
  { name: "Royal Blue", value: "#2563eb", preview: "#2563eb", checkColor: "text-white" },
  { name: "Purple", value: "#9333ea", preview: "#9333ea", checkColor: "text-white" },
  { name: "Rose Pink", value: "#db2777", preview: "#db2777", checkColor: "text-white" },
];

// Per-theme highlight color tokens (variables adapt automatically between light and dark modes)
const HIGHLIGHT_COLORS = [
  {
    name: "Yellow",
    value: "var(--highlight-yellow)",
    preview: "var(--highlight-yellow)",
    checkColor: "text-text",
  },
  {
    name: "Green",
    value: "var(--highlight-green)",
    preview: "var(--highlight-green)",
    checkColor: "text-text",
  },
  {
    name: "Pink",
    value: "var(--highlight-pink)",
    preview: "var(--highlight-pink)",
    checkColor: "text-text",
  },
  {
    name: "Blue",
    value: "var(--highlight-blue)",
    preview: "var(--highlight-blue)",
    checkColor: "text-text",
  },
  {
    name: "Orange",
    value: "var(--highlight-orange)",
    preview: "var(--highlight-orange)",
    checkColor: "text-text",
  },
  {
    name: "Purple",
    value: "var(--highlight-purple)",
    preview: "var(--highlight-purple)",
    checkColor: "text-text",
  },
  {
    name: "Red",
    value: "var(--highlight-red)",
    preview: "var(--highlight-red)",
    checkColor: "text-text",
  },
  {
    name: "Cyan",
    value: "var(--highlight-cyan)",
    preview: "var(--highlight-cyan)",
    checkColor: "text-text",
  },
];

export default function Toolbar({ editor, theme = "light", onToggleTheme }: ToolbarProps) {
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
        <div className="h-10 w-full max-w-[800px] bg-surface rounded-none animate-pulse border border-border" />
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
      {/* Sharp Architectural Dock with 1px border and flat architectural shadow */}
      <div className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-surface border border-border shadow-[3px_3px_0px_var(--border)] rounded-none transition-colors duration-150">
        {/* GROUP 1: History Controls (Undo & Redo) */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Undo (Ctrl+Z)">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!canUndo}
              className="w-8 h-8 rounded-none border border-transparent flex items-center justify-center text-text hover:bg-hover active:bg-active disabled:opacity-20 disabled:pointer-events-none transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
              aria-label="Undo"
            >
              <Undo size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>

          <Tooltip content="Redo (Ctrl+Y)">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!canRedo}
              className="w-8 h-8 rounded-none border border-transparent flex items-center justify-center text-text hover:bg-hover active:bg-active disabled:opacity-20 disabled:pointer-events-none transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
              aria-label="Redo"
            >
              <Redo size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>
        </div>

        {/* Subtle Inner Divider */}
        <div className="w-px h-5 bg-border-subtle mx-1" />

        {/* GROUP 2: Font Family & Font Size Custom Selects */}
        <div className="flex items-center gap-1">
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
            ariaLabel="Font Family"
            minWidth="105px"
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
            ariaLabel="Font Size"
            minWidth="70px"
          />
        </div>

        {/* Subtle Inner Divider */}
        <div className="w-px h-5 bg-border-subtle mx-1" />

        {/* GROUP 3: Bold, Italic, Underline */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Bold (Ctrl+B)">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                isBold
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Bold"
            >
              <Bold size={15} strokeWidth={2.4} />
            </button>
          </Tooltip>

          <Tooltip content="Italic (Ctrl+I)">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                isItalic
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Italic"
            >
              <Italic size={15} strokeWidth={2.4} />
            </button>
          </Tooltip>

          <Tooltip content="Underline (Ctrl+U)">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                isUnderline
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Underline"
            >
              <Underline size={15} strokeWidth={2.4} />
            </button>
          </Tooltip>
        </div>

        {/* Subtle Inner Divider */}
        <div className="w-px h-5 bg-border-subtle mx-1" />

        {/* GROUP 4: Text Color & Colored Highlight Swatches */}
        <div className="flex items-center gap-1.5">
          {/* Text Color Picker Trigger with Popover */}
          <div className="relative" ref={colorPickerRef}>
            <Tooltip content="Text Color">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsColorPickerOpen((prev) => !prev)}
                className={`w-8 h-8 rounded-none border flex flex-col items-center justify-center transition-colors duration-100 cursor-pointer outline-none select-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                  isColorPickerOpen
                    ? "border-text bg-hover text-text"
                    : "border-transparent text-text hover:bg-hover active:bg-active"
                }`}
                aria-label="Text Color"
                aria-expanded={isColorPickerOpen}
              >
                <Baseline size={14} strokeWidth={2.4} />
                <div
                  className="w-3.5 h-[2px] mt-0.5"
                  style={{ backgroundColor: activeTextColor || "var(--text)" }}
                />
              </button>
            </Tooltip>

            {/* Sharp Architectural Color Palette Popover */}
            {isColorPickerOpen && (
              <div
                role="dialog"
                aria-label="Text Color Palette"
                className="absolute top-9 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-[3px_3px_0px_var(--border)] rounded-none p-2.5 z-50 min-w-[160px] flex flex-col gap-2 select-none animate-in fade-in duration-100"
              >
                {/* Header with Title and Quick Reset */}
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-semibold tracking-tight text-text uppercase">
                    Color
                  </span>
                  {activeTextColor ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        editor.chain().focus().unsetColor().run();
                        setIsColorPickerOpen(false);
                      }}
                      className="text-[10px] font-semibold text-text hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-muted">
                      Default
                    </span>
                  )}
                </div>

                {/* Symmetrical Sharp Color Grid */}
                <div className="grid grid-cols-5 gap-1.5 justify-items-center">
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
                        className={`w-5 h-5 rounded-none flex items-center justify-center cursor-pointer transition-transform duration-100 border border-border outline-none focus-visible:ring-2 focus-visible:ring-text ${
                          isSelected
                            ? "ring-2 ring-text ring-offset-1 ring-offset-surface scale-105"
                            : "hover:scale-110 active:scale-95"
                        }`}
                        style={{
                          backgroundColor:
                            col.value === "" ? "var(--text)" : col.preview,
                        }}
                        aria-label={col.name}
                      >
                        {isSelected && (
                          <Check
                            size={10}
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

          {/* Subtle Inner Divider between Text Color and Highlight Colors */}
          <div className="w-px h-5 bg-border-subtle mx-0.5" />

          {/* Highlight Indicator Button */}
          <Tooltip content={activeHighlightColor ? "Remove Highlight" : "Text Highlight"}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (activeHighlightColor) {
                  editor.chain().focus().unsetHighlight().run();
                } else {
                  editor.chain().focus().toggleHighlight({ color: "var(--highlight-yellow)" }).run();
                }
              }}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                activeHighlightColor
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Text Highlight"
            >
              <Highlighter size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>

          {/* Colored Highlight Swatches - Sharp Squares with Custom Tooltips */}
          <div className="flex items-center gap-1 pl-0.5">
            {HIGHLIGHT_COLORS.map((color) => {
              const isCurrentColorActive = activeHighlightColor === color.value;

              return (
                <Tooltip key={color.name} content={`Highlight ${color.name}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: color.value })
                        .run()
                    }
                    className={`w-5 h-5 rounded-none border border-border flex items-center justify-center cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-95 outline-none select-none focus-visible:ring-2 focus-visible:ring-text ${
                      isCurrentColorActive
                        ? "ring-2 ring-text ring-offset-1 ring-offset-surface scale-105"
                        : ""
                    }`}
                    style={{ backgroundColor: color.preview }}
                    aria-label={`Highlight ${color.name}`}
                  >
                    {isCurrentColorActive && (
                      <Check
                        size={10}
                        strokeWidth={3}
                        className={color.checkColor}
                      />
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Subtle Inner Divider */}
        <div className="w-px h-5 bg-border-subtle mx-1" />

        {/* GROUP 5: Text Alignment (Left, Center, Right, Justify) */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Align Left">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                currentAlignment === "left"
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Align Left"
            >
              <AlignLeft size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>

          <Tooltip content="Align Center">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                currentAlignment === "center"
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Align Center"
            >
              <AlignCenter size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>

          <Tooltip content="Align Right">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                currentAlignment === "right"
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Align Right"
            >
              <AlignRight size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>

          <Tooltip content="Justify">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={`w-8 h-8 rounded-none border border-transparent flex items-center justify-center transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                currentAlignment === "justify"
                  ? "bg-text text-surface font-semibold"
                  : "text-text hover:bg-hover active:bg-active"
              }`}
              aria-label="Justify"
            >
              <AlignJustify size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>
        </div>

        {/* GROUP 6: Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <>
            <div className="w-px h-5 bg-border-subtle mx-1" />
            <Tooltip content={theme === "light" ? "Switch to Dark mode" : "Switch to Light mode"}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-none border border-transparent flex items-center justify-center text-text hover:bg-hover active:bg-active transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon size={15} strokeWidth={2.2} />
                ) : (
                  <Sun size={15} strokeWidth={2.2} />
                )}
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
