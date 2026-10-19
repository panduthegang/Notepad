import { Editor, useEditorState } from "@tiptap/react";
import { Undo, Redo, Bold, Italic, Check } from "lucide-react";

interface ToolbarProps {
  // editor instance passed down from App
  editor: Editor | null;
}

// 4 distinct highlight colors with harmonious active rings and check icons
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
  // Subscribe Toolbar to editor state changes (history, active marks, selection)
  // so Undo, Redo, Bold, Italic, and Swatches dynamically update.
  const toolbarState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          canUndo: false,
          canRedo: false,
          isBold: false,
          isItalic: false,
          activeHighlightColor: undefined as string | undefined,
        };
      }
      return {
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        activeHighlightColor: ctx.editor.getAttributes("highlight")?.color as string | undefined,
      };
    },
  });

  // Placeholder skeleton when editor is not yet initialized
  if (!editor) {
    return (
      <header className="px-4 pt-3 pb-2 flex items-center select-none">
        <div className="h-11 w-80 bg-surface/60 rounded-2xl animate-pulse border border-border" />
      </header>
    );
  }

  const canUndo = toolbarState?.canUndo ?? false;
  const canRedo = toolbarState?.canRedo ?? false;
  const isBold = toolbarState?.isBold ?? false;
  const isItalic = toolbarState?.isItalic ?? false;
  const activeHighlightColor = toolbarState?.activeHighlightColor;

  return (
    <header className="px-4 pt-3 pb-1 flex items-center justify-start select-none z-10">
      {/* Floating Island Dock with Soft Corners */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/95 backdrop-blur-md border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] rounded-2xl transition-all">
        {/* History Controls: Undo and Redo */}
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

        {/* Formatting Controls: Bold and Italic */}
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
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Highlight Color Pickers */}
        <div className="flex items-center gap-1.5 pl-1 pr-1">
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase mr-1">
            Highlight:
          </span>
          <div className="flex items-center gap-2">
            {HIGHLIGHT_COLORS.map((color) => {
              const isCurrentColorActive = activeHighlightColor === color.value;

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color: color.value }).run()
                  }
                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90 ${
                    isCurrentColorActive
                      ? `ring-2 ring-offset-1.5 ring-offset-surface ${color.activeRing} scale-105`
                      : "border border-black/10 hover:shadow-2xs"
                  }`}
                  style={{ backgroundColor: color.cssVar }}
                  title={`Highlight ${color.name} (click again to remove)`}
                  aria-label={`Highlight ${color.name}`}
                >
                  {isCurrentColorActive && (
                    <Check size={12} strokeWidth={3} className={color.checkColor} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
