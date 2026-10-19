import { Editor } from "@tiptap/react";

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
  // If the editor is not yet initialized, render a disabled placeholder toolbar
  if (!editor) {
    return <div className="toolbar flex-none h-12 bg-toolbar border-b border-border" />;
  }

  return (
    <div className="toolbar flex-none flex items-center gap-1.5 px-4 py-2 bg-toolbar border-b border-border select-none">
      {/* History Controls: Undo and Redo */}
      <div className="toolbar-group flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-divider w-px h-5.5 bg-border mx-1.5" />

      {/* Formatting Controls: Bold and Italic */}
      <div className="toolbar-group flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            editor.isActive("bold")
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
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`toolbar-btn inline-flex items-center justify-center min-w-8 h-8 px-2 text-[13px] font-medium rounded-md border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            editor.isActive("italic")
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
          // Check if the current selection already has this specific highlight color
          const isCurrentColorActive = editor.isActive("highlight", { color: color.value });

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
          disabled={!editor.isActive("highlight")}
          className="toolbar-btn text-btn inline-flex items-center justify-center h-8 px-2 text-xs font-medium rounded-md border border-transparent bg-surface text-text hover:bg-hover hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Remove highlight"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
