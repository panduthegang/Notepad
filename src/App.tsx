import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";

import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import StatusBar from "./components/StatusBar";
import "./App.css";

export default function App() {
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-text">
      {/* Top formatting & action toolbar */}
      <Toolbar editor={editor} />

      {/* Main rich-text editor viewport */}
      <Editor editor={editor} />

      {/* Bottom status bar for statistics */}
      <StatusBar editor={editor} />
    </div>
  );
}
