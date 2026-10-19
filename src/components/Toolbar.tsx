import { Editor, useEditorState } from "@tiptap/react";
import { Undo, Redo } from "lucide-react";

interface ToolbarProps {
  // editor instance passed down from App
  editor: Editor | null;
}

// 4 distinct highlight colors matching our design tokens
const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a", cssVar: "var(--highlight-yellow)" },
  { name: "Green", value: "#bbf7d0", cssVar: "var(--highlight-green)" },
  { name: "Pink", value: "#fbcfe8", cssVar: "var(--highlight-pink)" },
  { name: "Blue", value: "#bfdbfe", cssVar: "var(--highlight-blue)" },
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
          isHighlightActive: false,
        };
      }
      return {
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        activeHighlightColor: ctx.editor.getAttributes("highlight")?.color as string | undefined,
        isHighlightActive: ctx.editor.isActive("highlight"),
      };
    },
  });

  // If the editor is not yet initialized, render a disabled placeholder toolbar
  if (!editor) {
    return <div className="toolbar flex-none h-12 bg-toolbar border-b border-border" />;
  }

  const canUndo = toolbarState?.canUndo ?? false;
  const canRedo = toolbarState?.canRedo ?? false;
  const isBold = toolbarState?.isBold ?? false;
  const isItalic = toolbarState?.isItalic ?? false;
  const activeHighlightColor = toolbarState?.activeHighlightColor;
  const isHighlightActive = toolbarState?.isHighlightActive ?? false;

  return (
    <div className="toolbar flex-none flex items-center gap-1.5 px-4 py-2 bg-toolbar border-b border-border select-none">
      {/* History Controls: Undo and Redo */}
      <div className="toolbar-group flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!canUndo}
          className="toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!canRedo}
          className="toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="toolbar-divider w-px h-5.5 bg-border mx-1.5" />

      {/* Formatting Controls: Bold and Italic */}
      <div className="toolbar-group flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isBold
              ? "bg-active border-accent text-accent-active font-semibold"
              : "bg-surface text-text hover:bg-hover hover:border-border"
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isItalic
              ? "bg-active border-accent text-accent-active font-semibold"
              : "bg-surface text-text hover:bg-hover hover:border-border"
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
      </div>

      <div className="toolbar-divider w-px h-5.5 bg-border mx-1.5" />

      {/* Highlight Color Pickers */}
      <div className="toolbar-group flex items-center gap-1">
        <span className="toolbar-label text-[13px] font-medium text-muted mr-1">Highlight:</span>
        {HIGHLIGHT_COLORS.map((color) => {
          // Check if current selection has this color
          const isCurrentColorActive = activeHighlightColor === color.value;

          return (
            <button
              key={color.name}
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHighlight({ color: color.value }).run()
              }
              className={`color-btn w-[22px] h-[22px] rounded-full border-2 cursor-pointer transition-transform hover:scale-115 ${
                isCurrentColorActive
                  ? "border-text scale-115 shadow-[0_0_0_2px_var(--accent)]"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color.cssVar }}
              title={`Highlight ${color.name}`}
              aria-label={`Highlight ${color.name}`}
            />
          );
        })}

        {/* Button to remove any highlight from the selected text */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          disabled={!isHighlightActive}
          className="toolbar-btn text-btn inline-flex items-center justify-center h-8 px-2 text-xs font-medium rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Remove highlight"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
