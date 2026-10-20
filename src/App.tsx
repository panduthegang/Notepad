import { useState, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { X } from "lucide-react";

import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import StatusBar from "./components/StatusBar";
// Phase 3b: file open/save logic lives in this hook
import { useFileActions } from "./lib/useFileActions";
import "./App.css";

export default function App() {
  // Theme state: "light" or "dark" with localStorage persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const attr = typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") : null;
    if (attr === "dark" || attr === "light") return attr;
    const saved = localStorage.getItem("hrnote-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Sync data-theme attribute with DOM and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hrnote-theme", theme);
  }, [theme]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Configure and initialize the TipTap rich-text editor instance
  const editor = useEditor({
    extensions: [
      // StarterKit provides standard marks & nodes (Bold, Italic, Underline, Paragraphs, History, etc.)
      StarterKit,

      // TextStyleKit bundles TextStyle, FontFamily, FontSize, Color, etc.
      TextStyleKit,

      // TextAlign handles paragraph and heading text alignment
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      // Highlight extension with multi-color support enabled
      Highlight.configure({
        multicolor: true,
      }),

      // Placeholder extension showing guiding text when document is blank
      Placeholder.configure({
        placeholder: "Start writing...",
      }),

      // CharacterCount extension for live word and character tracking
      CharacterCount,
    ],
    // Starting content of our notepad
    content: "",
    // immediatelyRender: false ensures smooth hydration and prevents StrictMode warnings in React 19
    immediatelyRender: false,
  });

  // ── Phase 3b: file actions (New, Open, Save, Save As) ──
  // The hook returns file state and action callbacks.
  // Passing the editor lets the hook read/write its content.
  const {
    fileName,
    isDirty,
    notification,
    dismissNotification,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
  } = useFileActions(editor);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-text transition-colors duration-150">

      {/* ── Non-blocking notification banner ── */}
      {/* Appears at the top when a file action succeeds or fails. */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "flex items-center justify-between gap-2 px-4 py-1.5 text-xs font-mono select-none",
            "border-b border-border transition-colors duration-150",
            notification.type === "error"
              ? "bg-text text-background"   // High-contrast inverted for errors
              : "bg-surface text-muted",    // Subtle for info messages
          ].join(" ")}
        >
          <span>{notification.text}</span>
          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismissNotification}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-current"
            aria-label="Dismiss notification"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Top formatting & action toolbar */}
      <Toolbar
        editor={editor}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
      />

      {/* Main rich-text editor viewport */}
      <Editor editor={editor} />

      {/* Bottom status bar — shows counts, current file name, and dirty indicator */}
      <StatusBar editor={editor} fileName={fileName} isDirty={isDirty} />
    </div>
  );
}
