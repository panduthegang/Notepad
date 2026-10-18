import { Editor } from "@tiptap/react";

interface ToolbarProps {
  // editor instance passed down from App
  editor: Editor | null;
}

// 4 distinct highlight colors requested
const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Blue", value: "#bfdbfe" },
];

export default function Toolbar({ editor }: ToolbarProps) {
  // If the editor is not yet initialized, render a disabled placeholder toolbar
  if (!editor) {
    return <div className="toolbar" />;
  }

  return (
    <div className="toolbar">
      {/* History Controls: Undo and Redo */}
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="toolbar-btn"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="toolbar-btn"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Formatting Controls: Bold and Italic */}
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Highlight Color Pickers */}
      <div className="toolbar-group">
        <span className="toolbar-label">Highlight:</span>
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
              className={`color-btn ${isCurrentColorActive ? "is-active" : ""}`}
              style={{ backgroundColor: color.value }}
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
          className="toolbar-btn text-btn"
          title="Remove highlight"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
